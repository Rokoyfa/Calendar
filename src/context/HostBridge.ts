import type { CalendarView } from '../utils/calendarView.ts'

export type CalendarState = {
  view: CalendarView
  date: string
  from: string
  to: string
}

export type NewEventDraft = {
  title?: string
  startDate?: string
  start?: string
  endDate?: string
  end?: string
  allDay?: boolean
  location?: string
  description?: string
}

export type CalendarController = {
  getState: () => CalendarState
  goToDate: (date: string) => void
  setView: (view: CalendarView) => boolean
  next: () => void
  previous: () => void
  today: () => void
  openEvent: (eventId: string, date: string) => void
  createEvent: (draft?: NewEventDraft) => boolean
  refresh: () => void
}

type ControllerSource = () => CalendarController

type ViewListener = (state: CalendarState) => void

const isSameState = (a: CalendarState | null, b: CalendarState) =>
  a !== null && a.view === b.view && a.date === b.date && a.from === b.from && a.to === b.to

export class HostBridge {
  #source: ControllerSource | null = null
  #listener: ViewListener | null = null
  #reported: CalendarState | null = null

  get controller() {
    return this.#source?.() ?? null
  }

  attach(source: ControllerSource) {
    this.#source = source
    return () => {
      if (this.#source === source) this.#source = null
    }
  }

  listen(listener: ViewListener | null) {
    this.#listener = listener
  }

  report(state: CalendarState) {
    if (isSameState(this.#reported, state)) return
    this.#reported = state
    this.#listener?.(state)
  }
}
