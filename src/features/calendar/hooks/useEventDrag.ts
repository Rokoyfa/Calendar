import { useEffect, useRef, type RefObject } from 'react'
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

const LONG_PRESS_MS = 1000
const MOVE_TOLERANCE_PX = 8
const EDGE_PX = 48
const SCROLL_STEP_PX = 12
const CLICK_SUPPRESSION_MS = 500

export type DragPreview = { occurrenceKey: string; period: EventPeriod }

type UseEventDragOptions = {
  containerRef: RefObject<HTMLElement | null>
  enabled: boolean
  occurrences: ReadonlyMap<string, EventOccurrence>
  onPreview: (preview: DragPreview | null) => void
  onDrop: (occurrence: EventOccurrence, period: EventPeriod) => void
}

type Point = { x: number; y: number }

type Press = {
  occurrence: EventOccurrence
  mode: DragMode
  unit: DragUnit
  origin: DragPoint
  period: EventPeriod
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

const findDraggable = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLElement>('[data-occurrence-key]') : null

export function useEventDrag({ containerRef, enabled, occurrences, onPreview, onDrop }: UseEventDragOptions) {
  const latest = useRef({ occurrences, onPreview, onDrop })

  useEffect(() => {
    latest.current = { occurrences, onPreview, onDrop }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    const scope = container.getRootNode() as Document | ShadowRoot
    const scroller = container.closest<HTMLElement>('.scrollArea') ?? container
    let press: Press | null = null
    let isActive = false
    let pressTimer: ReturnType<typeof setTimeout> | undefined
    let frame = 0
    let pressPoint: Point | null = null
    let lastPoint: Point | null = null
    let preview: EventPeriod | null = null
    let suppressClickUntil = 0
    let touchTarget: HTMLElement | null = null

    const moveTo = (point: Point) => {
      if (!press) return
      const target = findDragPoint(scope, point, press.unit)
      if (!target) return
      const next = applyDragDelta(press.period, press.mode, getDragDelta(press.unit, press.origin, target))
      if (preview && isSamePeriod(preview, next)) return
      preview = next
      latest.current.onPreview({ occurrenceKey: press.occurrence.occurrenceKey, period: next })
    }

    const autoScroll = () => {
      if (!isActive) return
      if (lastPoint) {
        const { top, bottom } = scroller.getBoundingClientRect()
        const step = lastPoint.y < top + EDGE_PX ? -SCROLL_STEP_PX : lastPoint.y > bottom - EDGE_PX ? SCROLL_STEP_PX : 0
        if (step !== 0) {
          scroller.scrollTop += step
          moveTo(lastPoint)
        }
      }
      frame = requestAnimationFrame(autoScroll)
    }

    const activate = () => {
      if (!press) return
      isActive = true
      preview = press.period
      latest.current.onPreview({ occurrenceKey: press.occurrence.occurrenceKey, period: preview })
      container.classList.add('isDraggingEvent')
      navigator.vibrate?.(15)
      frame = requestAnimationFrame(autoScroll)
    }

    const removeTouchListeners = () => {
      touchTarget?.removeEventListener('touchmove', handleTouchMove)
      touchTarget?.removeEventListener('touchend', handleTouchEnd)
      touchTarget?.removeEventListener('touchcancel', handleTouchCancel)
      touchTarget = null
    }

    const finish = (commit: boolean) => {
      clearTimeout(pressTimer)
      pressTimer = undefined
      cancelAnimationFrame(frame)
      removeTouchListeners()
      container.classList.remove('isDraggingEvent')
      if (isActive) {
        suppressClickUntil = Date.now() + CLICK_SUPPRESSION_MS
        if (commit && press && preview && !isSamePeriod(preview, press.period))
          latest.current.onDrop(press.occurrence, preview)
        else latest.current.onPreview(null)
      }
      isActive = false
      press = null
      preview = null
      pressPoint = null
    }

    const begin = (target: EventTarget | null, point: Point) => {
      const element = findDraggable(target)
      const occurrence = element && latest.current.occurrences.get(element.dataset.occurrenceKey ?? '')
      if (!element || !occurrence) return false
      const mode: DragMode = target instanceof Element && target.closest('.eventResizeHandle') ? 'resize' : 'move'
      const unit: DragUnit = element.closest('.slots') ? 'minutes' : 'days'
      const origin = findDragPoint(scope, point, unit)
      if (!origin) return false
      const { startDate, start, endDate, end } = occurrence
      press = { occurrence, mode, unit, origin, period: { startDate, start, endDate, end } }
      pressPoint = lastPoint = point
      pressTimer = setTimeout(() => {
        pressTimer = undefined
        activate()
      }, LONG_PRESS_MS)
      return true
    }

    const track = (point: Point) => {
      lastPoint = point
      if (isActive) moveTo(point)
      else if (pressTimer && pressPoint && Math.hypot(point.x - pressPoint.x, point.y - pressPoint.y) > MOVE_TOLERANCE_PX)
        finish(false)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      begin(event.target, { x: event.clientX, y: event.clientY })
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !press) return
      if (isActive) event.preventDefault()
      track({ x: event.clientX, y: event.clientY })
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && press) finish(true)
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0]
      if (!touch) return
      if (isActive) event.preventDefault()
      track({ x: touch.clientX, y: touch.clientY })
    }

    function handleTouchEnd() {
      finish(true)
    }

    function handleTouchCancel() {
      finish(false)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return finish(false)
      const touch = event.touches[0]
      if (!begin(event.target, { x: touch.clientX, y: touch.clientY }) || !(event.target instanceof HTMLElement)) return
      touchTarget = event.target
      touchTarget.addEventListener('touchmove', handleTouchMove, { passive: false })
      touchTarget.addEventListener('touchend', handleTouchEnd)
      touchTarget.addEventListener('touchcancel', handleTouchCancel)
    }

    const handleClick = (event: MouseEvent) => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleContextMenu = (event: Event) => {
      if (press || findDraggable(event.target)) event.preventDefault()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && press) finish(false)
    }

    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('click', handleClick, true)
    container.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      finish(false)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('click', handleClick, true)
      container.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, enabled])
}
