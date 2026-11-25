import { useCallback } from 'react'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { addDaysToISODate } from '../../../utils/date.ts'
import { fromInstant, toInstant } from '../../../utils/timeZone.ts'
import { useStorage } from '../../storage/index.ts'
import type { Task, TaskPlanningSetup } from '../types/task.ts'
import { NO_DEADLINE_DAYS } from '../utils/taskPlanner.ts'

export function useHasFutureBlocks(task: Task | null, setup: TaskPlanningSetup | undefined) {
  const { events: repository, version } = useStorage()
  const timeZone = useViewerTimeZone()
  const calendarId = setup?.calendarId ?? null
  const taskId = task?.id ?? null
  const createdAt = task?.createdAt ?? null

  const load = useCallback(async () => {
    if (!calendarId || !taskId || !createdAt) return false
    const current = Date.now()
    const today = fromInstant(current, timeZone).date
    const events = await repository.list({
      from: addDaysToISODate(createdAt.slice(0, 10), -1),
      to: addDaysToISODate(today, NO_DEADLINE_DAYS + 1),
      calendarIds: [calendarId],
    })
    return events.some(
      (event) =>
        event.taskId === taskId &&
        toInstant({ date: event.startDate, time: event.start }, event.timeZone ?? timeZone) > current,
    )
  }, [calendarId, taskId, createdAt, repository, timeZone])

  return useAsyncResource(load, false, version).data
}
