import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { HourSlot } from '../../../utils/event.ts'
import {
  findSlotAt,
  getSlotFromTarget,
  isSameSlot,
  toSlotRange,
  type SlotRange,
  type SlotSelection,
} from '../utils/slotSelection.ts'

const LONG_PRESS_MS = 350
const MOVE_TOLERANCE_PX = 8
const EDGE_PX = 48
const SCROLL_STEP_PX = 12
const CLICK_SUPPRESSION_MS = 500

type Point = { x: number; y: number }

export function useSlotSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onSelect: (range: SlotRange) => void,
) {
  const [selection, setSelection] = useState<SlotSelection | null>(null)
  const onSelectRef = useRef(onSelect)
  const suppressClickUntil = useRef(0)

  useEffect(() => {
    onSelectRef.current = onSelect
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    let anchor: HourSlot | null = null
    let current: HourSlot | null = null
    let isActive = false
    let pressTimer: ReturnType<typeof setTimeout> | undefined
    let frame = 0
    let pressPoint: Point | null = null
    let lastPoint: Point | null = null
    const scroller = container.closest<HTMLElement>('.scrollArea')
    const scope = container.getRootNode() as Document | ShadowRoot

    const moveTo = ({ x, y }: Point) => {
      const slot = findSlotAt(scope, x, y)
      if (!slot || !anchor || isSameSlot(slot, current)) return
      current = slot
      setSelection({ anchor, current })
    }

    const autoScroll = () => {
      if (!isActive) return
      if (scroller && lastPoint) {
        const { top, bottom } = scroller.getBoundingClientRect()
        const step = lastPoint.y < top + EDGE_PX ? -SCROLL_STEP_PX : lastPoint.y > bottom - EDGE_PX ? SCROLL_STEP_PX : 0
        if (step !== 0) {
          scroller.scrollTop += step
          moveTo(lastPoint)
        }
      }
      frame = requestAnimationFrame(autoScroll)
    }

    const activate = (slot: HourSlot) => {
      isActive = true
      anchor = slot
      current = slot
      setSelection({ anchor, current })
      frame = requestAnimationFrame(autoScroll)
    }

    const finish = (commit: boolean) => {
      clearTimeout(pressTimer)
      pressTimer = undefined
      cancelAnimationFrame(frame)
      if (isActive && commit && anchor && current) {
        suppressClickUntil.current = Date.now() + CLICK_SUPPRESSION_MS
        onSelectRef.current(toSlotRange({ anchor, current }))
      }
      if (isActive) setSelection(null)
      isActive = false
      anchor = null
      current = null
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return
      const slot = getSlotFromTarget(event.target)
      if (!slot) return
      event.preventDefault()
      lastPoint = { x: event.clientX, y: event.clientY }
      activate(slot)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isActive || event.pointerType !== 'mouse') return
      lastPoint = { x: event.clientX, y: event.clientY }
      moveTo(lastPoint)
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') finish(true)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return finish(false)
      const slot = getSlotFromTarget(event.target)
      if (!slot) return
      const touch = event.touches[0]
      pressPoint = lastPoint = { x: touch.clientX, y: touch.clientY }
      pressTimer = setTimeout(() => {
        pressTimer = undefined
        activate(slot)
        navigator.vibrate?.(10)
      }, LONG_PRESS_MS)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      lastPoint = { x: touch.clientX, y: touch.clientY }
      if (isActive) {
        event.preventDefault()
        moveTo(lastPoint)
      } else if (pressTimer && pressPoint) {
        const distance = Math.hypot(lastPoint.x - pressPoint.x, lastPoint.y - pressPoint.y)
        if (distance > MOVE_TOLERANCE_PX) finish(false)
      }
    }

    const handleTouchEnd = () => finish(true)
    const handleTouchCancel = () => finish(false)

    const handleContextMenu = (event: Event) => {
      if (isActive || pressTimer || getSlotFromTarget(event.target)) event.preventDefault()
    }

    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchcancel', handleTouchCancel)
    container.addEventListener('contextmenu', handleContextMenu)

    return () => {
      finish(false)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchCancel)
      container.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [containerRef, enabled])

  const isClickSuppressed = useCallback(() => Date.now() < suppressClickUntil.current, [])

  return { selection, isClickSuppressed }
}
