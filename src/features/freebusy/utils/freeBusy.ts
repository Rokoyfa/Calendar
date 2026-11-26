import { isISODate } from '../../../utils/date.ts'
import { asRecord, parseList } from '../../../utils/parse.ts'
import type { BusyInterval, FreeBusyPerson } from '../types/freeBusy.ts'

const parseInterval = (value: unknown): BusyInterval | null => {
  const { start, end } = asRecord(value)
  if (typeof start !== 'string' || typeof end !== 'string') return null
  const from = Date.parse(start)
  const to = Date.parse(end)
  return Number.isFinite(from) && Number.isFinite(to) && to > from ? { start: from, end: to } : null
}

export const parseFreeBusyPerson = (value: unknown): FreeBusyPerson | null => {
  const { email, name, available, busy, blockedDates } = asRecord(value)
  if (typeof email !== 'string' || email === '') return null
  const isAvailable = available === true
  return {
    email: email.toLowerCase(),
    name: isAvailable && typeof name === 'string' && name !== '' ? name : null,
    available: isAvailable,
    busy: isAvailable ? parseList(busy, parseInterval) : [],
    blockedDates: isAvailable ? parseList(blockedDates, (date) => (isISODate(date) ? date : null)) : [],
  }
}

export const parseFreeBusy = (value: unknown) => parseList(asRecord(value).people, parseFreeBusyPerson)
