import { useMemo } from 'react'
import type { CalendarEvent } from '../../domain/event.ts'
import { useAuth } from '../../features/authorization/index.ts'
import {
  canDeleteEntry,
  canEditEntry,
  hasPermission,
  isPersonalCalendar,
  useCalendars,
  type CalendarSummary,
} from '../../features/calendars/index.ts'
import type { TaskAccess, TaskCalendarChoice, TaskPlanningSetup, TaskSetup } from '../../features/tasks/index.ts'
import { useHost } from '../../context/HostContext.ts'

type TaskSetupOptions = {
  calendarById: ReadonlyMap<string, CalendarSummary>
  choices: readonly TaskCalendarChoice[]
  calendarNames: ReadonlyMap<string, string>
  busyCalendarIds: readonly string[]
  externalEvents: readonly CalendarEvent[]
  openTaskId: string | null
  openTaskPlan: boolean
  onOpenTaskDone: () => void
}

export function useTaskSetup({
  calendarById,
  choices,
  calendarNames,
  busyCalendarIds,
  externalEvents,
  openTaskId,
  openTaskPlan,
  onOpenTaskDone,
}: TaskSetupOptions) {
  const { features } = useHost()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { calendars, activeCalendar, visibleCalendarIds, repository } = useCalendars()

  const access = useMemo<TaskAccess>(() => {
    const check = (calendarId: string, allowed: (calendar: CalendarSummary) => boolean) => {
      const calendar = calendarById.get(calendarId)
      return calendar !== undefined && allowed(calendar)
    }
    const canEdit: TaskAccess['canEdit'] = (task) =>
      check(task.calendarId, (calendar) => canEditEntry(calendar, task.createdBy, userId))
    return {
      canCreateIn: (calendarId) => check(calendarId, (calendar) => hasPermission(calendar, 'create_entry')),
      canEdit,
      canProgress: (task) =>
        canEdit(task) || (userId !== null && task.assignee?.id === userId && calendarById.has(task.calendarId)),
      canDelete: (task) => check(task.calendarId, (calendar) => canDeleteEntry(calendar, task.createdBy, userId)),
    }
  }, [calendarById, userId])
  const loadAssignees = useMemo(() => {
    if (!user || !features.teams) return undefined
    return async (calendarId: string) => {
      const calendar = calendarById.get(calendarId)
      if (!calendar || isPersonalCalendar(calendar)) return []
      const members = await repository.listMembers(calendar.teamId)
      return members.map(({ userId: id, name }) => ({ id, name }))
    }
  }, [user, features.teams, calendarById, repository])
  const personalCalendarId = calendars.find(isPersonalCalendar)?.id ?? null
  const planning = useMemo<TaskPlanningSetup | undefined>(
    () =>
      personalCalendarId === null
        ? undefined
        : {
            calendarId: personalCalendarId,
            busyCalendarIds: [...calendars.map(({ id }) => id), ...busyCalendarIds],
            externalEvents,
          },
    [personalCalendarId, calendars, busyCalendarIds, externalEvents],
  )
  return useMemo<TaskSetup>(
    () => ({
      calendarIds: visibleCalendarIds,
      targetCalendarId: activeCalendar.id,
      choices,
      calendarNames,
      access,
      loadAssignees,
      openTaskId,
      openTaskPlan,
      onOpenTaskDone,
      planning,
    }),
    [
      visibleCalendarIds,
      activeCalendar.id,
      choices,
      calendarNames,
      access,
      loadAssignees,
      openTaskId,
      openTaskPlan,
      onOpenTaskDone,
      planning,
    ],
  )
}
