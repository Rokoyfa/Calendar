import { PERSONAL_CALENDAR } from '../constants/calendars.ts'
import type { CalendarRepository } from '../types/calendar.ts'

const ACCOUNT_REQUIRED = 'Team-Kalender gibt es nur mit Konto.'

const requireAccount = async (): Promise<never> => {
  throw new Error(ACCOUNT_REQUIRED)
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
}
