import { useCallback, useMemo } from 'react'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isWorkCategorized, WORK_CATEGORY } from '../../../utils/category.ts'
import { addDaysToISODate, listISODates, minISODate, timeToMinutes } from '../../../utils/date.ts'
import { createEventInputForSlots, expandEvents, type EventInput, type EventOccurrence } from '../../../utils/event.ts'
import { isCaldavEvent } from '../../../utils/caldav.ts'
import { isExternalEvent } from '../../../utils/externalCalendar.ts'
import { isPeerEvent } from '../../../utils/peerCalendar.ts'
import type { PlanningDistribution } from '../../../utils/preferences.ts'
import { fromInstant } from '../../../utils/timeZone.ts'
import { listHolidays, useHolidayRegion } from '../../holidays/index.ts'
import { usePreferences } from '../../preferences/index.ts'
import { useStorage } from '../../storage/index.ts'
import type { Task, TaskPlanningSetup } from '../types/task.ts'
import {
  NO_DEADLINE_DAYS,
  planTask,
  toPlanMinute,
  type PlanInterval,
  type PlannedBlock,
  type PlanRequest,
} from '../utils/taskPlanner.ts'
import { getWorkingTimeLaw } from '../utils/workingTimeLaw.ts'
import { usePlanningCountry } from './usePlanningCountryName.ts'

export type TaskPlanContext = {
  request: Omit<PlanRequest, 'distribution'>
  effortMinutes: number
  doneMinutes: number
  replacedBlocks: readonly EventOccurrence[]
  isCapped: boolean
}

const isOwnEvent = (event: EventOccurrence) => !isExternalEvent(event) && !isCaldavEvent(event) && !isPeerEvent(event)

const countsAsWork = (event: EventOccurrence) =>
  isOwnEvent(event) && (isWorkCategorized(event.builtinCategories) || Boolean(event.taskId))

const toInterval = (event: EventOccurrence): PlanInterval => ({
  start: toPlanMinute(event.startDate, event.start),
  end: toPlanMinute(event.endDate, event.end),
})

const blockInput = (task: Task, block: PlannedBlock, timeZone: string): EventInput => ({
  ...createEventInputForSlots({ date: block.date, hour: 0 }, { date: block.date, hour: 0 }, timeZone),
  title: task.title,
  start: block.start,
  endDate: block.date,
  end: block.end,
  visibility: 'private',
  builtinCategories: task.builtinCategories.length > 0 ? task.builtinCategories : [WORK_CATEGORY],
  taskId: task.id,
})

export function useTaskPlanner(setup: TaskPlanningSetup) {
  const { events: repository, holidays: holidayRepository, invalidate } = useStorage()
  const { preferences } = usePreferences()
  const region = useHolidayRegion()
  const { language } = useI18n()
  const timeZone = useViewerTimeZone()
  const { calendarId, busyCalendarIds, externalEvents } = setup

  const country = usePlanningCountry()

  const load = useCallback(
    async (task: Task): Promise<TaskPlanContext> => {
      const now = fromInstant(Date.now(), timeZone)
      const from = toPlanMinute(now.date, now.time)
      const horizon = addDaysToISODate(now.date, NO_DEADLINE_DAYS - 1)
      const dueDate = task.dueDate === null ? null : minISODate(task.dueDate, horizon)
      const isCapped = task.dueDate !== null && task.dueDate > horizon
      const dueTime = task.dueDate !== null && !isCapped && task.dueTime ? task.dueTime : preferences.planningDayEnd
      const rangeFrom = addDaysToISODate(now.date, -1)
      const rangeTo = addDaysToISODate(horizon, 1)
      const calendarIds = [...new Set([calendarId, ...busyCalendarIds])]
      const blockFrom = minISODate(rangeFrom, addDaysToISODate(task.createdAt.slice(0, 10), -1))
      const [listed, ownBlocks, holidays] = await Promise.all([
        repository.list({ from: rangeFrom, to: rangeTo, calendarIds }),
        repository.list({ from: blockFrom, to: rangeTo, calendarIds: [calendarId] }),
        region ? listHolidays(holidayRepository, { from: now.date, to: horizon, region, language }) : [],
      ])
      const occurrences = expandEvents([...listed, ...externalEvents], rangeFrom, rangeTo, timeZone)
      const taskBlocks = expandEvents(
        ownBlocks.filter((event) => event.taskId === task.id),
        blockFrom,
        rangeTo,
        timeZone,
      )
      const started = taskBlocks.filter((block) => toInterval(block).start <= from)
      const replacedBlocks = taskBlocks.filter((block) => toInterval(block).start > from)
      const replaced = new Set(replacedBlocks.map((block) => block.id))
      const doneMinutes = started.reduce((sum, block) => {
        const { start, end } = toInterval(block)
        return sum + Math.max(0, end - start)
      }, 0)
      const busy: PlanInterval[] = []
      const work: PlanInterval[] = []
      const blockedDates = new Set(holidays.map((holiday) => holiday.date))
      for (const occurrence of occurrences) {
        if (replaced.has(occurrence.id)) continue
        if (occurrence.allDay) {
          if (isOwnEvent(occurrence) && (occurrence.builtinCategories?.length ?? 0) > 0)
            for (const date of listISODates(occurrence.startDate, occurrence.endDate)) blockedDates.add(date)
          continue
        }
        ;(countsAsWork(occurrence) ? work : busy).push(toInterval(occurrence))
      }
      const effortMinutes = task.estimateMinutes ?? 0
      return {
        request: {
          effortMinutes: Math.max(0, effortMinutes - doneMinutes),
          from,
          deadline: dueDate === null ? null : toPlanMinute(dueDate, dueTime),
          busy,
          work,
          blockedDates,
          law: getWorkingTimeLaw(country),
          windowStart: timeToMinutes(preferences.planningDayStart),
          windowEnd: timeToMinutes(preferences.planningDayEnd),
        },
        effortMinutes,
        doneMinutes,
        replacedBlocks,
        isCapped,
      }
    },
    [
      timeZone,
      preferences.planningDayStart,
      preferences.planningDayEnd,
      calendarId,
      busyCalendarIds,
      repository,
      region,
      holidayRepository,
      language,
      externalEvents,
      country,
    ],
  )

  const plan = useCallback(
    (context: TaskPlanContext, distribution: PlanningDistribution) => planTask({ ...context.request, distribution }),
    [],
  )

  const apply = useCallback(
    async (task: Task, context: TaskPlanContext, blocks: readonly PlannedBlock[]) => {
      try {
        for (const block of context.replacedBlocks) await repository.remove(block.id, block.version)
        for (const block of blocks) await repository.create(calendarId, blockInput(task, block, timeZone))
      } finally {
        invalidate()
      }
    },
    [repository, calendarId, timeZone, invalidate],
  )

  return useMemo(
    () => ({ load, plan, apply, country, distribution: preferences.planningDistribution }),
    [load, plan, apply, country, preferences.planningDistribution],
  )
}
