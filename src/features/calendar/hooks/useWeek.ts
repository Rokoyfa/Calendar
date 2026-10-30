import { useCallback, useMemo, useState } from 'react'
import { addDays, DAYS_PER_WEEK, getIsoWeek, getWeekDays, startOfWeek, toISODate } from '../../../utils/date.ts'

export function useWeek(initialDate = new Date()) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDate))

  const days = useMemo(() => getWeekDays(weekStart), [weekStart])
  const weekNumber = useMemo(() => getIsoWeek(weekStart), [weekStart])
  const range = useMemo(
    () => ({ from: toISODate(weekStart), to: toISODate(addDays(weekStart, DAYS_PER_WEEK - 1)) }),
    [weekStart],
  )

  const nextWeek = useCallback(() => setWeekStart((start) => addDays(start, DAYS_PER_WEEK)), [])
  const previousWeek = useCallback(() => setWeekStart((start) => addDays(start, -DAYS_PER_WEEK)), [])
  const currentWeek = useCallback(() => setWeekStart(startOfWeek(new Date())), [])
  const goToDate = useCallback((date: Date) => {
    const target = startOfWeek(date)
    setWeekStart((start) => (start.getTime() === target.getTime() ? start : target))
  }, [])

  return { weekStart, days, weekNumber, range, nextWeek, previousWeek, currentWeek, goToDate }
}
