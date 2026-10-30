import type { CalendarEvent } from '../../../utils/event.ts'

export type PositionedEvent = {
  event: CalendarEvent
  column: number
  columns: number
}
