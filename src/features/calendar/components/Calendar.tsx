import { useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useViewerTimeZone } from '../../../context/HostContext.ts'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import { useArrowKeyNavigation } from '../../../hooks/useArrowKeyNavigation.ts'
import { MINUTES_PER_HOUR, toISODate } from '../../../utils/date.ts'
import {
  createAllDayEventInput,
  createEventInput,
  createEventInputForSlots,
  expandEvents,
  toOccurrenceInput,
  type EditScope,
  type CalendarEvent,
  type EventInput,
  type EventOccurrence,
  type EventPeriod,
} from '../../../utils/event.ts'
import { DeleteEventModal, EventModal, getScopeOptions, RecurrenceScopeModal, useEvents } from '../../events/index.ts'
import { CurrentUserEmailContext } from '../context/CurrentUserContext.ts'
import { DraggingEventContext } from '../context/DragContext.ts'
import { useAttendeeCandidates, type AttendeeCandidateLoader } from '../hooks/useAttendeeCandidates.ts'
import { EventSearchModal } from './EventSearchModal.tsx'
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
}

type PendingDrop = { occurrence: EventOccurrence; period: EventPeriod; options: EditScope[] }

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
}: CalendarProps) {
  const i18n = useI18n()
  const now = useNow()
  const today = toISODate(now)
  const { view, setView, anchor, range, dates, title, subtitle, previous, next, goToToday, goToDate, show } =
    useCalendarView(initialView)
  const { events, error, createEvent, updateEvent, deleteEvent, respond } = useEvents({
    ...range,
    calendarIds,
    targetCalendarId,
  })
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
  const [dropError, setDropError] = useState<string | null>(null)
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
  const [eventToDelete, setEventToDelete] = useState<EventOccurrence | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const editorCalendarId = editor ? (editor.occurrence?.calendarId ?? targetCalendarId) : null
  const attendeeCandidates = useAttendeeCandidates(loadAttendeeCandidates, editorCalendarId)

  useArrowKeyNavigation({ onPrevious: previous, onNext: next })

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

  const openEdit = useCallback((occurrence: EventOccurrence) => {
    setEditor({ initialValue: toOccurrenceInput(occurrence), occurrence })
  }, [])

  const openSearchResult = (event: CalendarEvent, date: string) => {
    setIsSearchOpen(false)
    goToDate(date)
    const occurrence = expandEvents([event], date, date, viewerTimeZone).find(
      (candidate) => candidate.occurrenceDate === date,
    )
    if (occurrence) openEdit(occurrence)
  }

  const handleSave = async (input: EventInput, scope: EditScope) => {
    if (editor?.occurrence) await updateEvent(editor.occurrence, input, scope)
    else await createEvent(input)
    setEditor(null)
    goToDate(input.startDate)
  }

  const saveDrop = async (occurrence: EventOccurrence, period: EventPeriod, scope: EditScope) => {
    setPendingDrop(null)
    setDropError(null)
    try {
      await updateEvent(occurrence, toDropInput(occurrence, period, viewerTimeZone, scope), scope)
    } catch (caught) {
      setDropError(getErrorMessage(caught, i18n.m))
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

  const handleDelete = async (scope: EditScope) => {
    if (!eventToDelete) return
    await deleteEvent(eventToDelete, scope)
    setEventToDelete(null)
    setEditor(null)
  }

  const ViewComponent = VIEW_COMPONENTS[view]
  const editorSource = editor?.occurrence ? eventSources.get(editor.occurrence.calendarId) : undefined

  return (
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
            onCreateEvent={canCreate ? () => openCreate(view === 'day' ? anchor : today, now.getHours()) : undefined}
            context={headerContext}
            accessory={headerAccessory}
          />

          <ErrorMessage message={error} className="textCenter" />
          <ErrorMessage message={dropError} className="textCenter" />

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

          {editor && (
            <EventModal
              key={editor.occurrence?.occurrenceKey ?? 'new'}
              initialValue={editor.initialValue}
              occurrence={editor.occurrence}
              attendeeOptions={{
                candidates: attendeeCandidates,
                ownEmail: currentUserEmail,
                onRespond: respond && editor.occurrence ? (status) => respond(editor.occurrence!, status) : undefined,
              }}
              notice={editorSource && i18n.m.calendar.sharedEventNotice(getSourceText(editorSource, i18n))}
              onSave={handleSave}
              onDelete={editor.occurrence ? () => setEventToDelete(editor.occurrence) : undefined}
              onClose={() => setEditor(null)}
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
              onConfirm={handleDelete}
              onClose={() => setEventToDelete(null)}
            />
          )}
        </DraggingEventContext>
      </CurrentUserEmailContext>
    </EventSourcesContext>
  )
}
