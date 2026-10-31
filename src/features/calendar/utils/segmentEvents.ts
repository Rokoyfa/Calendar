import { addDaysToISODate, daysBetween, MINUTES_PER_DAY, timeToMinutes } from '../../../utils/date.ts'
import { getEventDuration, type CalendarEvent } from '../../../utils/event.ts'
import type { EventSegment, VisibleRange } from '../types/eventLayout.ts'

export function splitEventIntoSegments(event: CalendarEvent, { from, to }: VisibleRange): EventSegment[] {
  const eventStart = timeToMinutes(event.start)
  const eventEnd = eventStart + getEventDuration(event)
  const firstDate = event.startDate > from ? event.startDate : from
  const lastDate = event.endDate < to ? event.endDate : to
  const segments: EventSegment[] = []

  for (let date = firstDate; date <= lastDate; date = addDaysToISODate(date, 1)) {
    const dayOffset = daysBetween(event.startDate, date) * MINUTES_PER_DAY
    const start = Math.max(eventStart - dayOffset, 0)
    const end = Math.min(eventEnd - dayOffset, MINUTES_PER_DAY)
    if (end <= start) continue

    segments.push({
      event,
      date,
      start,
      end,
      continuesBefore: dayOffset + start > eventStart,
      continuesAfter: dayOffset + end < eventEnd,
    })
  }

  return segments
}

export function groupSegmentsByDate(events: readonly CalendarEvent[], range: VisibleRange) {
  const groups = new Map<string, EventSegment[]>()
  for (const event of events) {
    for (const segment of splitEventIntoSegments(event, range)) {
      const group = groups.get(segment.date)
      if (group) group.push(segment)
      else groups.set(segment.date, [segment])
    }
  }
  return groups
}
