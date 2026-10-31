import { HOURS_PER_DAY } from '../../../utils/date.ts'

export const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour)

export const MIN_VISIBLE_DURATION = 15

export const DEFAULT_EVENT_HOUR = 9

export const MAX_EVENTS_PER_MONTH_CELL = 3
