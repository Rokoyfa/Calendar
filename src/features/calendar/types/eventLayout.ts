import type { EventOccurrence } from '../../../utils/event.ts'

export type EventSegment = {
  event: EventOccurrence
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
