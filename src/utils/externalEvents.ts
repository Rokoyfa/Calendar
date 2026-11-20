import type { CalendarEvent } from './event.ts'
import { externalCalendarId, type ExternalCalendar } from './externalCalendar.ts'
import { parseICalendar } from './ical.ts'

export const toExternalEvents = (calendar: ExternalCalendar, text: string): CalendarEvent[] => {
  const parsed = parseICalendar(text)
  if (!parsed) return []
  const calendarId = externalCalendarId(calendar.id)
  const prefix = `${calendarId}:`
  const series = new Map<string, string>()
  const events: CalendarEvent[] = []
  parsed.events.forEach(({ input, recurrenceId }, index) => {
    const id = `${prefix}${index}`
    if (input.recurrence && !series.has(input.uid)) series.set(input.uid, id)
    events.push({
      ...input,
      id,
      calendarId,
      color: calendar.color,
      categoryIds: [],
      reminders: [],
      seriesId: recurrenceId,
      originalDate: recurrenceId,
      attachmentCount: 0,
      version: 1,
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    })
  })
  const linked = events.map((event) => {
    if (event.seriesId === null) return event
    const seriesId = series.get(event.uid)
    return seriesId ? { ...event, seriesId } : { ...event, seriesId: null, originalDate: null }
  })
  const exclusions = new Map<string, string[]>()
  for (const { seriesId, originalDate } of linked)
    if (seriesId && originalDate) exclusions.set(seriesId, [...(exclusions.get(seriesId) ?? []), originalDate])
  return linked.map((event) => {
    const excluded = exclusions.get(event.id)
    return excluded ? { ...event, excludedDates: [...new Set([...event.excludedDates, ...excluded])].sort() } : event
  })
}
