import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import type { PopoverAnchor } from '../../../components/AnchoredPopover.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { nearestView } from '../../../domain/calendarView.ts'
import type { CategoryFilter } from '../../../domain/category.ts'
import {
  createAllDayEventInput,
  createEventInput,
  createEventInputForSlots,
  expandEvents,
  toDuplicateInput,
  toOccurrenceInput,
  ZONE_SHIFT_DAYS,
  type CalendarEvent,
  type EventInput,
  type EventOccurrence,
} from '../../../domain/event.ts'
import { useActionError } from '../../../hooks/useActionError.ts'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts.ts'
import { useI18n } from '../../../i18n/index.ts'
import { addDaysToISODate, MINUTES_PER_HOUR, toISODate } from '../../../utils/date.ts'
import { isCaldavCalendarId } from '../../caldav/index.ts'
import { CategoryFilterModal, useCategories } from '../../categories/index.ts'
import { ChatProvider, type ChatAccess } from '../../chat/index.ts'
import { DeleteEventModal, RecurrenceScopeModal, useEvents, type CalendarChoice } from '../../events/index.ts'
import { useHolidays } from '../../holidays/index.ts'
import { isPeerCalendarId } from '../../peers/index.ts'
import { usePreferences } from '../../preferences/index.ts'
import { useStorage } from '../../storage/index.ts'
import {
  isPlanPreviewEvent,
  TaskPlanPreviewActions,
  TaskPlanPreviewBar,
  TasksProvider,
  TasksView,
  useTaskEditor,
  type TaskAccess,
  type TaskSetup,
} from '../../tasks/index.ts'
import { VIEW_SHORTCUTS } from '../constants/views.ts'
import { CurrentUserEmailContext } from '../context/CurrentUserContext.ts'
import { DraggingEventContext } from '../context/DragContext.ts'
import { EventSourcesContext, NO_EVENT_SOURCES } from '../context/EventSourcesContext.ts'
import { HolidaysContext } from '../context/HolidaysContext.ts'
import { useAttendeeCandidates, type AttendeeCandidateLoader } from '../hooks/useAttendeeCandidates.ts'
import { useCalendarController } from '../hooks/useCalendarController.ts'
import { useCalendarOccurrences } from '../hooks/useCalendarOccurrences.ts'
import { useCalendarView } from '../hooks/useCalendarView.ts'
import { useEventDrag, type DragPreview } from '../hooks/useEventDrag.ts'
import { useEventEditor, type OpenEventRequest } from '../hooks/useEventEditor.ts'
import { useEventActions } from '../hooks/useEventActions.ts'
import { useEventNavigation } from '../hooks/useEventNavigation.ts'
import { useLiveEvents } from '../hooks/useLiveEvents.ts'
import { useNow } from '../hooks/useNow.ts'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation.ts'
import { usePointerAnchor } from '../hooks/usePointerAnchor.ts'
import { useOverlapChecks } from '../hooks/useOverlapChecks.ts'
import { usePlanPreview } from '../hooks/usePlanPreview.ts'
import { useUndo } from '../hooks/useUndo.ts'
import type { EventSources } from '../types/eventSource.ts'
import type { CalendarView, CalendarViewProps } from '../types/view.ts'
import { isDraftEvent, toDraftEvent } from '../utils/draftEvent.ts'
import { buildPrintDocument } from '../utils/print.ts'
import { printDocument } from '../utils/printDocument.ts'
import { readTourSeen, writeTourSeen } from '../utils/tour.ts'
import { AgendaView } from './AgendaView.tsx'
import { CalendarEventEditor } from './CalendarEventEditor.tsx'
import { CalendarEventPeek } from './CalendarEventPeek.tsx'
import { CalendarHeader } from './CalendarHeader.tsx'
import type { CalendarMenuItem } from './CalendarMenu.tsx'
import { EventSearchModal } from './EventSearchModal.tsx'
import { MonthView } from './MonthView.tsx'
import { OnboardingTour } from './OnboardingTour.tsx'
import { ShortcutHelp } from './ShortcutHelp.tsx'
import { QuickCreate } from './QuickCreate.tsx'
import { TimeGridView } from './TimeGridView.tsx'
import { UndoNotice } from './UndoNotice.tsx'
import { YearView } from './YearView.tsx'

const VIEW_COMPONENTS: Record<CalendarView, ComponentType<CalendarViewProps>> = {
  day: TimeGridView,
  week: TimeGridView,
  month: MonthView,
  year: YearView,
  agenda: AgendaView,
  tasks: TasksView,
}

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
  tour?: { scope: string }
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
  tour,
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
  const { invalidate, events: eventRepository, tasks: taskRepository } = useStorage()
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
  const hasPlanner = taskSetup?.planning !== undefined
  const tourOptions = useMemo(
    () => ({
      isTouch: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
      hasShortcuts: features.shortcuts,
      canCreateTasks,
      hasTasks,
      hasPlanner,
    }),
    [features.shortcuts, canCreateTasks, hasTasks, hasPlanner],
  )
  const views = useMemo(
    () => (hasTasks ? hostViews : hostViews.filter((name) => name !== 'tasks')),
    [hasTasks, hostViews],
  )
  useEffect(() => {
    if (views.length > 0 && !views.includes(view)) setView(nearestView(view, views))
  }, [views, view, setView])
  const showView = (wanted: CalendarView, date: string) => {
    const target = nearestView(wanted, views)
    if (target === wanted || target !== view) show(target, date)
    else goToDate(date)
  }
  const taskEditor = useTaskEditor()
  const isTaskView = view === 'tasks'
  const eventData = useEvents({
    ...range,
    calendarIds,
    targetCalendarId,
  })
  const { events, error, moveEvent, respond, setReminders } = eventData
  const holidays = useHolidays(range)
  const viewerTimeZone = useViewerTimeZone()
  const categoryCalendarIds = useMemo(
    () => calendarIds.filter((id) => !isCaldavCalendarId(id) && !isPeerCalendarId(id)),
    [calendarIds],
  )
  const { isAvailable: hasCategories, categories, create: createCategory } = useCategories(categoryCalendarIds)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const activeFilter = hasCategories ? categoryFilter : null
  const { error: actionError, setError: setActionError, attempt } = useActionError()
  const planPreview = usePlanPreview({
    view,
    anchor,
    show,
    showView,
    attempt,
    clearError: () => setActionError(null),
    openTask: taskEditor.openEdit,
  })
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [peek, setPeek] = useState<{ occurrence: EventOccurrence; anchor: PopoverAnchor } | null>(null)
  const [quickDraft, setQuickDraft] = useState<{ input: EventInput; anchor: PopoverAnchor } | null>(null)
  const draftEvent = useMemo(
    () =>
      quickDraft
        ? toDraftEvent(
            quickDraft.input,
            targetCalendarId,
            quickDraft.input.title || i18n.m.calendar.quickCreate.untitled,
          )
        : null,
    [quickDraft, targetCalendarId, i18n],
  )
  const { occurrences, draggableByKey, segmentsByDate } = useCalendarOccurrences({
    events,
    externalEvents,
    range,
    viewerTimeZone,
    categories,
    filter: activeFilter,
    planPreview: planPreview.preview,
    draft: draftEvent,
    dragPreview,
    canEditEvent,
  })
  const undo = useUndo(features.undo, attempt)
  const mainRef = useRef<HTMLElement>(null)
  const pointerAnchor = usePointerAnchor(mainRef)
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

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false)
  const tourScope = tour && features.tips && !readOnly ? tour.scope : null
  const [tourStart, setTourStart] = useState<'auto' | 'manual' | null>(() =>
    tourScope !== null && !readTourSeen(tourScope) ? 'auto' : null,
  )
  const closeTour = () => {
    if (tourScope !== null) writeTourSeen(tourScope)
    setTourStart(null)
  }
  const editorCalendarId = shownEditor
    ? (shownEditor.calendarId ?? shownEditor.occurrence?.calendarId ?? targetCalendarId)
    : null
  const attendeeCandidates = useAttendeeCandidates(loadAttendeeCandidates, editorCalendarId)
  const { checkOverlaps, checkPlanConflicts, planCalendarIds } = useOverlapChecks({
    eventRepository,
    calendarIds,
    editorCalendarId,
    externalEvents,
    viewerTimeZone,
    currentUserEmail,
    planning: taskSetup?.planning,
  })

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

  const { openEdit: openTaskEdit } = taskEditor
  const planningDistribution = usePreferences().preferences.planningDistribution
  const replanTask = useCallback(
    async (taskId: string) => {
      if (!taskSetup || !taskRepository) return
      const open = await taskRepository.list({ calendarIds: taskSetup.calendarIds, completed: false })
      const task = open.find((entry) => entry.id === taskId)
      if (task) openTaskEdit(task, planningDistribution)
    },
    [taskSetup, taskRepository, openTaskEdit, planningDistribution],
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

  const actions = useEventActions({
    events: eventData,
    undo,
    attempt,
    setError: setActionError,
    editedOccurrence: shownEditor?.occurrence,
    targetCalendarId,
    viewerTimeZone,
    closeEditor,
    goToDate,
    setDragPreview,
  })

  useEventDrag({
    containerRef: mainRef,
    enabled: canCreate && !planPreview.preview,
    occurrences: draggableByKey,
    onPreview: setDragPreview,
    onDrop: actions.drop,
  })

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
          '?': () => setIsShortcutHelpOpen(true),
        }
      : NO_SHORTCUTS,
  )

  useCalendarController({
    view,
    views,
    anchor,
    dates,
    today,
    now,
    viewerTimeZone,
    canCreate,
    editor,
    setView,
    goToDate,
    next,
    previous,
    goToToday,
    refresh: invalidate,
  })
  useEventNavigation(mainRef)
  useSwipeNavigation(mainRef, !definition.isFixed && !planPreview.preview, previous, next)

  const selectEvent = (occurrence: EventOccurrence) => {
    if (!isPlanPreviewEvent(occurrence) && !isDraftEvent(occurrence)) setPeek({ occurrence, anchor: pointerAnchor() })
  }
  const startCreate = (input: EventInput) => {
    if (!canCreate) return
    if (isPeerCalendarId(targetCalendarId)) editor.openDraft(input)
    else setQuickDraft({ input, anchor: pointerAnchor() })
  }
  const saveQuickDraft = (input: EventInput) => attempt(() => eventData.createEvent(input, targetCalendarId))
  const canCreateInView = canCreate && !planPreview.preview

  const ViewComponent = VIEW_COMPONENTS[view]

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
                onFilter={hasCategories && !isTaskView ? () => setIsFilterOpen(true) : undefined}
                isFiltered={activeFilter !== null}
                onCreate={canCreateInView && !isTaskView ? createNow : undefined}
                context={headerContext}
                jump={
                  definition.isFixed
                    ? undefined
                    : { anchor, today, range: { from: dates[0], to: dates[dates.length - 1] }, onSelect: goToDate }
                }
                accessory={
                  planPreview.preview ? (
                    <TaskPlanPreviewActions
                      isSaving={planPreview.isSaving}
                      onSave={() => void planPreview.save()}
                      onCancel={planPreview.end}
                    />
                  ) : (
                    headerAccessory
                  )
                }
                menuItems={menuItems}
                onShortcuts={features.shortcuts ? () => setIsShortcutHelpOpen(true) : undefined}
                onTour={tourScope !== null ? () => setTourStart('manual') : undefined}
              />

              {planPreview.preview && (
                <TaskPlanPreviewBar
                  preview={planPreview.preview}
                  isSaving={planPreview.isSaving}
                  onBack={planPreview.back}
                />
              )}
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
                onPlanPreview={views.includes('week') || views.includes('day') ? planPreview.start : undefined}
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
                    canCreate={canCreateInView}
                    onCreate={(date, hour) => startCreate(createEventInput(date, hour, viewerTimeZone))}
                    onCreateRange={({ first, last }) =>
                      startCreate(createEventInputForSlots(first, last, viewerTimeZone))
                    }
                    onCreateAllDay={(date) => startCreate(createAllDayEventInput(date))}
                    onEventSelect={selectEvent}
                    onShowDay={(date) => showView('day', date)}
                    onShowMonth={(date) => showView('month', date)}
                  />
                </main>
              </TasksProvider>

              {peek && (
                <CalendarEventPeek
                  occurrence={peek.occurrence}
                  anchor={peek.anchor}
                  readOnly={readOnly}
                  canCreate={canCreate}
                  supportsMove={moveEvent !== undefined}
                  canEditEvent={canEditEvent}
                  canMoveEvent={canMoveEvent}
                  onOpen={() => {
                    setPeek(null)
                    editor.openEdit(peek.occurrence)
                  }}
                  onDuplicate={() => {
                    setPeek(null)
                    duplicate(toOccurrenceInput(peek.occurrence))
                  }}
                  onDelete={() => {
                    setPeek(null)
                    void actions.requestDelete(peek.occurrence)
                  }}
                  onClose={() => setPeek(null)}
                />
              )}

              {quickDraft && (
                <QuickCreate
                  draft={quickDraft.input}
                  anchor={quickDraft.anchor}
                  calendarName={
                    calendarIds.length > 1
                      ? (calendarNames.get(targetCalendarId) ?? eventSources.get(targetCalendarId)?.name)
                      : undefined
                  }
                  onTitleChange={(title) =>
                    setQuickDraft((current) => current && { ...current, input: { ...current.input, title } })
                  }
                  onSave={(title) => saveQuickDraft({ ...quickDraft.input, title })}
                  onMore={(title) => {
                    setQuickDraft(null)
                    editor.openDraft({ ...quickDraft.input, title })
                  }}
                  onClose={() => setQuickDraft(null)}
                />
              )}

              {shownEditor && editorCalendarId && (
                <CalendarEventEditor
                  key={shownEditor.occurrence?.occurrenceKey ?? 'new'}
                  editor={editor}
                  shown={shownEditor}
                  calendarId={editorCalendarId}
                  readOnly={readOnly}
                  canCreate={canCreate}
                  supportsMove={moveEvent !== undefined}
                  canEditEvent={canEditEvent}
                  canMoveEvent={canMoveEvent}
                  calendarChoices={calendarChoices}
                  calendarNames={calendarNames}
                  eventSources={eventSources}
                  categories={categories}
                  hasCategories={hasCategories}
                  canManageCategories={canManageCategories}
                  createCategory={createCategory}
                  checkOverlaps={checkOverlaps}
                  planConflicts={{
                    calendarIds: planCalendarIds,
                    check: checkPlanConflicts,
                    onReplan: (taskId) => void replanTask(taskId),
                  }}
                  attendeeCandidates={attendeeCandidates}
                  currentUserEmail={currentUserEmail}
                  respond={respond}
                  setReminders={setReminders}
                  canSetVisibility={canSetVisibility}
                  isHistoryAvailable={isHistoryAvailable}
                  chat={chat}
                  onSwitchToTask={canCreateTasks ? switchToTask : undefined}
                  onSave={(...args) => actions.save(editorCalendarId, ...args)}
                  onDelete={actions.requestDelete}
                  onDuplicate={duplicate}
                />
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

              {isShortcutHelpOpen && features.shortcuts && (
                <ShortcutHelp
                  views={views}
                  canNavigate={!definition.isFixed}
                  canCreate={canCreateHere}
                  hasSearch={features.search}
                  hasUndo={features.undo}
                  onClose={() => setIsShortcutHelpOpen(false)}
                />
              )}

              {tourStart && tourScope !== null && (
                <OnboardingTour options={tourOptions} focusOnStart={tourStart === 'manual'} onClose={closeTour} />
              )}

              {isSearchOpen && features.search && (
                <EventSearchModal
                  calendarIds={calendarIds}
                  today={today}
                  onSelect={openSearchResult}
                  onClose={() => setIsSearchOpen(false)}
                />
              )}

              {actions.pendingDrop && (
                <RecurrenceScopeModal
                  options={actions.pendingDrop.options}
                  onSelect={(scope) => {
                    const { occurrence, period } = actions.pendingDrop!
                    void actions.saveDrop(occurrence, period, scope)
                  }}
                  onClose={actions.cancelDrop}
                />
              )}

              {actions.eventToDelete && (
                <DeleteEventModal
                  occurrence={actions.eventToDelete}
                  onConfirm={(scope) => actions.removeEvent(actions.eventToDelete!, scope)}
                  onClose={actions.cancelDelete}
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
