import { useCallback } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { CalendarSummary, Invitation, TeamInvitation, TeamMember, TeamRole } from '../types/calendar.ts'
import { hasPermission, isPersonalCalendar } from '../utils/permissions.ts'
import { useCalendars } from './useCalendars.ts'

const NO_MEMBERS: TeamMember[] = []
const NO_INVITATIONS: TeamInvitation[] = []

export function useTeam(calendar: CalendarSummary) {
  const { repository } = useCalendars()
  const { teamId } = calendar
  const isTeam = !isPersonalCalendar(calendar)
  const canSeeInvitations = isTeam && hasPermission(calendar, 'invite_members')

  const loadMembers = useCallback(
    async () => (isTeam ? repository.listMembers(teamId) : NO_MEMBERS),
    [isTeam, repository, teamId],
  )
  const loadInvitations = useCallback(
    async () => (canSeeInvitations ? repository.listTeamInvitations(teamId) : NO_INVITATIONS),
    [canSeeInvitations, repository, teamId],
  )
  const members = useAsyncResource(loadMembers, NO_MEMBERS)
  const invitations = useAsyncResource(loadInvitations, NO_INVITATIONS)
  const { update: updateMembers } = members
  const { update: updateInvitations } = invitations

  const changeRole = useCallback(
    async (userId: string, role: TeamRole) => {
      const changed = await repository.changeMemberRole(teamId, userId, role)
      updateMembers((current) => current.map((member) => (member.userId === userId ? changed : member)))
    },
    [repository, teamId, updateMembers],
  )

  const removeMember = useCallback(
    async (userId: string) => {
      await repository.removeMember(teamId, userId)
      updateMembers((current) => current.filter((member) => member.userId !== userId))
    },
    [repository, teamId, updateMembers],
  )

  const invite = useCallback(
    async (invitation: Invitation) => {
      const created = await repository.invite(teamId, invitation)
      updateInvitations((current) => [...current, created])
    },
    [repository, teamId, updateInvitations],
  )

  const revokeInvitation = useCallback(
    async (invitationId: string) => {
      await repository.revokeInvitation(teamId, invitationId)
      updateInvitations((current) => current.filter((invitation) => invitation.id !== invitationId))
    },
    [repository, teamId, updateInvitations],
  )

  return {
    members: members.data,
    membersError: members.error,
    invitations: invitations.data,
    invitationsError: invitations.error,
    changeRole,
    removeMember,
    invite,
    revokeInvitation,
  }
}
