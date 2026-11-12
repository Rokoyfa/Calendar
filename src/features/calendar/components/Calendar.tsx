import { useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
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

export type OpenEventRequest = { eventId: string; date: string; tab?: EventTab }

type PendingDrop = { occurrence: EventOccurrence; period: EventPeriod; options: EditScope[] }

type UndoOffer = { id: number; message: string; undo: () => Promise<void> }

export function Calendar({
  calendarIds,
  targetCalendarId,
  canCreate = true,
  eventSources = NO_EVENT_SOURCES,
  initialView,
  headerContext,
  headerAccessory,
  currentUserEmail = null,
  loadAttendeeCandidates,
  chat,
  openEvent,
  onOpenEventDone,
}: CalendarProps) {
  const i18n = useI18n()
  const now = useNow()
  const today = toISODate(now)
  const { view, setView, anchor, range, dates, title, subtitle, previous, next, goToToday, goToDate, show } =
    useCalendarView(initialView, openEvent?.date)
  const { events, error, createEvent, updateEvent, deleteEvent, respond, setReminders } = useEvents({
    ...range,
    calendarIds,
    targetCalendarId,
  })
  const holidays = useHolidays(range)
  const viewerTimeZone = useViewerTimeZone()
  const occurrences = useMemo(
    () => expandEvents(events, range.from, range.to, viewerTimeZone),
    [events, range, viewerTimeZone],
  )
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
    setUndoOffer(undo ? { id: Date.now(), message, undo } : null)

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
      if (canCreate) setEditor({ initialValue: createEventInput(date, hour, viewerTimeZone), occurrence: null })
    },
    [canCreate, viewerTimeZone],
  )

  const openCreateRange = useCallback(
    ({ first, last }: SlotRange) => {
      if (canCreate)
        setEditor({ initialValue: createEventInputForSlots(first, last, viewerTimeZone), occurrence: null })
    },
    [canCreate, viewerTimeZone],
  )

  const openCreateAllDay = useCallback(
    (date: string) => {
      if (canCreate) setEditor({ initialValue: createAllDayEventInput(date), occurrence: null })
    },
    [canCreate],
  )

  const openEdit = useCallback((occurrence: EventOccurrence, initialTab?: EventTab) => {
    setEditor({ initialValue: toOccurrenceInput(occurrence), occurrence, initialTab })
  }, [])

  const closeEditor = () => {
    setEditor(null)
    if (openEvent) onOpenEventDone?.()
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
    if (openEvent) onOpenEventDone?.()
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
    if (getScopeOptions(occurrence).length > 1) setEventToDelete(occurrence)
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

  useKeyboardShortcuts({
    ArrowLeft: previous,
    ArrowRight: next,
    t: goToToday,
    '/': () => setIsSearchOpen(true),
    n: canCreate ? createNow : undefined,
    [VIEW_SHORTCUTS.day]: () => setView('day'),
    [VIEW_SHORTCUTS.week]: () => setView('week'),
    [VIEW_SHORTCUTS.month]: () => setView('month'),
    [VIEW_SHORTCUTS.year]: () => setView('year'),
    j: () => setView('year'),
    'mod+z': undoOffer ? () => void runUndo() : undefined,
  })

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
                onSearch={() => setIsSearchOpen(true)}
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
                  onShowDay={(date) => show('day', date)}
                  onShowMonth={(date) => show('month', date)}
                />
              </main>

              {shownEditor && (
                <EventModal
                  key={shownEditor.occurrence?.occurrenceKey ?? 'new'}
                  initialValue={shownEditor.initialValue}
                  occurrence={shownEditor.occurrence}
                  attendeeOptions={{
                    candidates: attendeeCandidates,
                    ownEmail: currentUserEmail,
                    onRespond:
                      respond && shownEditor.occurrence
                        ? (status) => respond(shownEditor.occurrence!, status)
                        : undefined,
                  }}
                  notice={
                    shownEditor.notice ??
                    (editorSource && i18n.m.calendar.sharedEventNotice(getSourceText(editorSource, i18n)))
                  }
                  onSave={handleSave}
                  onDelete={shownEditor.occurrence ? () => requestDelete(shownEditor.occurrence!) : undefined}
                  chat={
                    shownEditor.occurrence && chat?.isAvailable(shownEditor.occurrence.calendarId)
                      ? { key: getChatKey(shownEditor.occurrence), calendarId: shownEditor.occurrence.calendarId }
                      : undefined
                  }
                  initialTab={shownEditor.initialTab}
                  onDuplicate={shownEditor.occurrence && canCreate ? duplicate : undefined}
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

              {isSearchOpen && (
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
