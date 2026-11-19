import { PageLayout } from '../components/PageLayout.tsx'
import { Tabs, type TabDefinition } from '../components/Tabs.tsx'
import { useTabParam } from '../hooks/useTabParam.ts'
import { AccountSettings, DataExportSection, SecuritySettings, useAuth } from '../features/authorization/index.ts'
import { CalendarSettings, InvitationList, useCalendars } from '../features/calendars/index.ts'
import { useFeatures } from '../context/HostContext.ts'
import { CustomColorSettings } from '../features/events/index.ts'
import { NotificationSettings, PreferencesSettings } from '../features/preferences/index.ts'
import { HolidaySettings } from '../features/holidays/index.ts'
import { ExternalCalendarSettings, useExternalCalendars } from '../features/external/index.ts'
import {
  CaldavAccountSettings,
  CaldavServerSettings,
  useCaldav,
  useIsCaldavServerAvailable,
} from '../features/caldav/index.ts'
import { useI18n } from '../i18n/index.ts'

type SettingsTab =
  'calendars' | 'connections' | 'invitations' | 'appearance' | 'notifications' | 'account' | 'security' | 'data'

export function SettingsPage() {
  const { m } = useI18n()
  const { enabled, method, user } = useAuth()
  const { teams, holidays, customColors, emailNotifications, dataExport } = useFeatures()
  const { exportData, security } = useAuth()
  const { invitations } = useCalendars()
  const external = useExternalCalendars()
  const caldavAccounts = useCaldav()
  const caldavServer = useIsCaldavServerAvailable()
  const tabs: TabDefinition<SettingsTab>[] = [
    {
      value: 'calendars',
      label: m.settings.tabs.calendars,
      content: <CalendarSettings />,
    },
  ]
  if (external.isAvailable || caldavAccounts.isAvailable || caldavServer)
    tabs.push({
      value: 'connections',
      label: m.settings.tabs.connections,
      content: (
        <>
          <ExternalCalendarSettings />
          <CaldavAccountSettings />
          <CaldavServerSettings />
        </>
      ),
    })
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
        {holidays && <HolidaySettings />}
        {customColors && <CustomColorSettings />}
      </>
    ),
  })
  if (emailNotifications && enabled && user)
    tabs.push({
      value: 'notifications',
      label: m.settings.tabs.notifications,
      content: <NotificationSettings emailVerified={user.emailVerified} />,
    })
  if (enabled && user && method === 'password')
    tabs.push({
      value: 'account',
      label: m.settings.tabs.account,
      content: <AccountSettings />,
    })
  if (enabled && user && method === 'password' && security)
    tabs.push({
      value: 'security',
      label: m.settings.tabs.security,
      content: <SecuritySettings />,
    })
  if (dataExport && (!user || exportData))
    tabs.push({
      value: 'data',
      label: m.settings.tabs.data,
      content: <DataExportSection />,
    })
  const [active, select] = useTabParam(tabs)

  return (
    <PageLayout title={m.common.settings} variant="full">
      <Tabs label={m.settings.tabsLabel} tabs={tabs} value={active} onChange={select} />
    </PageLayout>
  )
}
