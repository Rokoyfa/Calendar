import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import type { Preferences } from '../../../domain/preferences.ts'
import { usePreferences } from '../hooks/usePreferences.ts'

type EmailSetting = keyof Pick<
  Preferences,
  'emailInvites' | 'emailChanges' | 'emailReminders' | 'emailChat' | 'emailTaskDue'
>

const EMAIL_SETTINGS: readonly EmailSetting[] = ['emailInvites', 'emailChanges', 'emailReminders', 'emailChat']

export function NotificationSettings({ emailVerified }: { emailVerified: boolean }) {
  const { m } = useI18n()
  const { notifications } = m.settings
  const { preferences, updatePreferences } = usePreferences()
  const { run, isPending, error } = useAsyncAction(updatePreferences)
  const { tasks } = useFeatures()
  const settings: readonly EmailSetting[] = tasks ? [...EMAIL_SETTINGS, 'emailTaskDue'] : EMAIL_SETTINGS

  return (
    <PageSection title={notifications.title} description={notifications.description}>
      {!emailVerified && <p className="formHint">{notifications.unverified}</p>}
      {settings.map((setting) => (
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
