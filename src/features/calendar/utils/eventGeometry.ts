import { MIN_VISIBLE_DURATION } from '../constants/grid.ts'
import type { EventSegment } from '../types/eventLayout.ts'

export const getVisibleEnd = ({ start, end }: Pick<EventSegment, 'start' | 'end'>) =>
  Math.max(end, start + MIN_VISIBLE_DURATION)

export const getVisibleDuration = (segment: Pick<EventSegment, 'start' | 'end'>) =>
  getVisibleEnd(segment) - segment.start
