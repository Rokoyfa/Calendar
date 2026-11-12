import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import type { Preferences } from '../../../utils/preferences.ts'
import { usePreferences } from '../hooks/usePreferences.ts'

type EmailSetting = keyof Pick<Preferences, 'emailInvites' | 'emailChanges' | 'emailReminders'>

const EMAIL_SETTINGS: readonly EmailSetting[] = ['emailInvites', 'emailChanges', 'emailReminders']

export function NotificationSettings({ emailVerified }: { emailVerified: boolean }) {
  const { m } = useI18n()
  const { notifications } = m.settings
  const { preferences, updatePreferences } = usePreferences()
  const { run, isPending, error } = useAsyncAction(updatePreferences)

  return (
    <PageSection title={notifications.title} description={notifications.description}>
      {!emailVerified && <p className="formHint">{notifications.unverified}</p>}
      {EMAIL_SETTINGS.map((setting) => (
        <Switch
          key={setting}
          label={notifications[setting]}
          checked={preferences[setting]}
          disabled={isPending}
          onChange={(checked) => void run({ [setting]: checked })}
        />
      ))}
      <ErrorMessage message={error} />
    </PageSection>
  )
}
