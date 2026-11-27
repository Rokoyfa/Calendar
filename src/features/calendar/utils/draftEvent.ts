import type { CalendarEvent, EventInput } from '../../../domain/event.ts'

const DRAFT_EVENT_ID = 'draft:new'
const DRAFT_TIMESTAMP = new Date(0).toISOString()

export const isDraftEvent = (event: Pick<CalendarEvent, 'id'>) => event.id === DRAFT_EVENT_ID

export const toDraftEvent = (input: EventInput, calendarId: string, title: string): CalendarEvent => ({
  ...input,
  title,
  id: DRAFT_EVENT_ID,
  calendarId,
  uid: DRAFT_EVENT_ID,
  attachmentCount: 0,
  version: 0,
  createdBy: null,
  createdAt: DRAFT_TIMESTAMP,
  updatedAt: DRAFT_TIMESTAMP,
})
