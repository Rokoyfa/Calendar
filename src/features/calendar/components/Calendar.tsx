import { useCallback, useMemo, useState } from 'react'
import { fromISODate, isSameDay, toISODate } from '../../../utils/date.ts'
import {
  createEventInput,
  expandEvents,
  toEventInput,
  type EditScope,
  type EventInput,
  type EventOccurrence,
} from '../../../utils/event.ts'
import { hasEarlierOccurrences } from '../../../utils/series.ts'
import { DeleteEventModal, EventModal, getScopeOptions, useEvents } from '../../events/index.ts'
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
    setEditor({ mode: 'create', initialValue: createEventInput(date, hour) })
  }, [])

  const openEdit = useCallback((occurrence: EventOccurrence) => {
    setEditor({ mode: 'edit', occurrence })
  }, [])

  const canSplit = (occurrence: EventOccurrence) => hasEarlierOccurrences(occurrence, occurrence.startDate)

  const handleCreateNow = () => {
    const current = new Date()
    openCreate(toISODate(current), current.getHours())
  }

  const handleSave = async (input: EventInput, scope: EditScope) => {
    if (editor?.mode === 'edit') await updateEvent(editor.occurrence, input, scope)
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

      {error && (
        <p className="errorText textCenter" role="alert">
          {error}
        </p>
      )}

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
          key={editor.mode === 'edit' ? editor.occurrence.occurrenceKey : 'new'}
          mode={editor.mode}
          initialValue={editor.mode === 'edit' ? toEventInput(editor.occurrence) : editor.initialValue}
          onSave={handleSave}
          canSplitSeries={editor.mode === 'edit' && canSplit(editor.occurrence)}
          onDelete={editor.mode === 'edit' ? () => setEventToDelete(editor.occurrence) : undefined}
          onClose={() => setEditor(null)}
        />
      )}

      {eventToDelete && (
        <DeleteEventModal
          event={eventToDelete}
          scopeOptions={getScopeOptions({
            isSeries: eventToDelete.recurrence !== null,
            keepsRule: true,
            canSplit: canSplit(eventToDelete),
          })}
          onConfirm={handleDelete}
          onClose={() => setEventToDelete(null)}
        />
      )}
    </>
  )
}
