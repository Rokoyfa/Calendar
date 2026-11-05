import { PageLayout } from '../components/PageLayout.tsx'
import { Tabs, type TabDefinition } from '../components/Tabs.tsx'
import { useTabParam } from '../hooks/useTabParam.ts'
import { AccountSettings, useAuth } from '../features/authorization/index.ts'
import { CalendarSettings } from '../features/calendars/index.ts'
import { CustomColorSettings } from '../features/events/index.ts'
import { PreferencesSettings } from '../features/preferences/index.ts'

type SettingsTab = 'calendars' | 'appearance' | 'account'

const BASE_TABS: readonly TabDefinition<SettingsTab>[] = [
  { value: 'calendars', label: 'Kalender', content: <CalendarSettings /> },
  {
    value: 'appearance',
    label: 'Darstellung',
    content: (
      <>
        <PreferencesSettings />
        <CustomColorSettings />
      </>
    ),
  },
]

const ACCOUNT_TAB: TabDefinition<SettingsTab> = { value: 'account', label: 'Konto', content: <AccountSettings /> }

export function SettingsPage() {
  const { enabled, user } = useAuth()
  const tabs = enabled && user ? [...BASE_TABS, ACCOUNT_TAB] : BASE_TABS
  const [active, select] = useTabParam(tabs)

  return (
    <PageLayout title="Einstellungen" variant="full">
      <Tabs label="Bereiche der Einstellungen" tabs={tabs} value={active} onChange={select} />
    </PageLayout>
  )
}
