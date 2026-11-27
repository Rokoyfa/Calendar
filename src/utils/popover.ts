import type { ToggleEvent } from 'react'

const POPOVER_GAP_PX = 8

const findTrigger = (menu: HTMLElement) =>
  (menu.getRootNode() as Document | ShadowRoot).querySelector<HTMLElement>(`[popovertarget="${CSS.escape(menu.id)}"]`)

export const placeBelowTrigger = (event: ToggleEvent<HTMLElement>) => {
  if (event.newState !== 'open') return
  const menu = event.currentTarget
  const trigger = findTrigger(menu)
  if (!trigger) return
  const { bottom, right } = trigger.getBoundingClientRect()
  menu.style.top = `${bottom + POPOVER_GAP_PX}px`
  menu.style.right = `${Math.max(document.documentElement.clientWidth - right, POPOVER_GAP_PX)}px`
}

export const placeBelowTriggerStart = (event: ToggleEvent<HTMLElement>) => {
  if (event.newState !== 'open') return
  const menu = event.currentTarget
  const trigger = findTrigger(menu)
  if (!trigger) return
  const { bottom, left } = trigger.getBoundingClientRect()
  const start = Math.max(left, POPOVER_GAP_PX)
  menu.style.top = `${bottom + POPOVER_GAP_PX}px`
  menu.style.left = `${start}px`
  menu.style.maxWidth = `${document.documentElement.clientWidth - start - POPOVER_GAP_PX}px`
  menu.style.maxHeight = `${window.innerHeight - bottom - 2 * POPOVER_GAP_PX}px`
}
