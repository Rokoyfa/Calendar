import { useCallback, useMemo, useState } from 'react'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { fromISODate, isSameDay, toISODate } from '../../../utils/date.ts'
import {
  createEventInput,
  expandEvents,
  toEventInput,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { DeleteEventModal, EventModal, useEvents } from '../../events/index.ts'
import { useNow } from '../hooks/useNow.ts'
import { useWeek } from '../hooks/useWeek.ts'
import { useWeekKeyboardNavigation } from '../hooks/useWeekKeyboardNavigation.ts'
import type { EditorState } from '../types/editor.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import { groupSegmentsByDate } from '../utils/segmentEvents.ts'
import { CalendarHeader } from './CalendarHeader.tsx'
import { DayColumn } from './DayColumn.tsx'
import { TimeColumn } from './TimeColumn.tsx'

const NO_SEGMENTS: readonly EventSegment[] = []

export function Calendar() {
  const now = useNow()
  const { weekStart, days, weekNumber, range, nextWeek, previousWeek, currentWeek, goToDate } = useWeek()
  const { events, error, createEvent, updateEvent, deleteEvent } = useEvents(range)
  const segmentsByDate = useMemo(
    () => groupSegmentsByDate(expandEvents(events, range.from, range.to), range),
    [events, range],
  )
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [eventToDelete, setEventToDelete] = useState<EventOccurrence | null>(null)

  useWeekKeyboardNavigation({ onPreviousWeek: previousWeek, onNextWeek: nextWeek })

  const openCreate = useCallback((date: string, hour: number) => {
    setEditor({ initialValue: createEventInput(date, hour), occurrence: null })
  }, [])

  const openEdit = useCallback((occurrence: EventOccurrence) => {
    setEditor({ initialValue: toEventInput(occurrence), occurrence })
  }, [])

  const handleCreateNow = () => {
    const current = new Date()
    openCreate(toISODate(current), current.getHours())
  }

  const handleSave = async (input: EventInput, scope: EditScope) => {
    if (editor?.occurrence) await updateEvent(editor.occurrence, input, scope)
    else await createEvent(input)
    setEditor(null)
    goToDate(fromISODate(input.startDate))
  }

  const handleDelete = async (scope: EditScope) => {
    if (!eventToDelete) return
    await deleteEvent(eventToDelete, scope)
    setEventToDelete(null)
    setEditor(null)
  }

  return (
    <>
      <CalendarHeader
        weekStart={weekStart}
        weekNumber={weekNumber}
        onPreviousWeek={previousWeek}
        onNextWeek={nextWeek}
        onCurrentWeek={currentWeek}
        onCreateEvent={handleCreateNow}
      />

      <ErrorMessage message={error} className="textCenter" />

      <main className="main scrollArea">
        <div className="calendar">
          <TimeColumn currentHour={now.getHours()} />
          {days.map((day) => (
            <DayColumn
              key={day.getTime()}
              date={day}
              isToday={isSameDay(day, now)}
              segments={segmentsByDate.get(toISODate(day)) ?? NO_SEGMENTS}
              onSlotSelect={openCreate}
              onEventSelect={openEdit}
            />
          ))}
        </div>
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
