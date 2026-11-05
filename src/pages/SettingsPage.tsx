import { PageLayout } from '../components/PageLayout.tsx'
import { AccountSettings } from '../features/authorization/index.ts'
import { CustomColorSettings } from '../features/events/index.ts'
import { PreferencesSettings } from '../features/preferences/index.ts'

export function SettingsPage() {
  return (
    <PageLayout title="Einstellungen" variant="full">
      <PreferencesSettings />
      <CustomColorSettings />
      <AccountSettings />
    </PageLayout>
  )
}
