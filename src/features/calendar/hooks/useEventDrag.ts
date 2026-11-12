import type { RefObject } from 'react'
import { MINUTES_PER_DAY } from '../../../utils/date.ts'
import type { EventOccurrence, EventPeriod } from '../../../utils/event.ts'
import {
  applyDragDelta,
  getDragDelta,
  isSamePeriod,
  type DragMode,
  type DragPoint,
  type DragUnit,
} from '../utils/eventDrag.ts'
import { usePressDrag, type Point } from './usePressDrag.ts'

const DELAY = { mouse: 1000, touch: 1000 }

export type DragPreview = { occurrenceKey: string; period: EventPeriod }

type UseEventDragOptions = {
  containerRef: RefObject<HTMLElement | null>
  enabled: boolean
  occurrences: ReadonlyMap<string, EventOccurrence>
  onPreview: (preview: DragPreview | null) => void
  onDrop: (occurrence: EventOccurrence, period: EventPeriod) => void
}

type EventPress = {
  scope: Document | ShadowRoot
  occurrence: EventOccurrence
  mode: DragMode
  unit: DragUnit
  origin: DragPoint
  period: EventPeriod
  preview: EventPeriod
}

const findDragPoint = (scope: Document | ShadowRoot, { x, y }: Point, unit: DragUnit): DragPoint | null => {
  const cell = scope.elementFromPoint(x, y)?.closest<HTMLElement>('[data-date]')
  const date = cell?.dataset.date
  if (!cell || !date) return null
  if (unit === 'days') return { date, minutes: 0 }
  const slots = cell.querySelector<HTMLElement>('.slots')
  if (!slots) return null
  const { top, height } = slots.getBoundingClientRect()
  const minutes = Math.min(Math.max(((y - top) / height) * MINUTES_PER_DAY, 0), MINUTES_PER_DAY)
  return { date, minutes }
}

export function useEventDrag({ containerRef, enabled, occurrences, onPreview, onDrop }: UseEventDragOptions) {
  usePressDrag<EventPress>({
    containerRef,
    enabled,
    delay: DELAY,
    vibrateMs: 15,
    start: (target, point) => {
      if (target instanceof Element && target.closest('a[href]')) return null
      const element = target instanceof Element ? target.closest<HTMLElement>('[data-occurrence-key]') : null
      const occurrence = element && occurrences.get(element.dataset.occurrenceKey ?? '')
      if (!element || !occurrence) return null
      const scope = element.getRootNode() as Document | ShadowRoot
      const unit: DragUnit = element.closest('.slots') ? 'minutes' : 'days'
      const origin = findDragPoint(scope, point, unit)
      if (!origin) return null
      const { startDate, start, endDate, end } = occurrence
      const period = { startDate, start, endDate, end }
      const mode: DragMode = target instanceof Element && target.closest('.eventResizeHandle') ? 'resize' : 'move'
      return { scope, occurrence, mode, unit, origin, period, preview: period }
    },
    activate: (press) => {
      containerRef.current?.classList.add('isDraggingEvent')
      onPreview({ occurrenceKey: press.occurrence.occurrenceKey, period: press.period })
    },
    move: (press, point) => {
      const target = findDragPoint(press.scope, point, press.unit)
      if (!target) return
      const next = applyDragDelta(press.period, press.mode, getDragDelta(press.unit, press.origin, target))
      if (isSamePeriod(press.preview, next)) return
      press.preview = next
      onPreview({ occurrenceKey: press.occurrence.occurrenceKey, period: next })
    },
    finish: (press, commit, wasActive) => {
      if (!wasActive) return
      containerRef.current?.classList.remove('isDraggingEvent')
      if (commit && !isSamePeriod(press.preview, press.period)) onDrop(press.occurrence, press.preview)
      else onPreview(null)
    },
  })
}
