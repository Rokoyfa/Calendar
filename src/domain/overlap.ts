import { addDaysToISODate } from '../utils/date.ts'
import { expandEvents, toViewerPeriod, type CalendarEvent, type EventInput, type EventOccurrence } from './event.ts'

export type OverlapQuery = Pick<EventInput, 'uid' | 'startDate' | 'start' | 'endDate' | 'end' | 'allDay' | 'timeZone'>

export const OVERLAPS_SHOWN = 3

const pointOf = (date: string, time: string) => `${date}T${time}`

const isDeclinedBy = (event: CalendarEvent, email: string | null) =>
  email !== null && event.attendees.some((attendee) => attendee.email === email && attendee.status === 'declined')

export const overlapRange = (input: OverlapQuery) => ({
  from: addDaysToISODate(input.startDate, -1),
  to: addDaysToISODate(input.endDate, 1),
})

export const findOverlaps = (
  input: OverlapQuery,
  events: readonly CalendarEvent[],
  viewerTimeZone: string | null,
  ownEmail: string | null,
): EventOccurrence[] => {
  if (input.allDay) return []
  const period = toViewerPeriod(input, input.timeZone, viewerTimeZone)
  const start = pointOf(period.startDate, period.start)
  const end = pointOf(period.endDate, period.end)
  if (start >= end) return []
  const { from, to } = overlapRange(input)
  return expandEvents(events, from, to, viewerTimeZone)
    .filter(
      (occurrence) =>
        !occurrence.allDay &&
        occurrence.uid !== input.uid &&
        !isDeclinedBy(occurrence, ownEmail) &&
        pointOf(occurrence.startDate, occurrence.start) < end &&
        start < pointOf(occurrence.endDate, occurrence.end),
    )
    .sort((a, b) => pointOf(a.startDate, a.start).localeCompare(pointOf(b.startDate, b.start)))
}
