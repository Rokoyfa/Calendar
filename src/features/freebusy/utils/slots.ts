import { fromISODate, getWeekdayIndex, listISODates, minutesToTime, timeToMinutes } from '../../../utils/date.ts'
import { fromInstant, toInstant } from '../../../utils/timeZone.ts'
import type { BusyInterval, FreeBusyPerson } from '../types/freeBusy.ts'

const MS_PER_MINUTE = 60_000
const SATURDAY = 5
const DEFAULT_STEP_MINUTES = 30
const DEFAULT_LIMIT = 10
const DEFAULT_PER_DAY = 3

export type SlotSearch = {
  durationMinutes: number
  fromDate: string
  toDate: string
  dayStart: string
  dayEnd: string
  includeWeekends: boolean
  timeZone: string
  now: number
  busy: readonly BusyInterval[]
  blockedDates: ReadonlySet<string>
  stepMinutes?: number
  limit?: number
  perDay?: number
}

export const combineFreeBusy = (people: readonly FreeBusyPerson[]) => {
  const available = people.filter((person) => person.available)
  return {
    busy: available.flatMap((person) => person.busy),
    blockedDates: new Set(available.flatMap((person) => person.blockedDates)),
  }
}

const overlaps = (busy: readonly BusyInterval[], start: number, end: number) =>
  busy.some((interval) => interval.start < end && start < interval.end)

const isWeekend = (date: string) => getWeekdayIndex(fromISODate(date)) >= SATURDAY

export const findCommonSlots = ({
  durationMinutes,
  fromDate,
  toDate,
  dayStart,
  dayEnd,
  includeWeekends,
  timeZone,
  now,
  busy,
  blockedDates,
  stepMinutes = DEFAULT_STEP_MINUTES,
  limit = DEFAULT_LIMIT,
  perDay = DEFAULT_PER_DAY,
}: SlotSearch): BusyInterval[] => {
  if (durationMinutes <= 0 || fromDate > toDate) return []
  const first = timeToMinutes(dayStart)
  const last = timeToMinutes(dayEnd) - durationMinutes
  const slots: BusyInterval[] = []
  for (const date of listISODates(fromDate, toDate)) {
    if (slots.length >= limit) break
    if (blockedDates.has(date) || (!includeWeekends && isWeekend(date))) continue
    let count = 0
    for (let minutes = first; minutes <= last && count < perDay && slots.length < limit; minutes += stepMinutes) {
      const time = minutesToTime(minutes)
      const start = toInstant({ date, time }, timeZone)
      if (start < now || fromInstant(start, timeZone).time !== time) continue
      const end = start + durationMinutes * MS_PER_MINUTE
      if (overlaps(busy, start, end)) continue
      slots.push({ start, end })
      count += 1
    }
  }
  return slots
}
