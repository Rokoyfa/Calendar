import { MINUTES_PER_DAY, minutesToTime, timeToMinutes } from '../../../utils/date.ts'
import type { PlanningDistribution } from '../../../domain/preferences.ts'
import { isRestDay, type WorkingTimeLaw } from './workingTimeLaw.ts'

export type PlanInterval = { start: number; end: number }

export type PlannedBlock = { date: string; start: string; end: string; minutes: number }

export type PlanRequest = {
  effortMinutes: number
  from: number
  deadline: number | null
  busy: readonly PlanInterval[]
  work: readonly PlanInterval[]
  blockedDates: ReadonlySet<string>
  law: WorkingTimeLaw
  windowStart: number
  windowEnd: number
  distribution: PlanningDistribution
}

export type PlanResult = { blocks: PlannedBlock[]; plannedMinutes: number; missingMinutes: number }

export const PLAN_STEP_MINUTES = 15
export const MIN_BLOCK_MINUTES = 30
export const NO_DEADLINE_DAYS = 366
export const PLAN_BUFFER_MINUTES = 5
const BREAK_CHUNK_MINUTES = 15
const DAY_MS = 86_400_000
const DAYS_PER_WEEK = 7
const EPOCH_WEEKDAY = 3

const dateToDay = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS)
}

const dayToDate = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)

const dayOf = (minute: number) => Math.floor(minute / MINUTES_PER_DAY)

const weekdayOf = (day: number) => (((day + EPOCH_WEEKDAY) % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK

const weekOf = (day: number) => Math.floor((day + EPOCH_WEEKDAY) / DAYS_PER_WEEK)

const ceilToStep = (minute: number) => Math.ceil(minute / PLAN_STEP_MINUTES) * PLAN_STEP_MINUTES

export const toPlanMinute = (isoDate: string, time: string) =>
  dateToDay(isoDate) * MINUTES_PER_DAY + timeToMinutes(time)

export const planMinuteToDate = (minute: number) => dayToDate(dayOf(minute))

const length = ({ start, end }: PlanInterval) => end - start

class DayIndex {
  private readonly days = new Map<number, PlanInterval[]>()

  add(interval: PlanInterval) {
    if (interval.end <= interval.start) return
    for (let day = dayOf(interval.start); day <= dayOf(interval.end - 1); day += 1) {
      const list = this.days.get(day)
      if (list) list.push(interval)
      else this.days.set(day, [interval])
    }
  }

  on(day: number): readonly PlanInterval[] {
    return this.days.get(day) ?? []
  }
}

class WorkIndex {
  private readonly days = new Map<number, PlanInterval[]>()

  add(interval: PlanInterval) {
    if (interval.end <= interval.start) return
    const day = dayOf(interval.start)
    const list = this.days.get(day)
    if (list) list.push(interval)
    else this.days.set(day, [interval])
  }

  on(day: number): readonly PlanInterval[] {
    return this.days.get(day) ?? []
  }

  minutesOn(day: number) {
    return this.on(day).reduce((sum, interval) => sum + length(interval), 0)
  }

  minutesInWeekOf(day: number) {
    const first = weekOf(day) * DAYS_PER_WEEK - EPOCH_WEEKDAY
    let sum = 0
    for (let offset = 0; offset < DAYS_PER_WEEK; offset += 1) sum += this.minutesOn(first + offset)
    return sum
  }
}

const overlaps = (a: PlanInterval, b: PlanInterval) => a.start < b.end && b.start < a.end

const requiredBreak = (law: WorkingTimeLaw, workMinutes: number) =>
  law.breaks.reduce((required, rule) => (workMinutes > rule.over ? Math.max(required, rule.minutes) : required), 0)

const respectsBreaks = (law: WorkingTimeLaw, dayWork: readonly PlanInterval[], block: PlanInterval) => {
  const sorted = [...dayWork, block].sort((a, b) => a.start - b.start)
  const stretches: PlanInterval[] = []
  for (const interval of sorted) {
    const last = stretches.at(-1)
    if (last && interval.start - last.end < BREAK_CHUNK_MINUTES) last.end = Math.max(last.end, interval.end)
    else stretches.push({ ...interval })
  }
  const total = sorted.reduce((sum, interval) => sum + length(interval), 0)
  const breaks = stretches.slice(1).reduce((sum, stretch, index) => sum + stretch.start - stretches[index].end, 0)
  const own = stretches.find((stretch) => stretch.start <= block.start && block.end <= stretch.end)
  return breaks >= requiredBreak(law, total) && (!own || length(own) <= law.maxStretchMinutes)
}

const respectsRest = (law: WorkingTimeLaw, work: WorkIndex, day: number, block: PlanInterval) => {
  const reach = Math.ceil(law.restMinutes / MINUTES_PER_DAY) + 1
  for (let other = day - reach; other <= day + reach; other += 1) {
    if (other === day) continue
    for (const interval of work.on(other)) {
      if (interval.end <= block.start && block.start - interval.end < law.restMinutes) return false
      if (interval.start >= block.end && interval.start - block.end < law.restMinutes) return false
      if (overlaps(interval, block)) return false
    }
  }
  return true
}

type Planner = {
  request: PlanRequest
  busy: DayIndex
  existing: DayIndex
  work: WorkIndex
  blocks: PlanInterval[]
  remaining: number
  buffer: number
}

const nearby = (index: DayIndex, day: number) => [...index.on(day - 1), ...index.on(day), ...index.on(day + 1)]

const keepsBuffer = ({ existing, buffer }: Planner, day: number, block: PlanInterval) =>
  buffer === 0 ||
  !nearby(existing, day).some((interval) =>
    overlaps(interval, { start: block.start - buffer, end: block.end + buffer }),
  )

const isFeasible = (planner: Planner, day: number, block: PlanInterval) => {
  const { request, busy, work } = planner
  const { law } = request
  if (busy.on(day).some((interval) => overlaps(interval, block))) return false
  if (!keepsBuffer(planner, day, block)) return false
  const minutes = length(block)
  if (work.minutesOn(day) + minutes > law.maxDailyMinutes) return false
  if (work.minutesInWeekOf(day) + minutes > law.maxWeeklyMinutes) return false
  if (!respectsBreaks(law, work.on(day), block)) return false
  return respectsRest(law, work, day, block)
}

const acceptsRemainder = (remaining: number, minutes: number) =>
  remaining - minutes === 0 || remaining - minutes >= MIN_BLOCK_MINUTES

const candidateLengths = (longest: number, residue: number, fitting: readonly number[]) => {
  const lengths = new Set<number>([longest, ...fitting.filter((minutes) => minutes > 0 && minutes < longest)])
  const first = longest - ((((longest - residue) % PLAN_STEP_MINUTES) + PLAN_STEP_MINUTES) % PLAN_STEP_MINUTES)
  for (let minutes = first; minutes > 0; minutes -= PLAN_STEP_MINUTES) lengths.add(minutes)
  for (let minutes = longest - (longest % PLAN_STEP_MINUTES); minutes > 0; minutes -= PLAN_STEP_MINUTES)
    lengths.add(minutes)
  return [...lengths].sort((a, b) => b - a)
}

const stepResidue = (minute: number) => ((minute % PLAN_STEP_MINUTES) + PLAN_STEP_MINUTES) % PLAN_STEP_MINUTES

const findBlock = (planner: Planner, day: number, need: number): PlanInterval | null => {
  const { request, remaining } = planner
  const dayStart = day * MINUTES_PER_DAY
  const earliest = ceilToStep(Math.max(dayStart + request.windowStart, ceilToStep(request.from)))
  const latest = Math.min(dayStart + request.windowEnd, request.deadline ?? Number.POSITIVE_INFINITY)
  const shortest = Math.min(MIN_BLOCK_MINUTES, remaining)
  const fits = (block: PlanInterval) => {
    const minutes = length(block)
    return minutes >= shortest && acceptsRemainder(remaining, minutes) && isFeasible(planner, day, block)
  }
  const existing = planner.buffer > 0 ? nearby(planner.existing, day) : []
  const inRange = (minute: number) => minute >= earliest && minute <= latest
  if (request.distribution === 'late' && request.deadline !== null) {
    const ends = new Set<number>()
    for (
      let end = Math.floor(latest / PLAN_STEP_MINUTES) * PLAN_STEP_MINUTES;
      end - shortest >= earliest;
      end -= PLAN_STEP_MINUTES
    )
      ends.add(end)
    for (const interval of existing)
      if (inRange(interval.start - planner.buffer)) ends.add(interval.start - planner.buffer)
    for (const end of [...ends].sort((a, b) => b - a)) {
      const fitting = existing.map((interval) => end - interval.end - planner.buffer)
      for (const minutes of candidateLengths(Math.min(need, end - earliest), stepResidue(end), fitting)) {
        const block = { start: end - minutes, end }
        if (fits(block)) return block
      }
    }
    return null
  }
  const starts = new Set<number>()
  for (let start = earliest; start + shortest <= latest; start += PLAN_STEP_MINUTES) starts.add(start)
  for (const interval of existing) if (inRange(interval.end + planner.buffer)) starts.add(interval.end + planner.buffer)
  for (const start of [...starts].sort((a, b) => a - b)) {
    const fitting = existing.map((interval) => interval.start - planner.buffer - start)
    for (const minutes of candidateLengths(Math.min(need, latest - start), stepResidue(-start), fitting)) {
      const block = { start, end: start + minutes }
      if (fits(block)) return block
    }
  }
  return null
}

const placeOn = (planner: Planner, day: number, wanted: number) => {
  let placed = 0
  while (planner.remaining > 0 && placed < wanted) {
    const block = findBlock(planner, day, Math.min(wanted - placed, planner.remaining))
    if (!block) break
    planner.blocks.push(block)
    planner.busy.add(block)
    planner.work.add(block)
    planner.remaining -= length(block)
    placed += length(block)
  }
}

const listPlanningDays = (request: PlanRequest) => {
  const first = dayOf(ceilToStep(request.from))
  const last =
    request.deadline === null ? first + NO_DEADLINE_DAYS - 1 : dayOf(Math.max(request.deadline - 1, request.from))
  const days: number[] = []
  for (let day = first; day <= last; day += 1) {
    if (isRestDay(request.law, weekdayOf(day)) || request.blockedDates.has(dayToDate(day))) continue
    days.push(day)
  }
  return days
}

const evenTarget = (remaining: number, daysLeft: number) => {
  const share = Math.max(MIN_BLOCK_MINUTES, ceilToStep(remaining / daysLeft))
  return remaining - share < MIN_BLOCK_MINUTES ? remaining : share
}

const toPlannedBlock = ({ start, end }: PlanInterval): PlannedBlock => ({
  date: dayToDate(dayOf(start)),
  start: minutesToTime(start % MINUTES_PER_DAY),
  end: minutesToTime(end % MINUTES_PER_DAY),
  minutes: end - start,
})

const runPlanner = (request: PlanRequest, buffer: number): PlanResult => {
  const busy = new DayIndex()
  const existing = new DayIndex()
  const work = new WorkIndex()
  for (const interval of request.busy) {
    busy.add(interval)
    existing.add(interval)
  }
  for (const interval of request.work) {
    busy.add(interval)
    existing.add(interval)
    work.add(interval)
  }
  const planner: Planner = {
    request,
    busy,
    existing,
    work,
    blocks: [],
    remaining: Math.max(0, Math.round(request.effortMinutes)),
    buffer,
  }
  const effort = planner.remaining
  const planned = listPlanningDays(request)
  const days = request.distribution === 'late' && request.deadline !== null ? planned.reverse() : planned
  if (request.distribution === 'even' && request.deadline !== null)
    days.forEach((day, index) => {
      if (planner.remaining > 0) placeOn(planner, day, evenTarget(planner.remaining, days.length - index))
    })
  for (const day of days) {
    if (planner.remaining <= 0) break
    placeOn(planner, day, planner.remaining)
  }
  if (planner.remaining > 0 && planner.buffer > 0) {
    planner.buffer = 0
    for (const day of days) {
      if (planner.remaining <= 0) break
      placeOn(planner, day, planner.remaining)
    }
  }
  const blocks = [...planner.blocks].sort((a, b) => a.start - b.start).map(toPlannedBlock)
  return { blocks, plannedMinutes: effort - planner.remaining, missingMinutes: planner.remaining }
}

export const planTask = (request: PlanRequest): PlanResult => {
  const buffered = runPlanner(request, PLAN_BUFFER_MINUTES)
  if (buffered.missingMinutes === 0) return buffered
  const tight = runPlanner(request, 0)
  return tight.plannedMinutes > buffered.plannedMinutes ? tight : buffered
}

export const findEarliestCompletion = (request: Omit<PlanRequest, 'distribution'>) => {
  const result = planTask({ ...request, deadline: null, distribution: 'early' })
  return result.missingMinutes > 0 ? null : (result.blocks.at(-1)?.date ?? null)
}
