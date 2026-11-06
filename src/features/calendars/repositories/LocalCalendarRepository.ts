import { AppError } from '../../../utils/appError.ts'
import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import type { CalendarRepository } from '../types/calendar.ts'

const requireAccount = async (): Promise<never> => {
  throw new AppError('accountRequired')
}

export class LocalCalendarRepository implements CalendarRepository {
  async list() {
    return [PERSONAL_CALENDAR]
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
