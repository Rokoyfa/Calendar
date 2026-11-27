import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { PopoverAnchor } from '../../../components/AnchoredPopover.tsx'

const RECENT_MS = 1500

export function usePointerAnchor(containerRef: RefObject<HTMLElement | null>) {
  const last = useRef<(PopoverAnchor & { at: number }) | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const remember = (event: PointerEvent) => {
      last.current = { x: event.clientX, y: event.clientY, at: Date.now() }
    }
    container.addEventListener('pointerup', remember, true)
    return () => container.removeEventListener('pointerup', remember, true)
  }, [containerRef])

  return useCallback((): PopoverAnchor => {
    const recent = last.current
    if (recent && Date.now() - recent.at < RECENT_MS) return { x: recent.x, y: recent.y }
    const root = containerRef.current?.getRootNode() as Document | ShadowRoot | undefined
    const focused = root?.activeElement
    if (focused instanceof HTMLElement) {
      const { left, bottom, width } = focused.getBoundingClientRect()
      return { x: left + Math.min(width, 120), y: bottom }
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 3 }
  }, [containerRef])
}
