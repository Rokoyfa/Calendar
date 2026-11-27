import { useMemo } from 'react'
import type { CalendarController, CalendarState } from '../../../context/HostBridge.ts'
import { createAllDayEventInput, createEventInput } from '../../../domain/event.ts'
import { isISODate, isTime } from '../../../utils/date.ts'
import type { CalendarView } from '../types/view.ts'
import type { useEventEditor } from './useEventEditor.ts'
import { useHostController } from './useHostController.ts'

type CalendarControllerOptions = {
  view: CalendarView
  views: readonly CalendarView[]
  anchor: string
  dates: readonly string[]
  today: string
  now: Date
  viewerTimeZone: string
  canCreate: boolean
  editor: ReturnType<typeof useEventEditor>
  setView: (view: CalendarView) => void
  goToDate: (date: string) => void
  next: () => void
  previous: () => void
  goToToday: () => void
  refresh: () => void
}

export function useCalendarController({
  view,
  views,
  anchor,
  dates,
  today,
  now,
  viewerTimeZone,
  canCreate,
  editor,
  setView,
  goToDate,
  next,
  previous,
  goToToday,
  refresh,
}: CalendarControllerOptions) {
  const state = useMemo<CalendarState>(
    () => ({ view, date: anchor, from: dates[0], to: dates[dates.length - 1] }),
    [view, anchor, dates],
  )
  const controller: CalendarController = {
    getState: () => state,
    goToDate,
    setView: (wanted) => {
      if (!views.includes(wanted)) return false
      setView(wanted)
      return true
    },
    next,
    previous,
    today: goToToday,
    openEvent: (eventId, date) => {
      goToDate(date)
      editor.openFromHost(eventId, date)
    },
    createEvent: (draft = {}) => {
      if (!canCreate) return false
      const startDate = isISODate(draft.startDate) ? draft.startDate : view === 'day' ? anchor : today
      const base = draft.allDay
        ? createAllDayEventInput(
            startDate,
            isISODate(draft.endDate) && draft.endDate >= startDate ? draft.endDate : startDate,
          )
        : createEventInput(startDate, now.getHours(), viewerTimeZone)
      const times =
        !draft.allDay && isTime(draft.start) && isTime(draft.end)
          ? { start: draft.start, end: draft.end, endDate: isISODate(draft.endDate) ? draft.endDate : startDate }
          : {}
      editor.openDraft({
        ...base,
        ...times,
        title: draft.title ?? '',
        location: draft.location ?? '',
        description: draft.description ?? '',
      })
      return true
    },
    refresh,
  }
  useHostController(controller, state)
}
