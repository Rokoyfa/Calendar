import { addDaysToISODate } from '../../../utils/date.ts'
import { getActiveOccurrenceDates, type CalendarEvent } from '../../../utils/event.ts'

export const SEARCH_MIN_LENGTH = 2
const LOOKAHEAD_DAYS = 3660
const FALLBACK_RANGE_DAYS = 366

export type SearchResult = { event: CalendarEvent; date: string }

export const getFallbackSearchRange = (today: string) => ({
  from: addDaysToISODate(today, -FALLBACK_RANGE_DAYS),
  to: addDaysToISODate(today, FALLBACK_RANGE_DAYS),
})

const getRelevantDate = (event: CalendarEvent, today: string) => {
  if (!event.recurrence) return event.startDate
  const [next] = getActiveOccurrenceDates(event, today, addDaysToISODate(today, LOOKAHEAD_DAYS)).slice(0, 1)
  return next ?? getActiveOccurrenceDates(event, event.startDate, today).at(-1) ?? event.startDate
}

export const toSearchResults = (events: readonly CalendarEvent[], today: string): SearchResult[] => {
  const results = events.map((event) => ({ event, date: getRelevantDate(event, today) }))
  const upcoming = results.filter(({ date }) => date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = results.filter(({ date }) => date < today).sort((a, b) => b.date.localeCompare(a.date))
  return [...upcoming, ...past]
}
