import type { ToggleEvent } from 'react'

const POPOVER_GAP_PX = 8

export const placeBelowTrigger = (event: ToggleEvent<HTMLElement>) => {
  if (event.newState !== 'open') return
  const menu = event.currentTarget
  const trigger = (menu.getRootNode() as Document | ShadowRoot).querySelector<HTMLElement>(
    `[popovertarget="${menu.id}"]`,
  )
  if (!trigger) return
  const { bottom, right } = trigger.getBoundingClientRect()
  menu.style.top = `${bottom + POPOVER_GAP_PX}px`
  menu.style.right = `${Math.max(document.documentElement.clientWidth - right, POPOVER_GAP_PX)}px`
}
