import type { CalendarEvent } from '../../../utils/event.ts'

export type EventSegment = {
  event: CalendarEvent
  date: string
  start: number
  end: number
  continuesBefore: boolean
  continuesAfter: boolean
}

export type PositionedSegment = {
  segment: EventSegment
  column: number
  columns: number
}

export type VisibleRange = {
  from: string
  to: string
}
