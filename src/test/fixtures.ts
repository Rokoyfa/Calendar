import { NO_SERIES_LINK, type CalendarEvent, type EventInput } from '../utils/event.ts'
import type { Recurrence } from '../utils/recurrence.ts'

export const recurrence = (overrides: Partial<Recurrence> = {}): Recurrence => ({
  frequency: 'daily',
  interval: 1,
  weekdays: [],
  monthlyMode: 'dayOfMonth',
  until: null,
  count: null,
  ...overrides,
})

export const eventInput = (overrides: Partial<EventInput> = {}): EventInput => ({
  uid: 'event-uid',
  title: 'Event',
  location: '',
  links: [],
  startDate: '2026-11-02',
  start: '09:00',
  endDate: '2026-11-02',
  end: '10:00',
  allDay: false,
  timeZone: null,
  description: '',
  color: 'blue',
  recurrence: null,
  excludedDates: [],
  ...NO_SERIES_LINK,
  reminders: [],
  attendees: [],
  ...overrides,
})

let nextId = 1

export const calendarEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  ...eventInput(),
  id: `event-${nextId++}`,
  calendarId: 'personal',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
})
