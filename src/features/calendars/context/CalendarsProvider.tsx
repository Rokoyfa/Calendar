import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useI18n } from '../../../i18n/index.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { StorageConfig } from '../../storage/index.ts'
import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import { createCalendarRepository } from '../repositories/createCalendarRepository.ts'
import type {
  CalendarChanges,
  CalendarDraft,
  CalendarsContextValue,
  CalendarSummary,
  PendingInvitation,
  TeamChanges,
} from '../types/calendar.ts'
import { normalizeDraft } from '../utils/draft.ts'
import { getVisibleCalendarIds, isPersonalCalendar } from '../utils/permissions.ts'
import { CalendarsContext } from './CalendarsContext.ts'

const INITIAL_CALENDARS: CalendarSummary[] = [PERSONAL_CALENDAR]
const NO_INVITATIONS: PendingInvitation[] = []

type CalendarsProviderProps = {
  config: StorageConfig
  children: ReactNode
}

export function CalendarsProvider({ config, children }: CalendarsProviderProps) {
  const { m } = useI18n()
  const repository = useMemo(() => createCalendarRepository(config), [config])
  const loadCalendars = useCallback(() => repository.list(), [repository])
  const loadInvitations = useCallback(() => repository.listInvitations(), [repository])
  const {
    data: storedCalendars,
    error,
    isLoading,
    update: updateCalendars,
  } = useAsyncResource(loadCalendars, INITIAL_CALENDARS)
  const { data: invitations, update: updateInvitations } = useAsyncResource(loadInvitations, NO_INVITATIONS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const personalName = m.calendars.personalName
  const calendars = useMemo(
    () =>
      storedCalendars.map((calendar) =>
        isPersonalCalendar(calendar) ? { ...calendar, name: personalName } : calendar,
      ),
    [storedCalendars, personalName],
  )

  const personalCalendar = calendars.find(isPersonalCalendar) ?? { ...PERSONAL_CALENDAR, name: personalName }
  const activeCalendar = calendars.find((calendar) => calendar.id === activeId) ?? personalCalendar

  const selectCalendar = useCallback((id: string) => setActiveId(id), [])

  const replaceCalendar = useCallback(
    (changed: CalendarSummary) =>
      updateCalendars((current) => current.map((calendar) => (calendar.id === changed.id ? changed : calendar))),
    [updateCalendars],
  )

  const createCalendar = useCallback(
    async (draft: CalendarDraft) => {
      const calendar = await repository.create(normalizeDraft(draft))
      updateCalendars((current) => [...current, calendar])
      return calendar
    },
    [repository, updateCalendars],
  )

  const leaveCalendar = useCallback(
    async (id: string) => {
      const calendar = calendars.find((entry) => entry.id === id)
      if (!calendar || isPersonalCalendar(calendar)) return
      await repository.leave(calendar.teamId)
      updateCalendars((current) => current.filter((entry) => entry.teamId !== calendar.teamId))
    },
    [calendars, repository, updateCalendars],
  )

  const setShowInPersonal = useCallback(
    async (id: string, showInPersonal: boolean) => {
      replaceCalendar(await repository.setShowInPersonal(id, showInPersonal))
    },
    [repository, replaceCalendar],
  )

  const acceptInvitation = useCallback(
    async (id: string) => {
      const added = await repository.acceptInvitation(id)
      updateCalendars((current) => [
        ...current.filter((calendar) => !added.some(({ id }) => id === calendar.id)),
        ...added,
      ])
      updateInvitations((current) => current.filter((invitation) => invitation.id !== id))
    },
    [repository, updateCalendars, updateInvitations],
  )

  const declineInvitation = useCallback(
    async (id: string) => {
      await repository.declineInvitation(id)
      updateInvitations((current) => current.filter((invitation) => invitation.id !== id))
    },
    [repository, updateInvitations],
  )

  const updateCalendar = useCallback(
    async (calendar: CalendarSummary, changes: CalendarChanges) => {
      replaceCalendar(await repository.updateCalendar(calendar.id, changes))
    },
    [repository, replaceCalendar],
  )

  const replaceCalendars = useCallback(
    (changed: readonly CalendarSummary[]) =>
      updateCalendars((current) => current.map((entry) => changed.find(({ id }) => id === entry.id) ?? entry)),
    [updateCalendars],
  )

  const updateTeam = useCallback(
    async (calendar: CalendarSummary, changes: TeamChanges) => {
      replaceCalendars(await repository.updateTeam(calendar.teamId, changes))
    },
    [repository, replaceCalendars],
  )

  const transferOwnership = useCallback(
    async (calendar: CalendarSummary, userId: string) => {
      replaceCalendars(await repository.transferOwnership(calendar.teamId, userId))
    },
    [repository, replaceCalendars],
  )

  const deleteTeam = useCallback(
    async (calendar: CalendarSummary) => {
      await repository.deleteTeam(calendar.teamId)
      updateCalendars((current) => current.filter((entry) => entry.teamId !== calendar.teamId))
    },
    [repository, updateCalendars],
  )

  const visibleCalendarIds = useMemo(
    () => getVisibleCalendarIds(calendars, activeCalendar),
    [calendars, activeCalendar],
  )

  const value = useMemo<CalendarsContextValue>(
    () => ({
      repository,
      isLoading,
      calendars,
      invitations,
      error,
      activeCalendar,
      visibleCalendarIds,
      selectCalendar,
      createCalendar,
      leaveCalendar,
      setShowInPersonal,
      acceptInvitation,
      declineInvitation,
      updateCalendar,
      updateTeam,
      deleteTeam,
      transferOwnership,
    }),
    [
      repository,
      isLoading,
      calendars,
      invitations,
      error,
      activeCalendar,
      visibleCalendarIds,
      selectCalendar,
      createCalendar,
      leaveCalendar,
      setShowInPersonal,
      acceptInvitation,
      declineInvitation,
      updateCalendar,
      updateTeam,
      deleteTeam,
      transferOwnership,
    ],
  )

  return <CalendarsContext value={value}>{children}</CalendarsContext>
}
