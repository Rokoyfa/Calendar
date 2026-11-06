import type { I18n } from '../../../i18n/index.ts'
import type { DateRange } from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import type { SlotRange } from '../utils/slotSelection.ts'
import type { EventSegment } from './eventLayout.ts'

export { CALENDAR_VIEWS, type CalendarView } from '../../../utils/calendarView.ts'

export type ViewI18n = Pick<I18n, 'm' | 'format' | 'weekInfo'>

export type ViewDefinition = {
  getRange: (anchor: string, firstDay: number) => DateRange
  step: (anchor: string, direction: 1 | -1) => string
  getTitle: (anchor: string, i18n: ViewI18n) => string
  getSubtitle?: (anchor: string, i18n: ViewI18n) => string
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
