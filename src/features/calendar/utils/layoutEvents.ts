import type { EventSegment, PositionedSegment } from '../types/eventLayout.ts'
import { getVisibleEnd } from './eventGeometry.ts'

const compareSegments = (a: EventSegment, b: EventSegment) =>
  a.start - b.start || b.end - b.start - (a.end - a.start) || a.event.title.localeCompare(b.event.title)

export const sortSegments = (segments: readonly EventSegment[]) => segments.toSorted(compareSegments)

export function layoutEvents(segments: readonly EventSegment[]): PositionedSegment[] {
  const positioned: PositionedSegment[] = []
  let cluster: { segment: EventSegment; column: number }[] = []
  let columnEnds: number[] = []
  let clusterEnd = -1

  const flushCluster = () => {
    for (const item of cluster) positioned.push({ ...item, columns: columnEnds.length })
    cluster = []
    columnEnds = []
  }

  for (const segment of sortSegments(segments)) {
    const { start } = segment
    const end = getVisibleEnd(segment)
    if (start >= clusterEnd) flushCluster()

    const freeColumn = columnEnds.findIndex((columnEnd) => columnEnd <= start)
    const column = freeColumn === -1 ? columnEnds.length : freeColumn
    columnEnds[column] = end
    cluster.push({ segment, column })
    clusterEnd = Math.max(clusterEnd, end)
  }

  flushCluster()
  return positioned
}
