import type { CalendarState, HostBridge, NewEventDraft } from '../context/HostBridge.ts'
import { isCalendarView, type CalendarView } from '../utils/calendarView.ts'
import { isISODate, toISODate } from '../utils/date.ts'

export type CalendarHandle = {
  getState: () => CalendarState | null
  goToDate: (date: string | Date) => boolean
  setView: (view: CalendarView) => boolean
  next: () => boolean
  previous: () => boolean
  today: () => boolean
  openEvent: (eventId: string, date: string | Date) => boolean
  createEvent: (draft?: NewEventDraft) => boolean
  refresh: () => boolean
}

export const HANDLE_METHODS = [
  'getState',
  'goToDate',
  'setView',
  'next',
  'previous',
  'today',
  'openEvent',
  'createEvent',
  'refresh',
] as const satisfies readonly (keyof CalendarHandle)[]

const toDate = (value: string | Date) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toISODate(value)
  return isISODate(value) ? value : null
}

export const createCalendarHandle = (bridge: HostBridge): CalendarHandle => {
  const run = (action: (controller: NonNullable<HostBridge['controller']>) => boolean | void) => {
    const { controller } = bridge
    return controller ? action(controller) !== false : false
  }
  return {
    getState: () => bridge.controller?.getState() ?? null,
    goToDate: (value) => {
      const date = toDate(value)
      return date !== null && run((controller) => controller.goToDate(date))
    },
    setView: (view) => isCalendarView(view) && run((controller) => controller.setView(view)),
    next: () => run((controller) => controller.next()),
    previous: () => run((controller) => controller.previous()),
    today: () => run((controller) => controller.today()),
    openEvent: (eventId, value) => {
      const date = toDate(value)
      return (
        typeof eventId === 'string' &&
        eventId !== '' &&
        date !== null &&
        run((controller) => controller.openEvent(eventId, date))
      )
    },
    createEvent: (draft) => run((controller) => controller.createEvent(draft)),
    refresh: () => run((controller) => controller.refresh()),
  }
}
