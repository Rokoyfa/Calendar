import { useCallback, useMemo } from 'react'
import type { CalendarEvent } from '../../../domain/event.ts'
import { findOverlaps, overlapRange, type OverlapQuery } from '../../../domain/overlap.ts'
import { toInstant } from '../../../utils/timeZone.ts'
import type { PlanConflict } from '../../events/index.ts'
import { isPeerCalendarId } from '../../peers/index.ts'
import type { EventRepository } from '../../storage/index.ts'
import type { TaskPlanningSetup } from '../../tasks/index.ts'

type OverlapCheckOptions = {
  eventRepository: EventRepository
  calendarIds: readonly string[]
  editorCalendarId: string | null
  externalEvents: readonly CalendarEvent[]
  viewerTimeZone: string
  currentUserEmail: string | null
  planning: TaskPlanningSetup | undefined
}

export function useOverlapChecks({
  eventRepository,
  calendarIds,
  editorCalendarId,
  externalEvents,
  viewerTimeZone,
  currentUserEmail,
  planning,
}: OverlapCheckOptions) {
  const overlapCalendarId = editorCalendarId && isPeerCalendarId(editorCalendarId) ? editorCalendarId : null
  const checkOverlaps = useCallback(
    async (query: OverlapQuery) => {
      const { from, to } = overlapRange(query)
      if (overlapCalendarId) {
        const busy = await eventRepository.list({ from, to, calendarIds: [overlapCalendarId] })
        return findOverlaps(query, busy, viewerTimeZone, currentUserEmail)
      }
      const own = calendarIds.filter((id) => !isPeerCalendarId(id))
      const found = await eventRepository.list({ from, to, calendarIds: own })
      return findOverlaps(query, [...found, ...externalEvents], viewerTimeZone, currentUserEmail)
    },
    [eventRepository, calendarIds, overlapCalendarId, externalEvents, viewerTimeZone, currentUserEmail],
  )
  const planCalendarIds = useMemo(
    () => (planning ? new Set([planning.calendarId, ...planning.busyCalendarIds]) : null),
    [planning],
  )
  const checkPlanConflicts = useCallback(
    async (query: OverlapQuery) => {
      if (!planning) return []
      const { from, to } = overlapRange(query)
      const found = await eventRepository.list({ from, to, calendarIds: [planning.calendarId] })
      const current = Date.now()
      const conflicts = new Map<string, PlanConflict>()
      for (const block of findOverlaps(
        query,
        found.filter((event) => event.taskId),
        viewerTimeZone,
        currentUserEmail,
      ))
        if (block.taskId && toInstant({ date: block.startDate, time: block.start }, viewerTimeZone) > current)
          conflicts.set(block.taskId, { taskId: block.taskId, title: block.title })
      return [...conflicts.values()]
    },
    [planning, eventRepository, viewerTimeZone, currentUserEmail],
  )
  return { checkOverlaps, checkPlanConflicts, planCalendarIds }
}
