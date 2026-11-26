import { useCallback, useEffect, useState } from 'react'
import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage } from '../../storage/index.ts'
import {
  detectPushSupport,
  ForeignSubscriptionError,
  ownSubscription,
  subscribeDevice,
  toSubscriptionInput,
  unsubscribeDevice,
  type DevicePushSupport,
} from '../utils/device.ts'

type PushState = { support: DevicePushSupport; isOn: boolean; permission: NotificationPermission | null }

const permissionOf = () => (typeof Notification === 'undefined' ? null : Notification.permission)

export function PushSettings() {
  const { m } = useI18n()
  const text = m.settings.push
  const { push } = useStorage()
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState<PushState | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const support = await detectPushSupport()
    const isOn = support === 'supported' && userId !== null && (await ownSubscription(userId)) !== null
    setState({ support, isOn, permission: permissionOf() })
  }, [userId])

  useEffect(() => {
    let cancelled = false
    void Promise.all([detectPushSupport(), userId ? ownSubscription(userId) : null]).then(([support, own]) => {
      if (!cancelled) setState({ support, isOn: support === 'supported' && own !== null, permission: permissionOf() })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const toggle = useAsyncAction(async (on: boolean) => {
    if (!push || !userId) return
    setNotice(null)
    try {
      if (on) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const subscription = await subscribeDevice(userId, await push.getKey())
        try {
          await push.subscribe(toSubscriptionInput(subscription))
        } catch (error) {
          await unsubscribeDevice()
          throw error
        }
      } else {
        const endpoint = await unsubscribeDevice()
        if (endpoint) await push.unsubscribe(endpoint)
      }
    } catch (error) {
      if (!(error instanceof ForeignSubscriptionError)) throw error
      setNotice(text.foreign)
    } finally {
      await refresh()
    }
  })

  if (!push || !state) return null
  const hint =
    state.support === 'unsupported'
      ? text.unsupported
      : state.support === 'appleNeedsInstall'
        ? text.appleNeedsInstall
        : state.support === 'noServiceWorker'
          ? text.noServiceWorker
          : state.permission === 'denied'
            ? text.denied
            : null

  return (
    <PageSection title={text.title} description={text.description}>
      {hint && <p className="formHint">{hint}</p>}
      {state.support === 'supported' && (
        <Switch
          label={text.thisDevice}
          checked={state.isOn}
          disabled={toggle.isPending || (state.permission === 'denied' && !state.isOn)}
          onChange={(on) => void toggle.run(on)}
        />
      )}
      {notice && <p className="formHint">{notice}</p>}
      <ErrorMessage message={toggle.error} />
    </PageSection>
  )
}
