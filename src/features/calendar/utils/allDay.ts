import type { EventSegment } from '../types/eventLayout.ts'

export type AllDaySegment = { segment: EventSegment; row: number; isFirst: boolean }

export type AllDayLanes = {
  allDay: ReadonlyMap<string, readonly AllDaySegment[]>
  timed: ReadonlyMap<string, readonly EventSegment[]>
  rows: number
}

type AllDayRun = { key: string; title: string; segments: EventSegment[] }

const compareRuns = (a: AllDayRun, b: AllDayRun) =>
  a.segments[0].date.localeCompare(b.segments[0].date) ||
  b.segments.length - a.segments.length ||
  a.title.localeCompare(b.title)

export function splitAllDay(
  dates: readonly string[],
  segmentsByDate: ReadonlyMap<string, readonly EventSegment[]>,
): AllDayLanes {
  const timed = new Map<string, EventSegment[]>()
  const runs = new Map<string, AllDayRun>()
  for (const date of dates) {
    const segments = segmentsByDate.get(date) ?? []
    timed.set(date, segments.filter((segment) => !segment.event.allDay))
    for (const segment of segments) {
      if (!segment.event.allDay) continue
      const key = segment.event.occurrenceKey
      const run = runs.get(key)
      if (run) run.segments.push(segment)
      else runs.set(key, { key, title: segment.event.title, segments: [segment] })
    }
  }

  const allDay = new Map<string, AllDaySegment[]>(dates.map((date) => [date, []]))
  const rowEnds: string[] = []
  for (const run of [...runs.values()].sort(compareRuns)) {
    const first = run.segments[0].date
    const last = run.segments[run.segments.length - 1].date
    let row = rowEnds.findIndex((end) => end < first)
    if (row === -1) row = rowEnds.length
    rowEnds[row] = last
    run.segments.forEach((segment, index) => allDay.get(segment.date)?.push({ segment, row, isFirst: index === 0 }))
  }

  return { allDay, timed, rows: Math.max(1, rowEnds.length) }
}
