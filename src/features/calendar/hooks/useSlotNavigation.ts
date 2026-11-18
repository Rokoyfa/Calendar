import { useEffect, useRef, useState, type RefObject } from 'react'
import { HOURS_PER_DAY } from '../../../utils/date.ts'
import { DEFAULT_EVENT_HOUR } from '../constants/grid.ts'

export const SLOT_NAVIGATION_KEYS = 'ArrowUp ArrowDown ArrowLeft ArrowRight Home End Enter Space'

export type SlotPosition = { date: string; hour: number }

const LAST_HOUR = HOURS_PER_DAY - 1

export const moveSlot = (dates: readonly string[], slot: SlotPosition, key: string): SlotPosition | null => {
  const index = dates.indexOf(slot.date)
  if (index === -1) return null
  const clampHour = (hour: number) => Math.min(LAST_HOUR, Math.max(0, hour))
  switch (key) {
    case 'ArrowUp':
      return { ...slot, hour: clampHour(slot.hour - 1) }
    case 'ArrowDown':
      return { ...slot, hour: clampHour(slot.hour + 1) }
    case 'ArrowLeft':
      return { ...slot, date: dates[Math.max(0, index - 1)] }
    case 'ArrowRight':
      return { ...slot, date: dates[Math.min(dates.length - 1, index + 1)] }
    case 'Home':
      return { ...slot, hour: 0 }
    case 'End':
      return { ...slot, hour: LAST_HOUR }
    default:
      return null
  }
}

const slotSelector = ({ date, hour }: SlotPosition) => `[data-date="${date}"] .slot[data-hour="${hour}"]`

export function useSlotNavigation(
  containerRef: RefObject<HTMLElement | null>,
  dates: readonly string[],
  fallbackDate: string,
  enabled: boolean,
  onCreate: (date: string, hour: number) => void,
) {
  const [stored, setStored] = useState<SlotPosition>({ date: fallbackDate, hour: DEFAULT_EVENT_HOUR })
  const slot = dates.includes(stored.date) ? stored : { date: fallbackDate, hour: stored.hour }
  const state = useRef({ slot, dates, onCreate })

  useEffect(() => {
    state.current = { slot, dates, onCreate }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('slot')) return
      const { slot: current, dates: shown, onCreate: create } = state.current
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        create(current.date, current.hour)
        return
      }
      const next = moveSlot(shown, current, event.key)
      if (!next) return
      event.preventDefault()
      state.current = { ...state.current, slot: next }
      setStored(next)
      const element = container.querySelector<HTMLElement>(slotSelector(next))
      element?.focus()
      element?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || !target.classList.contains('slot')) return
      const date = target.closest<HTMLElement>('[data-date]')?.dataset.date
      const hour = Number(target.dataset.hour)
      if (date && Number.isInteger(hour)) setStored({ date, hour })
    }
    container.addEventListener('keydown', onKeyDown)
    container.addEventListener('focusin', onFocusIn)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      container.removeEventListener('focusin', onFocusIn)
    }
  }, [containerRef, enabled])

  return slot
}
