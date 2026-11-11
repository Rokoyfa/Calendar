import { addDaysToISODate, MINUTES_PER_DAY, toISODate } from './date.ts'
import { expandEvents, MAX_REMINDER_MINUTES, type CalendarEvent, type EventOccurrence } from './event.ts'
import { toInstant } from './timeZone.ts'

const MS_PER_MINUTE = 60_000

export type ScheduledReminder = { key: string; at: number; minutes: number; occurrence: EventOccurrence }

export const REMINDER_LOOKAHEAD_DAYS = Math.ceil(MAX_REMINDER_MINUTES / MINUTES_PER_DAY) + 1

export const getReminderRange = (now: number) => {
  const today = toISODate(new Date(now))
  return { from: addDaysToISODate(today, -1), to: addDaysToISODate(today, REMINDER_LOOKAHEAD_DAYS) }
}

export function getScheduledReminders(
  events: readonly CalendarEvent[],
  viewerTimeZone: string,
  from: number,
  to: number,
): ScheduledReminder[] {
  const range = getReminderRange(from)
  return expandEvents(
    events.filter((event) => event.reminders.length > 0),
    range.from,
    range.to,
    viewerTimeZone,
  )
    .flatMap((occurrence) => {
      const start = toInstant({ date: occurrence.startDate, time: occurrence.start }, viewerTimeZone)
      return occurrence.reminders.map((minutes) => ({
        key: `${occurrence.occurrenceKey}:${minutes}`,
        at: start - minutes * MS_PER_MINUTE,
        minutes,
        occurrence,
      }))
    })
    .filter(({ at }) => at >= from && at < to)
    .sort((a, b) => a.at - b.at)
}
