import { useCallback, useMemo, useState } from 'react'
import { listISODates, toISODate } from '../../../utils/date.ts'
import { VIEW_DEFINITIONS } from '../constants/views.ts'
import type { CalendarView } from '../types/view.ts'

const today = () => toISODate(new Date())

export function useCalendarView(initialView: CalendarView = 'week', initialDate = today()) {
  const [view, setView] = useState(initialView)
  const [anchor, setAnchor] = useState(initialDate)
  const definition = VIEW_DEFINITIONS[view]

  const { from, to } = definition.getRange(anchor)
  const range = useMemo(() => ({ from, to }), [from, to])
  const dates = useMemo(() => listISODates(from, to), [from, to])

  const previous = useCallback(() => setAnchor((current) => VIEW_DEFINITIONS[view].step(current, -1)), [view])
  const next = useCallback(() => setAnchor((current) => VIEW_DEFINITIONS[view].step(current, 1)), [view])
  const goToToday = useCallback(() => setAnchor(today()), [])
  const goToDate = useCallback((date: string) => setAnchor(date), [])
  const show = useCallback((nextView: CalendarView, date: string) => {
    setView(nextView)
    setAnchor(date)
  }, [])

  return {
    view,
    setView,
    anchor,
    range,
    dates,
    definition,
    title: definition.getTitle(anchor),
    subtitle: definition.getSubtitle?.(anchor),
    previous,
    next,
    goToToday,
    goToDate,
    show,
  }
}
