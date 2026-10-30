import { timeToMinutes } from '../../../utils/date.ts'
import { compareEvents, type CalendarEvent } from '../../../utils/event.ts'
import type { PositionedEvent } from '../types/eventLayout.ts'

type TimedEvent = {
  event: CalendarEvent
  start: number
  end: number
}

export function layoutEvents(events: readonly CalendarEvent[], minDuration = 0): PositionedEvent[] {
  const timed: TimedEvent[] = events.toSorted(compareEvents).map((event) => {
    const start = timeToMinutes(event.start)
    return { event, start, end: Math.max(timeToMinutes(event.end), start + minDuration) }
  })

  const positioned: PositionedEvent[] = []
  let cluster: { event: CalendarEvent; column: number }[] = []
  let columnEnds: number[] = []
  let clusterEnd = -1

  const flushCluster = () => {
    for (const item of cluster) positioned.push({ ...item, columns: columnEnds.length })
    cluster = []
    columnEnds = []
  }

  for (const { event, start, end } of timed) {
    if (start >= clusterEnd) flushCluster()

    const freeColumn = columnEnds.findIndex((columnEnd) => columnEnd <= start)
    const column = freeColumn === -1 ? columnEnds.length : freeColumn
    columnEnds[column] = end
    cluster.push({ event, column })
    clusterEnd = Math.max(clusterEnd, end)
  }

  flushCluster()
  return positioned
}
