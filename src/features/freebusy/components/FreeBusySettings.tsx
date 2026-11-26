import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { usePreferences } from '../../preferences/index.ts'

export function FreeBusySettings() {
  const { m } = useI18n()
  const text = m.settings.freeBusy
  const { preferences, updatePreferences } = usePreferences()
  const { run, isPending, error } = useAsyncAction(updatePreferences)

  return (
    <PageSection title={text.title} description={text.description}>
      <Switch
        label={text.share}
        checked={preferences.shareFreeBusy}
        disabled={isPending}
        onChange={(shareFreeBusy) => void run({ shareFreeBusy })}
      />
      <ErrorMessage message={error} />
    </PageSection>
  )
}
