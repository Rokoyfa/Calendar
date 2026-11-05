import type { DateRange } from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { SlotRange } from '../utils/slotSelection.ts'
import type { EventSegment } from './eventLayout.ts'

export { CALENDAR_VIEWS, type CalendarView } from '../../../utils/calendarView.ts'

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
  currentMinutes: number
  segmentsByDate: ReadonlyMap<string, readonly EventSegment[]>
  onCreate: (date: string, hour: number) => void
  onCreateRange: (range: SlotRange) => void
  canCreate: boolean
  onEventSelect: (event: EventOccurrence) => void
  onShowDay: (date: string) => void
  onShowMonth: (date: string) => void
}
