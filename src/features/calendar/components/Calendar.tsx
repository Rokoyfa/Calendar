import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import type { CalendarController, CalendarState } from '../../../context/HostBridge.ts'
import { nearestView } from '../../../utils/calendarView.ts'
import { matchesCategoryFilter, type CategoryFilter } from '../../../utils/category.ts'
import { isISODate, isTime } from '../../../utils/date.ts'
import { useAttachmentRepository } from '../../attachments/index.ts'
import { CategoryFilterModal, useCategories } from '../../categories/index.ts'
import { useStorage } from '../../storage/index.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts.ts'
import { addDaysToISODate, MINUTES_PER_HOUR, toISODate } from '../../../utils/date.ts'
import {
  createAllDayEventInput,
  createEventInput,
  expandEvents,
  toDuplicateInput,
  toViewerPeriod,
  ZONE_SHIFT_DAYS,
  type EditScope,
  type CalendarEvent,
  type EventInput,
  type EventOccurrence,
  type EventPeriod,
} from '../../../utils/event.ts'
import {
  DeleteEventModal,
  getScopeOptions,
  RecurrenceScopeModal,
  useEvents,
  type CalendarChoice,
  type SaveOptions,
} from '../../events/index.ts'
import { ChatProvider, type ChatAccess } from '../../chat/index.ts'
import { getChatKey } from '../../../utils/chat.ts'
import { isExternalEvent } from '../../../utils/externalCalendar.ts'
import { isCaldavCalendarId, isCaldavEvent } from '../../../utils/caldav.ts'
import { isPeerCalendarId, isPeerEvent, shareIdOf } from '../../../utils/peerCalendar.ts'
import { usePeerCalendars } from '../../peers/index.ts'
import { TasksProvider, TasksView, useTaskEditor, type TaskAccess, type TaskSetup } from '../../tasks/index.ts'
import { CurrentUserEmailContext } from '../context/CurrentUserContext.ts'
import { DraggingEventContext } from '../context/DragContext.ts'
import { useAttendeeCandidates, type AttendeeCandidateLoader } from '../hooks/useAttendeeCandidates.ts'
import { EventSearchModal } from './EventSearchModal.tsx'
import { HolidaysContext } from '../context/HolidaysContext.ts'
import { useHolidays } from '../../holidays/index.ts'
import { UndoNotice } from './UndoNotice.tsx'
import { VIEW_SHORTCUTS } from '../constants/views.ts'
import { EventSourcesContext, NO_EVENT_SOURCES } from '../context/EventSourcesContext.ts'
import { useCalendarView } from '../hooks/useCalendarView.ts'
import { useHostController } from '../hooks/useHostController.ts'
import { useLiveEvents } from '../hooks/useLiveEvents.ts'
import { useEventNavigation } from '../hooks/useEventNavigation.ts'
import { useEventDrag, type DragPreview } from '../hooks/useEventDrag.ts'
import { useNow } from '../hooks/useNow.ts'
import type { EventSources } from '../types/eventSource.ts'
import { toDropInput } from '../utils/eventDrag.ts'
import { getSourceText } from '../utils/eventLabels.ts'
import type { CalendarView, CalendarViewProps } from '../types/view.ts'
import { groupSegmentsByDate } from '../utils/segmentEvents.ts'
import { CalendarHeader } from './CalendarHeader.tsx'
import type { CalendarMenuItem } from './CalendarMenu.tsx'
import { MonthView } from './MonthView.tsx'
import { TimeGridView } from './TimeGridView.tsx'
import { YearView } from './YearView.tsx'
import { AgendaView } from './AgendaView.tsx'
import { useEventEditor, type OpenEventRequest } from '../hooks/useEventEditor.ts'
import { useUndo } from '../hooks/useUndo.ts'
import { useActionError } from '../../../hooks/useActionError.ts'
import { getEditorAccess, withCurrentCalendar } from '../utils/editorAccess.ts'
import { findOverlaps, overlapRange, type OverlapQuery } from '../../../utils/overlap.ts'
import { buildPrintDocument } from '../utils/print.ts'
import { printDocument } from '../utils/printDocument.ts'

const VIEW_COMPONENTS: Record<CalendarView, ComponentType<CalendarViewProps>> = {
  day: TimeGridView,
  week: TimeGridView,
  month: MonthView,
  year: YearView,
  agenda: AgendaView,
  tasks: TasksView,
}

const EventModal = lazy(async () => ({ default: (await import('../../events/components/EventModal.tsx')).EventModal }))

type CalendarProps = {
  calendarIds: readonly string[]
  targetCalendarId: string
  canCreate?: boolean
  calendarChoices?: readonly CalendarChoice[]
  canMoveEvent?: (event: CalendarEvent) => boolean
  readOnly?: boolean
  calendarNames?: ReadonlyMap<string, string>
  canManageCategories?: (calendarId: string) => boolean
  canEditEvent?: (event: CalendarEvent) => boolean
  currentUserId?: string | null
  eventSources?: EventSources
  initialView?: CalendarView
  headerContext?: ReactNode
  headerAccessory?: ReactNode
  menuItems?: readonly CalendarMenuItem[]
  currentUserEmail?: string | null
  loadAttendeeCandidates?: AttendeeCandidateLoader
  chat?: ChatAccess
  externalEvents?: readonly CalendarEvent[]
  isHistoryAvailable?: (calendarId: string) => boolean
  canSetVisibility?: (calendarId: string) => boolean
  openEvent?: OpenEventRequest
  onOpenEventDone?: () => void
  tasks?: TaskSetup
}

type PendingDrop = {
  occurrence: EventOccurrence
  period: EventPeriod
  options: EditScope[]
}

const NO_SHORTCUTS = {}
const NO_NAMES: ReadonlyMap<string, string> = new Map()
const ALWAYS = () => true
const NEVER = () => false
const NO_EXTERNAL_EVENTS: readonly CalendarEvent[] = []
const NO_CHOICES: readonly CalendarChoice[] = []
const READ_ONLY_TASKS: TaskAccess = { canCreateIn: NEVER, canEdit: NEVER, canProgress: NEVER, canDelete: NEVER }

export function Calendar({
  calendarIds,
  targetCalendarId,
  canCreate: mayCreate = true,
  calendarChoices = NO_CHOICES,
  canMoveEvent = NEVER,
  readOnly: forcedReadOnly = false,
  calendarNames = NO_NAMES,
  canManageCategories = ALWAYS,
  canEditEvent = ALWAYS,
  currentUserId = null,
  eventSources = NO_EVENT_SOURCES,
  initialView,
  headerContext,
  headerAccessory,
  menuItems,
  currentUserEmail = null,
  loadAttendeeCandidates,
  chat,
  externalEvents = NO_EXTERNAL_EVENTS,
  isHistoryAvailable = NEVER,
  canSetVisibility = NEVER,
  openEvent: linkedEvent,
  onOpenEventDone,
  tasks,
}: CalendarProps) {
  const i18n = useI18n()
  const { features, views: hostViews, readOnly: hostReadOnly = false } = useHost()
  const { invalidate, events: eventRepository, personalSharing, tasks: taskRepository } = useStorage()
  const peers = usePeerCalendars()
  const attachmentRepository = useAttachmentRepository()
  const readOnly = forcedReadOnly || hostReadOnly
  const canCreate = mayCreate && !readOnly
  const now = useNow()
  const today = toISODate(now)
  const {
    view,
    setView,
    anchor,
    range,
    dates,
    definition,
    title,
    subtitle,
    previous,
    next,
    goToToday,
    goToDate,
    show,
  } = useCalendarView(initialView, linkedEvent?.date)
  const [tasksUnsupported, setTasksUnsupported] = useState(false)
  const markTasksUnsupported = useCallback(() => setTasksUnsupported(true), [])
  const taskSetup = useMemo(
    () =>
      !tasks || !features.tasks || tasksUnsupported
        ? undefined
        : readOnly
          ? { ...tasks, access: READ_ONLY_TASKS }
          : tasks,
    [tasks, features.tasks, tasksUnsupported, readOnly],
  )
  const hasTasks = taskSetup !== undefined && taskRepository !== undefined
  const canCreateTasks =
    hasTasks &&
    (taskSetup.access.canCreateIn(taskSetup.targetCalendarId) ||
      taskSetup.choices.some((choice) => taskSetup.access.canCreateIn(choice.id)))
  const views = useMemo(
    () => (hasTasks ? hostViews : hostViews.filter((name) => name !== 'tasks')),
    [hasTasks, hostViews],
  )
  useEffect(() => {
    if (views.length > 0 && !views.includes(view)) setView(nearestView(view, views))
  }, [views, view, setView])
  const taskEditor = useTaskEditor()
  const isTaskView = view === 'tasks'
  const { events, error, createEvent, updateEvent, deleteEvent, moveEvent, respond, setReminders } = useEvents({
    ...range,
    calendarIds,
    targetCalendarId,
  })
  const holidays = useHolidays(range)
  const viewerTimeZone = useViewerTimeZone()
  const categoryCalendarIds = useMemo(
    () => calendarIds.filter((id) => !isCaldavCalendarId(id) && !isPeerCalendarId(id)),
    [calendarIds],
  )
  const { isAvailable: hasCategories, categories, create: createCategory } = useCategories(categoryCalendarIds)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const activeFilter = categories.length > 0 ? categoryFilter : null
  const occurrences = useMemo(() => {
    const all = externalEvents.length > 0 ? [...events, ...externalEvents] : events
    const expanded = expandEvents(all, range.from, range.to, viewerTimeZone)
    if (activeFilter === null) return expanded
    const known = new Set(categories.map((category) => category.id))
    return expanded.filter(
      (occurrence) =>
        isExternalEvent(occurrence) ||
        isCaldavEvent(occurrence) ||
        isPeerEvent(occurrence) ||
        matchesCategoryFilter(occurrence.categoryIds, known, activeFilter),
    )
  }, [events, externalEvents, range, viewerTimeZone, categories, activeFilter])
  const draggableByKey = useMemo(
    () =>
      new Map(
        occurrences
          .filter(
            (occurrence) =>
              !isExternalEvent(occurrence) &&
              ((!isCaldavEvent(occurrence) && !isPeerEvent(occurrence)) || canEditEvent(occurrence)),
          )
          .map((occurrence) => [occurrence.occurrenceKey, occurrence]),
      ),
    [occurrences, canEditEvent],
  )
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)
  const { error: actionError, setError: setActionError, attempt } = useActionError()
  const undo = useUndo(features.undo, attempt)
  const segmentsByDate = useMemo(() => {
    const shown = dragPreview
      ? occurrences.map((occurrence) =>
          occurrence.occurrenceKey === dragPreview.occurrenceKey
            ? { ...occurrence, ...dragPreview.period }
            : occurrence,
        )
      : occurrences
    return groupSegmentsByDate(shown, range)
  }, [occurrences, dragPreview, range])
  const mainRef = useRef<HTMLElement>(null)
  const editor = useEventEditor({
    occurrences,
    canCreate,
    viewerTimeZone,
    linkedEvent,
    onLinkedEventDone: onOpenEventDone,
  })
  const shownEditor = editor.shown
  useLiveEvents({
    enabled: features.liveUpdates,
    calendarIds,
    onChange: ({ eventId, version, changedBy }) => {
      if (eventId === null || (changedBy !== null && changedBy === currentUserId)) return
      editor.noteRemoteChange({ eventId, version })
    },
  })

  const [eventToDelete, setEventToDelete] = useState<EventOccurrence | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const editorCalendarId = shownEditor
    ? (shownEditor.calendarId ?? shownEditor.occurrence?.calendarId ?? targetCalendarId)
    : null
  const attendeeCandidates = useAttendeeCandidates(loadAttendeeCandidates, editorCalendarId)

  const createNow = () =>
    isTaskView ? taskEditor.openCreate() : editor.openCreate(view === 'day' ? anchor : today, now.getHours())
  const canCreateHere = isTaskView ? canCreateTasks : canCreate

  const switchToTask = ({ title, date }: { title: string; date: string | null }) => {
    editor.close()
    taskEditor.openCreate({
      title,
      dueDate: date,
      calendarId: editorCalendarId && taskSetup?.access.canCreateIn(editorCalendarId) ? editorCalendarId : undefined,
    })
  }

  const switchToEvent = ({ title, date }: { title: string; date: string | null }) => {
    taskEditor.close()
    editor.openDraft({
      ...createEventInput(date ?? (view === 'day' ? anchor : today), now.getHours(), viewerTimeZone),
      title,
    })
  }

  const closeEditor = editor.close

  const print = () =>
    printDocument(
      buildPrintDocument({
        title,
        subtitle,
        view,
        dates,
        occurrences,
        holidays,
        calendarName: (calendarId) => calendarNames.get(calendarId) ?? eventSources.get(calendarId)?.name,
        language: i18n.locale,
        format: i18n.format,
        texts: { allDay: i18n.m.events.allDay, empty: i18n.m.calendar.print.empty },
      }),
    )

  const overlapCalendarId = editorCalendarId && isPeerCalendarId(editorCalendarId) ? editorCalendarId : null
  const checkOverlaps = useCallback(
    async (query: OverlapQuery) => {
      const { from, to } = overlapRange(query)
      if (overlapCalendarId) {
        const busy = await eventRepository.list({ from, to, calendarIds: [overlapCalendarId] })
        return findOverlaps(query, busy, viewerTimeZone, currentUserEmail)
      }
      const own = calendarIds.filter((id) => !isPeerCalendarId(id))
      const found = await eventRepository.list({ from, to, calendarIds: own })
      return findOverlaps(query, [...found, ...externalEvents], viewerTimeZone, currentUserEmail)
    },
    [eventRepository, calendarIds, overlapCalendarId, externalEvents, viewerTimeZone, currentUserEmail],
  )

  const openSearchResult = (event: CalendarEvent, date: string) => {
    setIsSearchOpen(false)
    const occurrence = expandEvents(
      [event],
      addDaysToISODate(date, -ZONE_SHIFT_DAYS),
      addDaysToISODate(date, ZONE_SHIFT_DAYS),
      viewerTimeZone,
    ).find((candidate) => candidate.occurrenceDate === date)
    goToDate(occurrence?.startDate ?? date)
    if (occurrence) editor.openEdit(occurrence)
  }

  const duplicate = (input: EventInput) =>
    editor.duplicate(toDuplicateInput(input), i18n.m.events.duplicateNotice(input.title))

  const removeEvent = async (occurrence: EventOccurrence, scope: EditScope) => {
    const revert = await deleteEvent(occurrence, scope)
    setEventToDelete(null)
    closeEditor()
    undo.offerUndo(i18n.m.calendar.undo.deleted(occurrence.title), revert)
  }

  const requestDelete = async (occurrence: EventOccurrence) => {
    if (!features.undo || getScopeOptions(occurrence).length > 1) setEventToDelete(occurrence)
    else await removeEvent(occurrence, 'all')
  }

  const uploadAttachments = async (eventId: string, files: readonly File[]) => {
    if (!attachmentRepository || files.length === 0) return
    const failed: string[] = []
    for (const file of files) {
      try {
        await attachmentRepository.upload(eventId, file)
      } catch {
        failed.push(file.name)
      }
    }
    invalidate()
    if (failed.length > 0) setActionError(i18n.m.events.attachments.notUploaded(failed.join(', ')))
  }

  const handleSave = async (
    input: EventInput,
    scope: EditScope,
    attachments: readonly File[],
    options?: SaveOptions,
  ) => {
    const occurrence = shownEditor?.occurrence
    const target = editorCalendarId ?? targetCalendarId
    if (occurrence) {
      await updateEvent(occurrence, input, scope, options)
      if (moveEvent && target !== occurrence.calendarId) {
        const moved = await moveEvent(occurrence, target, false)
        undo.offerUndo(i18n.m.calendar.undo.moved(input.title), moved.undo)
      }
    } else await uploadAttachments((await createEvent(input, target)).id, attachments)
    closeEditor()
    goToDate(toViewerPeriod(input, input.timeZone, viewerTimeZone).startDate)
  }

  const saveDrop = async (occurrence: EventOccurrence, period: EventPeriod, scope: EditScope) => {
    setPendingDrop(null)
    await attempt(async () => {
      const revert = await updateEvent(occurrence, toDropInput(occurrence, period, viewerTimeZone, scope), scope)
      undo.offerUndo(i18n.m.calendar.undo.moved(occurrence.title), revert)
    })
    setDragPreview(null)
  }

  const handleDrop = (occurrence: EventOccurrence, period: EventPeriod) => {
    setDragPreview({ occurrenceKey: occurrence.occurrenceKey, period })
    const options = getScopeOptions(occurrence)
    if (options.length > 1) setPendingDrop({ occurrence, period, options })
    else void saveDrop(occurrence, period, options[0])
  }

  useEventDrag({
    containerRef: mainRef,
    enabled: canCreate,
    occurrences: draggableByKey,
    onPreview: setDragPreview,
    onDrop: handleDrop,
  })

  const showView = (wanted: CalendarView, date: string) => {
    const target = nearestView(wanted, views)
    if (target === wanted || target !== view) show(target, date)
    else goToDate(date)
  }
  const selectView = (wanted: CalendarView) => (views.includes(wanted) ? () => setView(wanted) : undefined)

  useKeyboardShortcuts(
    features.shortcuts
      ? {
          ArrowLeft: definition.isFixed ? undefined : previous,
          ArrowRight: definition.isFixed ? undefined : next,
          t: definition.isFixed ? undefined : goToToday,
          '/': features.search ? () => setIsSearchOpen(true) : undefined,
          n: canCreateHere ? createNow : undefined,
          [VIEW_SHORTCUTS.day]: selectView('day'),
          [VIEW_SHORTCUTS.week]: selectView('week'),
          [VIEW_SHORTCUTS.month]: selectView('month'),
          [VIEW_SHORTCUTS.year]: selectView('year'),
          j: selectView('year'),
          [VIEW_SHORTCUTS.agenda]: selectView('agenda'),
          [VIEW_SHORTCUTS.tasks]: selectView('tasks'),
          'mod+z': undo.offer ? () => void undo.run() : undefined,
        }
      : NO_SHORTCUTS,
  )

  const state = useMemo<CalendarState>(
    () => ({ view, date: anchor, from: dates[0], to: dates[dates.length - 1] }),
    [view, anchor, dates],
  )
  const controller: CalendarController = {
    getState: () => state,
    goToDate,
    setView: (wanted) => {
      if (!views.includes(wanted)) return false
      setView(wanted)
      return true
    },
    next,
    previous,
    today: goToToday,
    openEvent: (eventId, date) => {
      goToDate(date)
      editor.openFromHost(eventId, date)
    },
    createEvent: (draft = {}) => {
      if (!canCreate) return false
      const startDate = isISODate(draft.startDate) ? draft.startDate : view === 'day' ? anchor : today
      const base = draft.allDay
        ? createAllDayEventInput(
            startDate,
            isISODate(draft.endDate) && draft.endDate >= startDate ? draft.endDate : startDate,
          )
        : createEventInput(startDate, now.getHours(), viewerTimeZone)
      const times =
        !draft.allDay && isTime(draft.start) && isTime(draft.end)
          ? { start: draft.start, end: draft.end, endDate: isISODate(draft.endDate) ? draft.endDate : startDate }
          : {}
      editor.openDraft({
        ...base,
        ...times,
        title: draft.title ?? '',
        location: draft.location ?? '',
        description: draft.description ?? '',
      })
      return true
    },
    refresh: invalidate,
  }
  useHostController(controller, state)
  useEventNavigation(mainRef)

  const ViewComponent = VIEW_COMPONENTS[view]
  const editorSource = shownEditor?.occurrence ? eventSources.get(shownEditor.occurrence.calendarId) : undefined
  const editorOccurrence = shownEditor?.occurrence ?? null
  const {
    isExternal: editorIsExternal,
    isCaldav: editorIsCaldav,
    isPeer: editorIsPeer,
    isLocked: editorIsLocked,
    canChooseCalendar,
  } = getEditorAccess({
    occurrence: editorOccurrence,
    readOnly,
    canCreate,
    supportsMove: moveEvent !== undefined,
    canEditEvent,
    canMoveEvent,
  })
  const calendarField =
    shownEditor && canChooseCalendar && editorCalendarId
      ? {
          value: editorCalendarId,
          options: withCurrentCalendar(
            calendarChoices,
            editorOccurrence,
            editorOccurrence
              ? (calendarNames.get(editorOccurrence.calendarId) ??
                  eventSources.get(editorOccurrence.calendarId)?.name ??
                  '')
              : '',
          ),
          onChange: editor.setCalendarId,
        }
      : undefined
  const peerShareId = editorCalendarId ? shareIdOf(editorCalendarId) : null
  const peerOwner = peerShareId
    ? (peers.calendars.find((calendar) => calendar.id === peerShareId)?.ownerName ?? '')
    : undefined
  const editorRequest = editorOccurrence?.request ?? null
  const isOwnRequest = editorIsPeer && editorRequest?.mine === true
  const isForeign = editorIsExternal || editorIsCaldav || editorIsPeer
  const peerNotice =
    peerOwner === undefined
      ? undefined
      : !editorOccurrence
        ? i18n.m.peers.requestHint(peerOwner)
        : isOwnRequest
          ? editorRequest?.status === 'pending'
            ? i18n.m.peers.requestPending(peerOwner)
            : i18n.m.peers.requestAccepted(peerOwner)
          : i18n.m.peers.eventNotice(peerOwner)
  const decision =
    personalSharing && editorOccurrence && !editorIsPeer && editorRequest?.status === 'pending' && !readOnly
      ? {
          requester: editorRequest.requester?.name ?? null,
          onAccept: async () => {
            await personalSharing.acceptRequest(editorOccurrence.id)
            closeEditor()
            invalidate()
          },
          onDecline: async () => {
            await personalSharing.declineRequest(editorOccurrence.id)
            closeEditor()
            invalidate()
          },
        }
      : undefined
  const requesterNotice =
    !editorIsPeer && editorRequest?.status === 'accepted' && editorRequest.requester
      ? i18n.m.peers.decision.acceptedBy(editorRequest.requester.name)
      : undefined

  return (
    <HolidaysContext value={holidays}>
      <ChatProvider access={chat} calendarIds={calendarIds}>
        <EventSourcesContext value={eventSources}>
          <CurrentUserEmailContext value={currentUserEmail}>
            <DraggingEventContext value={dragPreview?.occurrenceKey ?? null}>
              <CalendarHeader
                view={view}
                views={views}
                title={title}
                subtitle={subtitle}
                onViewChange={setView}
                navigation={definition.isFixed ? undefined : { onPrevious: previous, onNext: next, onToday: goToToday }}
                onSearch={features.search ? () => setIsSearchOpen(true) : undefined}
                onPrint={features.print && !isTaskView ? print : undefined}
                onFilter={categories.length > 0 && !isTaskView ? () => setIsFilterOpen(true) : undefined}
                isFiltered={activeFilter !== null}
                onCreate={canCreate && !isTaskView ? createNow : undefined}
                context={headerContext}
                accessory={headerAccessory}
                menuItems={menuItems}
              />

              <ErrorMessage message={error} className="textCenter" />
              <ErrorMessage message={actionError} className="textCenter" />

              <TasksProvider
                setup={taskSetup}
                range={range}
                today={today}
                categories={hasCategories ? categories : undefined}
                onCreateCategory={hasCategories && !readOnly ? createCategory : undefined}
                includeList={isTaskView}
                editor={taskEditor}
                onSwitchToEvent={canCreate ? switchToEvent : undefined}
                onUnsupported={markTasksUnsupported}
                onError={setActionError}
              >
                <main ref={mainRef} className="main scrollArea" data-view={view}>
                  <ViewComponent
                    anchor={anchor}
                    dates={dates}
                    today={today}
                    currentMinutes={now.getHours() * MINUTES_PER_HOUR + now.getMinutes()}
                    segmentsByDate={segmentsByDate}
                    canCreate={canCreate}
                    onCreate={editor.openCreate}
                    onCreateRange={editor.openCreateRange}
                    onCreateAllDay={editor.openCreateAllDay}
                    onEventSelect={editor.openEdit}
                    onShowDay={(date) => showView('day', date)}
                    onShowMonth={(date) => showView('month', date)}
                  />
                </main>
              </TasksProvider>

              {shownEditor && (
                <Suspense fallback={null}>
                  <EventModal
                    readOnly={readOnly || editorIsExternal || editorIsLocked}
                    showAttachments={!isForeign}
                    history={
                      features.history &&
                      shownEditor.occurrence &&
                      !isForeign &&
                      isHistoryAvailable(shownEditor.occurrence.calendarId)
                        ? { eventId: shownEditor.occurrence.id, calendarNames }
                        : undefined
                    }
                    canEditAttachments={!readOnly && (!shownEditor.occurrence || canEditEvent(shownEditor.occurrence))}
                    categories={categories.filter((category) => category.calendarId === editorCalendarId)}
                    onCreateCategory={
                      hasCategories && editorCalendarId && canManageCategories(editorCalendarId)
                        ? (name) => createCategory(editorCalendarId, name)
                        : undefined
                    }
                    key={shownEditor.occurrence?.occurrenceKey ?? 'new'}
                    calendarField={calendarField}
                    checkOverlaps={
                      features.overlapWarnings && !readOnly && !editorIsExternal && !editorIsLocked
                        ? checkOverlaps
                        : undefined
                    }
                    initialValue={shownEditor.initialValue}
                    occurrence={shownEditor.occurrence}
                    attendeeOptions={
                      features.attendees
                        ? {
                            candidates: attendeeCandidates,
                            ownEmail: currentUserEmail,
                            onRespond:
                              respond && shownEditor.occurrence && !editorIsExternal && !editorIsPeer
                                ? (status) => respond(shownEditor.occurrence!, status)
                                : undefined,
                          }
                        : undefined
                    }
                    requestTo={peerOwner}
                    showVisibility={
                      features.personalSharing &&
                      Boolean(personalSharing) &&
                      editorCalendarId !== null &&
                      canSetVisibility(editorCalendarId)
                    }
                    decision={decision}
                    onSwitchToTask={
                      canCreateTasks &&
                      !shownEditor.occurrence &&
                      !editorIsPeer &&
                      !isCaldavCalendarId(editorCalendarId ?? '')
                        ? switchToTask
                        : undefined
                    }
                    notice={
                      shownEditor.notice ??
                      peerNotice ??
                      requesterNotice ??
                      (editorIsExternal && editorSource
                        ? i18n.m.external.eventNotice(editorSource.name)
                        : editorIsCaldav && editorSource
                          ? i18n.m.caldav.eventNotice(editorSource.name)
                          : editorSource && i18n.m.calendar.sharedEventNotice(getSourceText(editorSource, i18n)))
                    }
                    onSave={handleSave}
                    remoteChange={editor.remoteState}
                    onReload={() => {
                      closeEditor()
                      invalidate()
                    }}
                    onDelete={
                      shownEditor.occurrence && !editorIsExternal && (!editorIsPeer || isOwnRequest)
                        ? () => requestDelete(shownEditor.occurrence!)
                        : undefined
                    }
                    chat={
                      shownEditor.occurrence &&
                      !editorIsExternal &&
                      chat?.isAvailable(shownEditor.occurrence.calendarId)
                        ? {
                            key: getChatKey(shownEditor.occurrence),
                            calendarId: shownEditor.occurrence.calendarId,
                          }
                        : undefined
                    }
                    initialTab={shownEditor.initialTab}
                    onDuplicate={
                      features.duplicate && shownEditor.occurrence && canCreate && !editorIsPeer ? duplicate : undefined
                    }
                    onRemindersChange={
                      setReminders && shownEditor.occurrence && !editorIsExternal && !editorIsPeer
                        ? async (reminders) => {
                            await setReminders(shownEditor.occurrence!, reminders)
                            closeEditor()
                          }
                        : undefined
                    }
                    onClose={closeEditor}
                  />
                </Suspense>
              )}

              {isFilterOpen && (
                <CategoryFilterModal
                  categories={categories}
                  calendarNames={calendarNames}
                  value={activeFilter}
                  onChange={setCategoryFilter}
                  onClose={() => setIsFilterOpen(false)}
                />
              )}

              {isSearchOpen && features.search && (
                <EventSearchModal
                  calendarIds={calendarIds}
                  today={today}
                  onSelect={openSearchResult}
                  onClose={() => setIsSearchOpen(false)}
                />
              )}

              {pendingDrop && (
                <RecurrenceScopeModal
                  options={pendingDrop.options}
                  onSelect={(scope) => void saveDrop(pendingDrop.occurrence, pendingDrop.period, scope)}
                  onClose={() => {
                    setPendingDrop(null)
                    setDragPreview(null)
                  }}
                />
              )}

              {eventToDelete && (
                <DeleteEventModal
                  occurrence={eventToDelete}
                  onConfirm={(scope) => removeEvent(eventToDelete, scope)}
                  onClose={() => setEventToDelete(null)}
                  movesToTrash={features.trash && Boolean(eventRepository.restore)}
                />
              )}
              {undo.offer && (
                <UndoNotice
                  key={undo.offer.id}
                  message={undo.offer.message}
                  onUndo={() => void undo.run()}
                  onDismiss={undo.dismiss}
                />
              )}
            </DraggingEventContext>
          </CurrentUserEmailContext>
        </EventSourcesContext>
      </ChatProvider>
    </HolidaysContext>
  )
}
