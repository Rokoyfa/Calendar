import { useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import type { CalendarController, CalendarState } from '../../../context/HostBridge.ts'
import { nearestView } from '../../../utils/calendarView.ts'
import { matchesCategoryFilter, type CategoryFilter } from '../../../utils/category.ts'
import { isISODate, isTime } from '../../../utils/date.ts'
import { CategoryFilterModal, useCategories } from '../../categories/index.ts'
import { useStorage } from '../../storage/index.ts'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts.ts'
import { addDaysToISODate, MINUTES_PER_HOUR, toISODate } from '../../../utils/date.ts'
import {
  createAllDayEventInput,
  createEventInput,
  createEventInputForSlots,
  expandEvents,
  toDuplicateInput,
  toOccurrenceInput,
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
  EventModal,
  getScopeOptions,
  RecurrenceScopeModal,
  useEvents,
  type EventTab,
} from '../../events/index.ts'
import { ChatProvider, type ChatAccess } from '../../chat/index.ts'
import { getChatKey } from '../../../utils/chat.ts'
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
import { useEventDrag, type DragPreview } from '../hooks/useEventDrag.ts'
import { useNow } from '../hooks/useNow.ts'
import type { EditorState } from '../types/editor.ts'
import type { EventSources } from '../types/eventSource.ts'
import { toDropInput } from '../utils/eventDrag.ts'
import { getSourceText } from '../utils/eventLabels.ts'
import type { SlotRange } from '../utils/slotSelection.ts'
import type { CalendarView, CalendarViewProps } from '../types/view.ts'
import { groupSegmentsByDate } from '../utils/segmentEvents.ts'
import { CalendarHeader } from './CalendarHeader.tsx'
import { MonthView } from './MonthView.tsx'
import { TimeGridView } from './TimeGridView.tsx'
import { YearView } from './YearView.tsx'

const VIEW_COMPONENTS: Record<CalendarView, ComponentType<CalendarViewProps>> = {
  day: TimeGridView,
  week: TimeGridView,
  month: MonthView,
  year: YearView,
}

type CalendarProps = {
  calendarIds: readonly string[]
  targetCalendarId: string
  canCreate?: boolean
  readOnly?: boolean
  calendarNames?: ReadonlyMap<string, string>
  eventSources?: EventSources
  initialView?: CalendarView
  headerContext?: ReactNode
  headerAccessory?: ReactNode
  currentUserEmail?: string | null
  loadAttendeeCandidates?: AttendeeCandidateLoader
  chat?: ChatAccess
  openEvent?: OpenEventRequest
  onOpenEventDone?: () => void
}

export type OpenEventRequest = {
  eventId: string
  date: string
  tab?: EventTab
}

type PendingDrop = {
  occurrence: EventOccurrence
  period: EventPeriod
  options: EditScope[]
}

const NO_SHORTCUTS = {}
const NO_NAMES: ReadonlyMap<string, string> = new Map()

type UndoOffer = { id: number; message: string; undo: () => Promise<void> }

export function Calendar({
  calendarIds,
  targetCalendarId,
  canCreate: mayCreate = true,
  readOnly: forcedReadOnly = false,
  calendarNames = NO_NAMES,
  eventSources = NO_EVENT_SOURCES,
  initialView,
  headerContext,
  headerAccessory,
  currentUserEmail = null,
  loadAttendeeCandidates,
  chat,
  openEvent: linkedEvent,
  onOpenEventDone,
}: CalendarProps) {
  const i18n = useI18n()
  const { features, views, readOnly: hostReadOnly = false } = useHost()
  const { invalidate } = useStorage()
  const readOnly = forcedReadOnly || hostReadOnly
  const canCreate = mayCreate && !readOnly
  const [hostRequest, setHostRequest] = useState<OpenEventRequest | null>(null)
  const openEvent = hostRequest ?? linkedEvent
  const now = useNow()
  const today = toISODate(now)
  const { view, setView, anchor, range, dates, title, subtitle, previous, next, goToToday, goToDate, show } =
    useCalendarView(initialView, linkedEvent?.date)
  const { events, error, createEvent, updateEvent, deleteEvent, respond, setReminders } = useEvents({
    ...range,
    calendarIds,
    targetCalendarId,
  })
  const holidays = useHolidays(range)
  const viewerTimeZone = useViewerTimeZone()
  const { categories } = useCategories(calendarIds)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const activeFilter = categories.length > 0 ? categoryFilter : null
  const occurrences = useMemo(() => {
    const expanded = expandEvents(events, range.from, range.to, viewerTimeZone)
    if (activeFilter === null) return expanded
    const known = new Set(categories.map((category) => category.id))
    return expanded.filter((occurrence) => matchesCategoryFilter(occurrence.categoryIds, known, activeFilter))
  }, [events, range, viewerTimeZone, categories, activeFilter])
  const occurrencesByKey = useMemo(
    () => new Map(occurrences.map((occurrence) => [occurrence.occurrenceKey, occurrence])),
    [occurrences],
  )
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [undoOffer, setUndoOffer] = useState<UndoOffer | null>(null)
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
  const [editor, setEditor] = useState<EditorState | null>(null)
  const requestedOccurrence = useMemo(
    () =>
      openEvent
        ? (occurrences.find(
            (occurrence) =>
              (occurrence.id === openEvent.eventId && occurrence.occurrenceDate === openEvent.date) ||
              (occurrence.seriesId === openEvent.eventId && occurrence.originalDate === openEvent.date) ||
              (occurrence.id === openEvent.eventId && !occurrence.recurrence),
          ) ?? null)
        : null,
    [openEvent, occurrences],
  )
  const shownEditor: EditorState | null =
    editor ??
    (requestedOccurrence && {
      initialValue: toOccurrenceInput(requestedOccurrence),
      occurrence: requestedOccurrence,
      initialTab: openEvent?.tab,
    })

  const [eventToDelete, setEventToDelete] = useState<EventOccurrence | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const editorCalendarId = shownEditor ? (shownEditor.occurrence?.calendarId ?? targetCalendarId) : null
  const attendeeCandidates = useAttendeeCandidates(loadAttendeeCandidates, editorCalendarId)

  const offerUndo = (message: string, undo: (() => Promise<void>) | null) =>
    setUndoOffer(undo && features.undo ? { id: Date.now(), message, undo } : null)

  const dismissUndo = useCallback(() => setUndoOffer(null), [])

  const runUndo = async () => {
    if (!undoOffer) return
    setUndoOffer(null)
    setActionError(null)
    try {
      await undoOffer.undo()
    } catch (caught) {
      setActionError(getErrorMessage(caught, i18n.m))
    }
  }

  const createNow = () => openCreate(view === 'day' ? anchor : today, now.getHours())

  const openCreate = useCallback(
    (date: string, hour: number) => {
      if (canCreate)
        setEditor({
          initialValue: createEventInput(date, hour, viewerTimeZone),
          occurrence: null,
        })
    },
    [canCreate, viewerTimeZone],
  )

  const openCreateRange = useCallback(
    ({ first, last }: SlotRange) => {
      if (canCreate)
        setEditor({
          initialValue: createEventInputForSlots(first, last, viewerTimeZone),
          occurrence: null,
        })
    },
    [canCreate, viewerTimeZone],
  )

  const openCreateAllDay = useCallback(
    (date: string) => {
      if (canCreate)
        setEditor({
          initialValue: createAllDayEventInput(date),
          occurrence: null,
        })
    },
    [canCreate],
  )

  const openEdit = useCallback((occurrence: EventOccurrence, initialTab?: EventTab) => {
    setEditor({
      initialValue: toOccurrenceInput(occurrence),
      occurrence,
      initialTab,
    })
  }, [])

  const finishRequest = () => {
    if (hostRequest) setHostRequest(null)
    else if (linkedEvent) onOpenEventDone?.()
  }

  const closeEditor = () => {
    setEditor(null)
    finishRequest()
  }

  const openSearchResult = (event: CalendarEvent, date: string) => {
    setIsSearchOpen(false)
    const occurrence = expandEvents(
      [event],
      addDaysToISODate(date, -ZONE_SHIFT_DAYS),
      addDaysToISODate(date, ZONE_SHIFT_DAYS),
      viewerTimeZone,
    ).find((candidate) => candidate.occurrenceDate === date)
    goToDate(occurrence?.startDate ?? date)
    if (occurrence) openEdit(occurrence)
  }

  const duplicate = (input: EventInput) => {
    finishRequest()
    setEditor({
      initialValue: toDuplicateInput(input),
      occurrence: null,
      notice: i18n.m.events.duplicateNotice(input.title),
    })
  }

  const removeEvent = async (occurrence: EventOccurrence, scope: EditScope) => {
    const undo = await deleteEvent(occurrence, scope)
    setEventToDelete(null)
    closeEditor()
    offerUndo(i18n.m.calendar.undo.deleted(occurrence.title), undo)
  }

  const requestDelete = async (occurrence: EventOccurrence) => {
    if (!features.undo || getScopeOptions(occurrence).length > 1) setEventToDelete(occurrence)
    else await removeEvent(occurrence, 'all')
  }

  const handleSave = async (input: EventInput, scope: EditScope) => {
    if (shownEditor?.occurrence) await updateEvent(shownEditor.occurrence, input, scope)
    else await createEvent(input)
    closeEditor()
    goToDate(toViewerPeriod(input, input.timeZone, viewerTimeZone).startDate)
  }

  const saveDrop = async (occurrence: EventOccurrence, period: EventPeriod, scope: EditScope) => {
    setPendingDrop(null)
    setActionError(null)
    try {
      const undo = await updateEvent(occurrence, toDropInput(occurrence, period, viewerTimeZone, scope), scope)
      offerUndo(i18n.m.calendar.undo.moved(occurrence.title), undo)
    } catch (caught) {
      setActionError(getErrorMessage(caught, i18n.m))
    } finally {
      setDragPreview(null)
    }
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
    occurrences: occurrencesByKey,
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
          ArrowLeft: previous,
          ArrowRight: next,
          t: goToToday,
          '/': features.search ? () => setIsSearchOpen(true) : undefined,
          n: canCreate ? createNow : undefined,
          [VIEW_SHORTCUTS.day]: selectView('day'),
          [VIEW_SHORTCUTS.week]: selectView('week'),
          [VIEW_SHORTCUTS.month]: selectView('month'),
          [VIEW_SHORTCUTS.year]: selectView('year'),
          j: selectView('year'),
          'mod+z': undoOffer ? () => void runUndo() : undefined,
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
      setEditor(null)
      goToDate(date)
      setHostRequest({ eventId, date })
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
      setEditor({
        initialValue: {
          ...base,
          ...times,
          title: draft.title ?? '',
          location: draft.location ?? '',
          description: draft.description ?? '',
        },
        occurrence: null,
      })
      return true
    },
    refresh: invalidate,
  }
  useHostController(controller, state)

  const ViewComponent = VIEW_COMPONENTS[view]
  const editorSource = shownEditor?.occurrence ? eventSources.get(shownEditor.occurrence.calendarId) : undefined

  return (
    <HolidaysContext value={holidays}>
      <ChatProvider access={chat} calendarIds={calendarIds}>
        <EventSourcesContext value={eventSources}>
          <CurrentUserEmailContext value={currentUserEmail}>
            <DraggingEventContext value={dragPreview?.occurrenceKey ?? null}>
              <CalendarHeader
                view={view}
                title={title}
                subtitle={subtitle}
                onViewChange={setView}
                onPrevious={previous}
                onNext={next}
                onToday={goToToday}
                onSearch={features.search ? () => setIsSearchOpen(true) : undefined}
                onFilter={categories.length > 0 ? () => setIsFilterOpen(true) : undefined}
                isFiltered={activeFilter !== null}
                onCreateEvent={canCreate ? createNow : undefined}
                context={headerContext}
                accessory={headerAccessory}
              />

              <ErrorMessage message={error} className="textCenter" />
              <ErrorMessage message={actionError} className="textCenter" />

              <main ref={mainRef} className="main scrollArea" data-view={view}>
                <ViewComponent
                  anchor={anchor}
                  dates={dates}
                  today={today}
                  currentMinutes={now.getHours() * MINUTES_PER_HOUR + now.getMinutes()}
                  segmentsByDate={segmentsByDate}
                  canCreate={canCreate}
                  onCreate={openCreate}
                  onCreateRange={openCreateRange}
                  onCreateAllDay={openCreateAllDay}
                  onEventSelect={openEdit}
                  onShowDay={(date) => showView('day', date)}
                  onShowMonth={(date) => showView('month', date)}
                />
              </main>

              {shownEditor && (
                <EventModal
                  readOnly={readOnly}
                  categories={categories.filter((category) => category.calendarId === editorCalendarId)}
                  key={shownEditor.occurrence?.occurrenceKey ?? 'new'}
                  initialValue={shownEditor.initialValue}
                  occurrence={shownEditor.occurrence}
                  attendeeOptions={
                    features.attendees
                      ? {
                          candidates: attendeeCandidates,
                          ownEmail: currentUserEmail,
                          onRespond:
                            respond && shownEditor.occurrence
                              ? (status) => respond(shownEditor.occurrence!, status)
                              : undefined,
                        }
                      : undefined
                  }
                  notice={
                    shownEditor.notice ??
                    (editorSource && i18n.m.calendar.sharedEventNotice(getSourceText(editorSource, i18n)))
                  }
                  onSave={handleSave}
                  onDelete={shownEditor.occurrence ? () => requestDelete(shownEditor.occurrence!) : undefined}
                  chat={
                    shownEditor.occurrence && chat?.isAvailable(shownEditor.occurrence.calendarId)
                      ? {
                          key: getChatKey(shownEditor.occurrence),
                          calendarId: shownEditor.occurrence.calendarId,
                        }
                      : undefined
                  }
                  initialTab={shownEditor.initialTab}
                  onDuplicate={features.duplicate && shownEditor.occurrence && canCreate ? duplicate : undefined}
                  onRemindersChange={
                    setReminders && shownEditor.occurrence
                      ? async (reminders) => {
                          await setReminders(shownEditor.occurrence!, reminders)
                          closeEditor()
                        }
                      : undefined
                  }
                  onClose={closeEditor}
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
                />
              )}
              {undoOffer && (
                <UndoNotice
                  key={undoOffer.id}
                  message={undoOffer.message}
                  onUndo={() => void runUndo()}
                  onDismiss={dismissUndo}
                />
              )}
            </DraggingEventContext>
          </CurrentUserEmailContext>
        </EventSourcesContext>
      </ChatProvider>
    </HolidaysContext>
  )
}
