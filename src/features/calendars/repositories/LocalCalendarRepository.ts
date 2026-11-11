import { AppError } from '../../../utils/appError.ts'
import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import type { CalendarRepository } from '../types/calendar.ts'

const LOCAL_PERSONAL_CALENDAR = {
  ...PERSONAL_CALENDAR,
  permissions: PERSONAL_CALENDAR.permissions.filter((permission) => permission !== 'manage_calendars'),
}

const requireAccount = async (): Promise<never> => {
  throw new AppError('accountRequired')
}

export class LocalCalendarRepository implements CalendarRepository {
  async list() {
    return [LOCAL_PERSONAL_CALENDAR]
  }

  async listInvitations() {
    return []
  }

  create = requireAccount
  leave = requireAccount
  setShowInPersonal = requireAccount
  acceptInvitation = requireAccount
  declineInvitation = requireAccount
  updateCalendar = requireAccount
  updateTeam = requireAccount
  deleteTeam = requireAccount
  transferOwnership = requireAccount
  listMembers = requireAccount
  changeMemberRole = requireAccount
  removeMember = requireAccount
  listTeamInvitations = requireAccount
  invite = requireAccount
  revokeInvitation = requireAccount
}
