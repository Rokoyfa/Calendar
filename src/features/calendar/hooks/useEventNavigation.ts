import { useEffect, type RefObject } from 'react'
import { EVENT_ACTION_KEYS } from '../utils/eventKeys.ts'

export const EVENT_NAVIGATION_KEYS = 'ArrowUp ArrowDown ArrowLeft ArrowRight Home End'

export const EVENT_KEYS = `${EVENT_NAVIGATION_KEYS} Enter ${EVENT_ACTION_KEYS}`

const NAVIGATION_KEYS = new Set(EVENT_NAVIGATION_KEYS.split(' '))
const TARGET_SELECTOR = '[data-event-target]'
const DAY_SELECTOR = '[data-date]'

const isVisible = (element: HTMLElement) => element.getClientRects().length > 0

export const findNextEvent = (
  targets: readonly HTMLElement[],
  current: HTMLElement,
  key: string,
  dayOf: (element: HTMLElement) => Element | null,
): HTMLElement | null => {
  const index = targets.indexOf(current)
  if (index === -1) return null
  if (key === 'Home') return targets[0] ?? null
  if (key === 'End') return targets.at(-1) ?? null
  const day = dayOf(current)
  const sameDay = targets.filter((target) => dayOf(target) === day)
  const position = sameDay.indexOf(current)
  if (key === 'ArrowUp') return sameDay[position - 1] ?? null
  if (key === 'ArrowDown') return sameDay[position + 1] ?? null
  const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0
  if (step === 0) return null
  for (let next = index + step; next >= 0 && next < targets.length; next += step) {
    const nextDay = dayOf(targets[next])
    if (nextDay === day) continue
    const dayTargets = targets.filter((target) => dayOf(target) === nextDay)
    return dayTargets[Math.min(position, dayTargets.length - 1)] ?? null
  }
  return null
}

export function useEventNavigation(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const current = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(TARGET_SELECTOR) : null
      if (!current || !container.contains(current)) return
      if (!NAVIGATION_KEYS.has(event.key)) return
      event.preventDefault()
      const targets = [...container.querySelectorAll<HTMLElement>(TARGET_SELECTOR)].filter(isVisible)
      const next = findNextEvent(targets, current, event.key, (element) => element.closest(DAY_SELECTOR))
      if (!next) return
      next.focus()
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    container.addEventListener('keydown', onKeyDown)
    return () => container.removeEventListener('keydown', onKeyDown)
  }, [containerRef])
}
