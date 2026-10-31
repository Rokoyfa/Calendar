import { useCallback, useMemo, useState, type ComponentType } from 'react'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { useArrowKeyNavigation } from '../../../hooks/useArrowKeyNavigation.ts'
import { toISODate } from '../../../utils/date.ts'
import {
  createEventInput,
  expandEvents,
  toEventInput,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { DeleteEventModal, EventModal, useEvents } from '../../events/index.ts'
import { useCalendarView } from '../hooks/useCalendarView.ts'
import { useNow } from '../hooks/useNow.ts'
import type { EditorState } from '../types/editor.ts'
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

export function Calendar() {
  const now = useNow()
  const today = toISODate(now)
  const { view, setView, anchor, range, dates, title, subtitle, previous, next, goToToday, goToDate, show } =
    useCalendarView()
  const { events, error, createEvent, updateEvent, deleteEvent } = useEvents(range)
  const segmentsByDate = useMemo(
    () => groupSegmentsByDate(expandEvents(events, range.from, range.to), range),
    [events, range],
  )
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [eventToDelete, setEventToDelete] = useState<EventOccurrence | null>(null)

  useArrowKeyNavigation({ onPrevious: previous, onNext: next })

  const openCreate = useCallback((date: string, hour: number) => {
    setEditor({ initialValue: createEventInput(date, hour), occurrence: null })
  }, [])

  const openEdit = useCallback((occurrence: EventOccurrence) => {
    setEditor({ initialValue: toEventInput(occurrence), occurrence })
  }, [])

  const handleSave = async (input: EventInput, scope: EditScope) => {
    if (editor?.occurrence) await updateEvent(editor.occurrence, input, scope)
    else await createEvent(input)
    setEditor(null)
    goToDate(input.startDate)
  }

  const handleDelete = async (scope: EditScope) => {
    if (!eventToDelete) return
    await deleteEvent(eventToDelete, scope)
    setEventToDelete(null)
    setEditor(null)
  }

  const ViewComponent = VIEW_COMPONENTS[view]

  return (
    <>
      <CalendarHeader
        view={view}
        title={title}
        subtitle={subtitle}
        onViewChange={setView}
        onPrevious={previous}
        onNext={next}
        onToday={goToToday}
        onCreateEvent={() => openCreate(view === 'day' ? anchor : today, now.getHours())}
      />

      <ErrorMessage message={error} className="textCenter" />

      <main className="main scrollArea" data-view={view}>
        <ViewComponent
          anchor={anchor}
          dates={dates}
          today={today}
          currentHour={now.getHours()}
          segmentsByDate={segmentsByDate}
          onCreate={openCreate}
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
          onSave={handleSave}
          onDelete={editor.occurrence ? () => setEventToDelete(editor.occurrence) : undefined}
          onClose={() => setEditor(null)}
        />
      )}

      {eventToDelete && (
        <DeleteEventModal occurrence={eventToDelete} onConfirm={handleDelete} onClose={() => setEventToDelete(null)} />
      )}
    </>
  )
}
