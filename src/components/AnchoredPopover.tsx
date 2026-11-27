import { useEffect, useLayoutEffect, useRef, type ReactNode, type ToggleEvent } from 'react'
import { classNames } from '../utils/classNames.ts'

export type PopoverAnchor = { x: number; y: number }

type AnchoredPopoverProps = {
  anchor: PopoverAnchor
  label: string
  className?: string
  onClose: () => void
  children: ReactNode
}

const EDGE_PX = 8
const OFFSET_PX = 6

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)))

const placePopover = (popover: HTMLElement, anchor: PopoverAnchor) => {
  const { width, height } = popover.getBoundingClientRect()
  const right = anchor.x + OFFSET_PX + width
  const left = right > window.innerWidth - EDGE_PX ? anchor.x - OFFSET_PX - width : anchor.x + OFFSET_PX
  const below = anchor.y + OFFSET_PX
  const top = below + height > window.innerHeight - EDGE_PX ? anchor.y - OFFSET_PX - height : below
  popover.style.left = `${clamp(left, EDGE_PX, window.innerWidth - width - EDGE_PX)}px`
  popover.style.top = `${clamp(top, EDGE_PX, window.innerHeight - height - EDGE_PX)}px`
}

export function AnchoredPopover({ anchor, label, className, onClose, children }: AnchoredPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const anchorRef = useRef(anchor)
  const isOpening = useRef(false)
  const shouldReopen = useRef(false)

  const open = (popover: HTMLElement) => {
    popover.showPopover()
    placePopover(popover, anchorRef.current)
    popover.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    isOpening.current = true
    setTimeout(() => {
      isOpening.current = false
    })
  }

  useLayoutEffect(() => {
    anchorRef.current = anchor
    const popover = ref.current
    if (!popover) return
    if (popover.matches(':popover-open')) return placePopover(popover, anchor)
    const focused = (popover.getRootNode() as Document | ShadowRoot).activeElement
    returnFocus.current = focused instanceof HTMLElement ? focused : null
    open(popover)
  }, [anchor])

  useEffect(() => {
    const popover = ref.current
    if (!popover) return
    const handleBeforeToggle = (event: Event) => {
      if (event instanceof globalThis.ToggleEvent && event.newState === 'closed' && isOpening.current)
        shouldReopen.current = true
    }
    popover.addEventListener('beforetoggle', handleBeforeToggle)
    return () => popover.removeEventListener('beforetoggle', handleBeforeToggle)
  }, [])

  const handleToggle = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState !== 'closed') return
    const popover = event.currentTarget
    if (shouldReopen.current) {
      shouldReopen.current = false
      if (!popover.matches(':popover-open')) open(popover)
      return
    }
    const target = returnFocus.current
    if (target?.isConnected && !popover.contains(target)) target.focus({ preventScroll: true })
    onClose()
  }

  return (
    <div
      ref={ref}
      popover="auto"
      role="dialog"
      aria-label={label}
      className={classNames('anchoredPopover surface', className)}
      onToggle={handleToggle}
    >
      {children}
    </div>
  )
}
