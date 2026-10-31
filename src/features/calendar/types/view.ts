import type { DateRange } from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { EventSegment } from './eventLayout.ts'

export const CALENDAR_VIEWS = ['day', 'week', 'month', 'year'] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export type ViewDefinition = {
  label: string
  previousLabel: string
  nextLabel: string
  getRange: (anchor: string) => DateRange
  step: (anchor: string, direction: 1 | -1) => string
  getTitle: (anchor: string) => string
  getSubtitle?: (anchor: string) => string
}

export type CalendarViewProps = {
  anchor: string
  dates: readonly string[]
  today: string
  currentHour: number
  segmentsByDate: ReadonlyMap<string, readonly EventSegment[]>
  onCreate: (date: string, hour: number) => void
  onEventSelect: (event: EventOccurrence) => void
  onShowDay: (date: string) => void
  onShowMonth: (date: string) => void
}
