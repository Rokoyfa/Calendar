import { useEffect, useRef, type RefObject } from 'react'

const MIN_DISTANCE_PX = 60
const MAX_DURATION_MS = 700
const DIRECTION_RATIO = 1.5
const IGNORE_SELECTOR = 'input, textarea, select, [contenteditable="true"], .eventDragging'

type Swipe = { x: number; y: number; at: number }

const canScrollTowards = (element: HTMLElement, direction: number) => {
  if (element.scrollWidth <= element.clientWidth) return false
  return direction > 0 ? element.scrollLeft + element.clientWidth < element.scrollWidth - 1 : element.scrollLeft > 0
}

export function useSwipeNavigation(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onPrevious: () => void,
  onNext: () => void,
) {
  const handlers = useRef({ onPrevious, onNext })
  useEffect(() => {
    handlers.current = { onPrevious, onNext }
  }, [onPrevious, onNext])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return
    let start: Swipe | null = null
    const handleStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      const target = event.target instanceof Element ? event.target : null
      start =
        event.touches.length === 1 && touch && !target?.closest(IGNORE_SELECTOR)
          ? { x: touch.clientX, y: touch.clientY, at: Date.now() }
          : null
    }
    const handleEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const began = start
      start = null
      if (!began || !touch || Date.now() - began.at > MAX_DURATION_MS) return
      const dx = touch.clientX - began.x
      const dy = touch.clientY - began.y
      if (Math.abs(dx) < MIN_DISTANCE_PX || Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return
      if (canScrollTowards(container, -Math.sign(dx))) return
      if (dx < 0) handlers.current.onNext()
      else handlers.current.onPrevious()
    }
    const handleCancel = () => {
      start = null
    }
    container.addEventListener('touchstart', handleStart, { passive: true })
    container.addEventListener('touchend', handleEnd, { passive: true })
    container.addEventListener('touchcancel', handleCancel, { passive: true })
    return () => {
      container.removeEventListener('touchstart', handleStart)
      container.removeEventListener('touchend', handleEnd)
      container.removeEventListener('touchcancel', handleCancel)
    }
  }, [containerRef, enabled])
}
