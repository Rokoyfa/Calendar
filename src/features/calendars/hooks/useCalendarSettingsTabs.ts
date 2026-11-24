import { useFeatures } from '../../../context/HostContext.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage } from '../../storage/index.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { canUseTrash, hasPermission, isPersonalCalendar } from '../utils/permissions.ts'

export type CalendarSettingsTabs = {
  members: boolean
  invitations: boolean
  sharing: boolean
  booking: boolean
  exchange: boolean
  trash: boolean
}

export function useCalendarSettingsTabs(calendar: CalendarSummary): CalendarSettingsTabs {
  const { subscriptions, importExport, trash, bookingPages, personalSharing: sharingFeature } = useFeatures()
  const { bookings, personalSharing, mode } = useStorage()
  const { user } = useAuth()
  const isPersonal = isPersonalCalendar(calendar)
  const isRemote = mode === 'remote'

  return {
    members: !isPersonal,
    invitations: !isPersonal && hasPermission(calendar, 'invite_members'),
    sharing: isPersonal && sharingFeature && Boolean(personalSharing) && isRemote && user !== null,
    booking: bookingPages && Boolean(bookings) && isRemote && hasPermission(calendar, 'manage_calendars'),
    exchange: subscriptions || importExport,
    trash: trash && canUseTrash(calendar),
  }
}
