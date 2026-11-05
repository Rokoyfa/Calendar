import type { HourSlot } from '../../../utils/event.ts'
import { HOURS_PER_DAY } from '../../../utils/date.ts'

export type SlotSelection = { anchor: HourSlot; current: HourSlot }

export type SlotRange = { first: HourSlot; last: HourSlot }

const slotKey = ({ date, hour }: HourSlot) => `${date}T${String(hour).padStart(2, '0')}`

export const isSameSlot = (a: HourSlot | null, b: HourSlot | null) =>
  a !== null && b !== null && slotKey(a) === slotKey(b)

export const toSlotRange = ({ anchor, current }: SlotSelection): SlotRange =>
  slotKey(anchor) <= slotKey(current) ? { first: anchor, last: current } : { first: current, last: anchor }

export const getHoursOnDate = ({ first, last }: SlotRange, date: string) => {
  if (date < first.date || date > last.date) return null
  const fromHour = date === first.date ? first.hour : 0
  const toHour = date === last.date ? last.hour : HOURS_PER_DAY - 1
  return { fromHour, toHour }
}

export const findSlotAt = (x: number, y: number): HourSlot | null => {
  const day = document.elementFromPoint(x, y)?.closest<HTMLElement>('.day[data-date]')
  const slots = day?.querySelector<HTMLElement>('.slots')
  if (!day?.dataset.date || !slots) return null
  const { top, height } = slots.getBoundingClientRect()
  const hour = Math.floor(((y - top) / height) * HOURS_PER_DAY)
  return { date: day.dataset.date, hour: Math.min(Math.max(hour, 0), HOURS_PER_DAY - 1) }
}

export const getSlotFromTarget = (target: EventTarget | null): HourSlot | null => {
  if (!(target instanceof Element)) return null
  const slot = target.closest<HTMLElement>('.slot[data-hour]')
  const date = slot?.closest<HTMLElement>('.day[data-date]')?.dataset.date
  return slot && date ? { date, hour: Number(slot.dataset.hour) } : null
}
