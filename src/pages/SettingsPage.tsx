import { PageLayout } from '../components/PageLayout.tsx'
import { Tabs, type TabDefinition } from '../components/Tabs.tsx'
import { useTabParam } from '../hooks/useTabParam.ts'
import { AccountSettings, useAuth } from '../features/authorization/index.ts'
import { CalendarSettings, InvitationList, useCalendars } from '../features/calendars/index.ts'
import { useHost } from '../context/HostContext.ts'
import { CustomColorSettings } from '../features/events/index.ts'
import { NotificationSettings, PreferencesSettings } from '../features/preferences/index.ts'
import { HolidaySettings } from '../features/holidays/index.ts'
import { useI18n } from '../i18n/index.ts'

type SettingsTab = 'calendars' | 'invitations' | 'appearance' | 'notifications' | 'account'

export function SettingsPage() {
  const { m } = useI18n()
  const { enabled, method, user } = useAuth()
  const { teams } = useHost()
  const { invitations } = useCalendars()
  const tabs: TabDefinition<SettingsTab>[] = [
    { value: 'calendars', label: m.settings.tabs.calendars, content: <CalendarSettings /> },
  ]
  if (teams && user?.emailVerified)
    tabs.push({
      value: 'invitations',
      label: m.calendars.settings.withCount(m.settings.tabs.invitations, invitations.length),
      content: <InvitationList />,
    })
  tabs.push({
    value: 'appearance',
    label: m.settings.tabs.appearance,
    content: (
      <>
        <PreferencesSettings />
        <HolidaySettings />
        <CustomColorSettings />
      </>
    ),
  })
  if (enabled && user)
    tabs.push({
      value: 'notifications',
      label: m.settings.tabs.notifications,
      content: <NotificationSettings emailVerified={user.emailVerified} />,
    })
  if (enabled && user && method === 'password')
    tabs.push({ value: 'account', label: m.settings.tabs.account, content: <AccountSettings /> })
  const [active, select] = useTabParam(tabs)

  return (
    <PageLayout title={m.common.settings} variant="full">
      <Tabs label={m.settings.tabsLabel} tabs={tabs} value={active} onChange={select} />
    </PageLayout>
  )
}
