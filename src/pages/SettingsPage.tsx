import { PageLayout } from '../components/PageLayout.tsx'
import { Tabs, type TabDefinition } from '../components/Tabs.tsx'
import { useTabParam } from '../hooks/useTabParam.ts'
import { AccountSettings, useAuth } from '../features/authorization/index.ts'
import { CalendarSettings } from '../features/calendars/index.ts'
import { CustomColorSettings } from '../features/events/index.ts'
import { PreferencesSettings } from '../features/preferences/index.ts'
import { useI18n } from '../i18n/index.ts'

type SettingsTab = 'calendars' | 'appearance' | 'account'

export function SettingsPage() {
  const { m } = useI18n()
  const { enabled, method, user } = useAuth()
  const tabs: TabDefinition<SettingsTab>[] = [
    { value: 'calendars', label: m.settings.tabs.calendars, content: <CalendarSettings /> },
    {
      value: 'appearance',
      label: m.settings.tabs.appearance,
      content: (
        <>
          <PreferencesSettings />
          <CustomColorSettings />
        </>
      ),
    },
  ]
  if (enabled && user && method === 'password') tabs.push({ value: 'account', label: m.settings.tabs.account, content: <AccountSettings /> })
  const [active, select] = useTabParam(tabs)

  return (
    <PageLayout title={m.common.settings} variant="full">
      <Tabs label={m.settings.tabsLabel} tabs={tabs} value={active} onChange={select} />
    </PageLayout>
  )
}
