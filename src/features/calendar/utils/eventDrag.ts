import { addDaysToISODate, daysBetween, MINUTES_PER_DAY, minutesToTime, timeToMinutes } from '../../../utils/date.ts'
import {
  toOccurrenceInput,
  toViewerPeriod,
  type EditScope,
  type EventInput,
  type EventOccurrence,
  type EventPeriod,
} from '../../../utils/event.ts'
import { adaptRecurrenceToStart } from '../../../utils/recurrence.ts'
import { MIN_VISIBLE_DURATION } from '../constants/grid.ts'

export type DragMode = 'move' | 'resize'

export type DragUnit = 'minutes' | 'days'

export type DragPoint = { date: string; minutes: number }

const DRAG_STEP_MINUTES = 15

const toAbsolute = (reference: string, date: string, minutes: number) =>
  daysBetween(reference, date) * MINUTES_PER_DAY + minutes

const fromAbsolute = (reference: string, absolute: number) => {
  const days = Math.floor(absolute / MINUTES_PER_DAY)
  return { date: addDaysToISODate(reference, days), time: minutesToTime(absolute - days * MINUTES_PER_DAY) }
}

export const getDragDelta = (unit: DragUnit, from: DragPoint, to: DragPoint) => {
  if (unit === 'days') return daysBetween(from.date, to.date) * MINUTES_PER_DAY
  const delta = toAbsolute(from.date, to.date, to.minutes) - from.minutes
  return Math.round(delta / DRAG_STEP_MINUTES) * DRAG_STEP_MINUTES
}

export const applyDragDelta = (period: EventPeriod, mode: DragMode, delta: number): EventPeriod => {
  const reference = period.startDate
  const start = timeToMinutes(period.start)
  const end = toAbsolute(reference, period.endDate, timeToMinutes(period.end))
  const nextStart = mode === 'move' ? start + delta : start
  const nextEnd = mode === 'move' ? end + delta : Math.max(end + delta, start + MIN_VISIBLE_DURATION)
  const first = fromAbsolute(reference, nextStart)
  const last = fromAbsolute(reference, nextEnd)
  return { startDate: first.date, start: first.time, endDate: last.date, end: last.time }
}

export const isSamePeriod = (a: EventPeriod, b: EventPeriod) =>
  a.startDate === b.startDate && a.start === b.start && a.endDate === b.endDate && a.end === b.end

export const toDropInput = (
  occurrence: EventOccurrence,
  viewerPeriod: EventPeriod,
  viewerTimeZone: string,
  scope: EditScope,
): EventInput => {
  const current = toOccurrenceInput(occurrence)
  const period = occurrence.timeZone ? toViewerPeriod(viewerPeriod, viewerTimeZone, occurrence.timeZone) : viewerPeriod
  return {
    ...current,
    ...period,
    recurrence:
      scope === 'single'
        ? current.recurrence
        : adaptRecurrenceToStart(current.recurrence, current.startDate, period.startDate),
  }
}
