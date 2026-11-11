import { useEffect, useRef, type RefObject } from 'react'

const MOVE_TOLERANCE_PX = 8
const EDGE_PX = 48
const SCROLL_STEP_PX = 12
const CLICK_SUPPRESSION_MS = 500

export type Point = { x: number; y: number }

const toHTMLElement = (target: EventTarget | null) => {
  let element = target instanceof Element ? target : null
  while (element && !(element instanceof HTMLElement)) element = element.parentElement
  return element
}

type PressDelay = { mouse: number; touch: number }

type PressDragHandlers<T> = {
  start: (target: EventTarget | null, point: Point) => T | null
  activate: (press: T) => void
  move: (press: T, point: Point) => void
  finish: (press: T, commit: boolean, wasActive: boolean) => void
}

type PressDragOptions<T> = PressDragHandlers<T> & {
  containerRef: RefObject<HTMLElement | null>
  enabled: boolean
  delay: PressDelay
  vibrateMs?: number
}

export function usePressDrag<T>({ containerRef, enabled, delay, vibrateMs = 10, ...handlers }: PressDragOptions<T>) {
  const latest = useRef(handlers)

  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    const scroller = container.closest<HTMLElement>('.scrollArea') ?? container
    let press: T | null = null
    let isActive = false
    let pressTimer: ReturnType<typeof setTimeout> | undefined
    let frame = 0
    let pressPoint: Point | null = null
    let lastPoint: Point | null = null
    let suppressClickUntil = 0
    let touchTarget: HTMLElement | null = null

    const autoScroll = () => {
      if (!isActive || !press) return
      if (lastPoint) {
        const { top, bottom } = scroller.getBoundingClientRect()
        const step = lastPoint.y < top + EDGE_PX ? -SCROLL_STEP_PX : lastPoint.y > bottom - EDGE_PX ? SCROLL_STEP_PX : 0
        if (step !== 0) {
          scroller.scrollTop += step
          latest.current.move(press, lastPoint)
        }
      }
      frame = requestAnimationFrame(autoScroll)
    }

    const activate = () => {
      pressTimer = undefined
      if (!press) return
      isActive = true
      latest.current.activate(press)
      if (vibrateMs > 0) navigator.vibrate?.(vibrateMs)
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
      if (press) {
        if (isActive) suppressClickUntil = Date.now() + CLICK_SUPPRESSION_MS
        latest.current.finish(press, commit, isActive)
      }
      press = null
      isActive = false
      pressPoint = null
    }

    const begin = (target: EventTarget | null, point: Point, wait: number) => {
      press = latest.current.start(target, point)
      if (!press) return false
      pressPoint = lastPoint = point
      if (wait > 0) pressTimer = setTimeout(activate, wait)
      else activate()
      return true
    }

    const track = (point: Point) => {
      lastPoint = point
      if (isActive && press) latest.current.move(press, point)
      else if (pressTimer && pressPoint && Math.hypot(point.x - pressPoint.x, point.y - pressPoint.y) > MOVE_TOLERANCE_PX)
        finish(false)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || press) return
      if (begin(event.target, { x: event.clientX, y: event.clientY }, delay.mouse) && delay.mouse === 0)
        event.preventDefault()
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
      if (press) return
      const touch = event.touches[0]
      const target = toHTMLElement(event.target)
      if (!target || !begin(target, { x: touch.clientX, y: touch.clientY }, delay.touch)) return
      touchTarget = target
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
      if (press) event.preventDefault()
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
  }, [containerRef, enabled, delay.mouse, delay.touch, vibrateMs])
}
