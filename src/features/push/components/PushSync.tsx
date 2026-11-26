import { useEffect } from 'react'
import { addLogoutHook } from '../../../utils/logoutHooks.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage } from '../../storage/index.ts'
import { ownSubscription, readStoredPush, toSubscriptionInput, unsubscribeDevice } from '../utils/device.ts'

export function PushSync() {
  const { user } = useAuth()
  const { push } = useStorage()
  const userId = user?.id ?? null

  useEffect(() => {
    if (!push || !userId) return
    let cancelled = false
    void ownSubscription(userId)
      .then((subscription) => (subscription && !cancelled ? push.subscribe(toSubscriptionInput(subscription)) : null))
      .catch(() => undefined)
    const removeHook = addLogoutHook(async () => {
      if (readStoredPush()?.userId !== userId) return
      const endpoint = await unsubscribeDevice()
      if (endpoint) await push.unsubscribe(endpoint)
    })
    return () => {
      cancelled = true
      removeHook()
    }
  }, [push, userId])

  return null
}
