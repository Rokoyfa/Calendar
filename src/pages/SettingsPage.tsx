import { PageLayout } from '../components/PageLayout.tsx'
import { Tabs, type TabDefinition } from '../components/Tabs.tsx'
import { useTabParam } from '../hooks/useTabParam.ts'
import { AccountSettings, DataExportSection, SecuritySettings, useAuth } from '../features/authorization/index.ts'
import { CalendarSettings, InvitationList, useCalendars } from '../features/calendars/index.ts'
import { useFeatures } from '../context/HostContext.ts'
import { CustomColorSettings } from '../features/events/index.ts'
import { NotificationSettings, PreferencesSettings } from '../features/preferences/index.ts'
import { HolidaySettings } from '../features/holidays/index.ts'
import { TaskPlanningSettings } from '../features/tasks/index.ts'
import { ExternalCalendarSettings, useExternalCalendars } from '../features/external/index.ts'
import {
  CaldavAccountSettings,
  CaldavServerSettings,
  useCaldav,
  useIsCaldavServerAvailable,
} from '../features/caldav/index.ts'
import { PeerCalendarSettings, PeerInvitationList, usePeerCalendars } from '../features/peers/index.ts'
import { FreeBusySettings, useFreeBusyRepository } from '../features/freebusy/index.ts'
import { PushSettings } from '../features/push/index.ts'
import { AppInstallSettings } from '../features/pwa/index.ts'
import { useStorage } from '../features/storage/index.ts'
import { useI18n } from '../i18n/index.ts'
import { compact } from '../utils/list.ts'

type SettingsTab =
  | 'calendars'
  | 'connections'
  | 'invitations'
  | 'appearance'
  | 'planning'
  | 'notifications'
  | 'account'
  | 'security'
  | 'data'

export function SettingsPage() {
  const { m } = useI18n()
  const { enabled, method, user } = useAuth()
  const { teams, holidays, customColors, emailNotifications, dataExport, tasks } = useFeatures()
  const { exportData, security } = useAuth()
  const { invitations } = useCalendars()
  const external = useExternalCalendars()
  const caldavAccounts = useCaldav()
  const caldavServer = useIsCaldavServerAvailable()
  const peers = usePeerCalendars()
  const freeBusy = useFreeBusyRepository()
  const hasPush = useStorage().push !== undefined
  const tabs = compact<TabDefinition<SettingsTab>>([
    {
      value: 'calendars',
      label: m.settings.tabs.calendars,
      content: <CalendarSettings />,
    },
    (external.isAvailable || caldavAccounts.isAvailable || caldavServer || peers.isAvailable || freeBusy) && {
      value: 'connections',
      label: m.settings.tabs.connections,
      content: (
        <>
          <PeerCalendarSettings />
          {freeBusy && <FreeBusySettings />}
          <ExternalCalendarSettings />
          <CaldavAccountSettings />
          <CaldavServerSettings />
        </>
      ),
    },
    (teams || peers.isAvailable) &&
      user?.emailVerified && {
        value: 'invitations',
        label: m.calendars.settings.withCount(
          m.settings.tabs.invitations,
          (teams ? invitations.length : 0) + peers.invitations.length,
        ),
        content: (
          <>
            <PeerInvitationList hideWhenEmpty={teams} />
            {teams && <InvitationList />}
          </>
        ),
      },
    {
      value: 'appearance',
      label: m.settings.tabs.appearance,
      content: (
        <>
          <PreferencesSettings />
          {holidays && <HolidaySettings />}
          {customColors && <CustomColorSettings />}
          <AppInstallSettings />
        </>
      ),
    },
    tasks && {
      value: 'planning',
      label: m.settings.tabs.planning,
      content: <TaskPlanningSettings />,
    },
    (emailNotifications || hasPush) &&
      enabled &&
      user && {
        value: 'notifications',
        label: m.settings.tabs.notifications,
        content: (
          <>
            {emailNotifications && <NotificationSettings emailVerified={user.emailVerified} />}
            <PushSettings />
          </>
        ),
      },
    enabled &&
      user &&
      method === 'password' && {
        value: 'account',
        label: m.settings.tabs.account,
        content: <AccountSettings />,
      },
    enabled &&
      user &&
      method === 'password' &&
      security && {
        value: 'security',
        label: m.settings.tabs.security,
        content: <SecuritySettings />,
      },
    dataExport &&
      (!user || exportData) && {
        value: 'data',
        label: m.settings.tabs.data,
        content: <DataExportSection />,
      },
  ])
  const [active, select] = useTabParam(tabs)

  return (
    <PageLayout title={m.common.settings} variant="full">
      <Tabs label={m.settings.tabsLabel} tabs={tabs} value={active} onChange={select} />
    </PageLayout>
  )
}
