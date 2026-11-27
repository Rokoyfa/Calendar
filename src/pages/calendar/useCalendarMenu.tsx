import { BookingIcon, SettingsIcon, ShareIcon, SwapIcon, TeamIcon, TrashIcon } from '../../components/Icons.tsx'
import { calendarSettingsPath, ROUTES } from '../../config/routes.ts'
import type { CalendarMenuItem } from '../../features/calendar/index.ts'
import { useCalendarSettingsTabs, type CalendarSummary } from '../../features/calendars/index.ts'
import { useI18n } from '../../i18n/index.ts'
import { compact } from '../../utils/list.ts'

type CalendarMenuOptions = {
  activeCalendar: CalendarSummary
  isPeer: boolean
  canOpenSettings: boolean
  hasAccountMenu: boolean
}

export function useCalendarMenu({ activeCalendar, isPeer, canOpenSettings, hasAccountMenu }: CalendarMenuOptions) {
  const { m } = useI18n()
  const settingsTabs = useCalendarSettingsTabs(activeCalendar)
  if (!canOpenSettings) return []
  const settings: CalendarMenuItem | false = !hasAccountMenu && {
    key: 'settings',
    label: m.common.settings,
    icon: <SettingsIcon size={18} />,
    to: ROUTES.settings,
  }
  if (isPeer) return compact<CalendarMenuItem>([settings])
  const path = calendarSettingsPath(activeCalendar.id)
  const tab = (name: string) => `${path}?tab=${name}`
  const { tabs } = m.calendars.settings
  const group = m.calendar.menu.calendarGroup(activeCalendar.name)
  return compact<CalendarMenuItem>([
    settings,
    {
      key: 'calendarSettings',
      group,
      label: m.calendar.menu.calendarSettings,
      icon: <SettingsIcon size={18} />,
      to: path,
    },
    settingsTabs.members && {
      key: 'members',
      group,
      label: tabs.members,
      icon: <TeamIcon size={18} />,
      to: tab('members'),
    },
    settingsTabs.sharing && {
      key: 'sharing',
      group,
      label: tabs.sharing,
      icon: <ShareIcon size={18} />,
      to: tab('sharing'),
    },
    settingsTabs.booking && {
      key: 'booking',
      group,
      label: tabs.booking,
      icon: <BookingIcon size={18} />,
      to: tab('booking'),
    },
    settingsTabs.exchange && {
      key: 'exchange',
      group,
      label: tabs.exchange,
      icon: <SwapIcon size={18} />,
      to: tab('exchange'),
    },
    settingsTabs.trash && { key: 'trash', group, label: tabs.trash, icon: <TrashIcon size={18} />, to: tab('trash') },
  ])
}
