import {
  addDaysToISODate,
  daysBetween,
  maxISODate,
  minISODate,
  MINUTES_PER_DAY,
  timeToMinutes,
  type DateRange,
} from '../../../utils/date.ts'
import { getEventDuration, type EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from '../types/eventLayout.ts'

export function splitEventIntoSegments(event: EventOccurrence, { from, to }: DateRange): EventSegment[] {
  const eventStart = timeToMinutes(event.start)
  const eventEnd = eventStart + getEventDuration(event)
  const firstDate = maxISODate(event.startDate, from)
  const lastDate = minISODate(event.endDate, to)
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

export function groupSegmentsByDate(events: readonly EventOccurrence[], range: DateRange) {
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
