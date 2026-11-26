import { useSyncExternalStore } from 'react'
import { Button } from '../../../components/Button.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { isAppleMobile, isStandalone } from '../../push/utils/device.ts'
import { getInstallState, promptInstall, subscribeInstallState } from '../utils/installPrompt.ts'

export function AppInstallSettings() {
  const { m } = useI18n()
  const text = m.settings.app
  const { enabled, prompt, installed } = useSyncExternalStore(subscribeInstallState, getInstallState, getInstallState)
  const standalone = isStandalone()

  const content = standalone ? (
    <p className="formHint">{text.running}</p>
  ) : installed ? (
    <p className="formHint">{text.installed}</p>
  ) : prompt ? (
    <Button variant="outline" onClick={() => void promptInstall()}>
      {text.install}
    </Button>
  ) : isAppleMobile() ? (
    <p className="formHint">{text.appleHint}</p>
  ) : null

  if (!enabled || !content) return null
  return (
    <PageSection title={text.title} description={text.description}>
      {content}
    </PageSection>
  )
}
