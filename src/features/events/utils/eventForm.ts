import type { EventPeriod, EventValidationErrors } from '../../../domain/event.ts'
import { isISODate, isTime } from '../../../utils/date.ts'
import { toInstant } from '../../../utils/timeZone.ts'
import type { EventTab } from '../types/eventModal.ts'

const TAB_FIELDS: Record<EventTab, readonly (keyof EventValidationErrors)[]> = {
  general: ['title', 'startDate', 'start', 'endDate', 'end', 'timeZone', 'reminders'],
  appearance: ['color'],
  recurrence: ['recurrence', 'excludedDates'],
  attendees: ['attendees'],
  details: ['location', 'links', 'description'],
  chat: [],
  history: [],
}

export const LIVE_TABS: readonly EventTab[] = ['chat', 'history']

export const hasTabErrors = (errors: EventValidationErrors, tab: EventTab) =>
  TAB_FIELDS[tab].some((field) => errors[field] !== undefined)

export const isValidPeriod = ({ startDate, start, endDate, end }: EventPeriod) =>
  isISODate(startDate) && isISODate(endDate) && isTime(start) && isTime(end)

const MS_PER_MINUTE = 60_000

export const periodMinutes = ({ startDate, start, endDate, end }: EventPeriod, timeZone: string) =>
  Math.round(
    (toInstant({ date: endDate, time: end }, timeZone) - toInstant({ date: startDate, time: start }, timeZone)) /
      MS_PER_MINUTE,
  )
