import { asRecord } from '../../../utils/parse.ts'
import type { PushSubscriptionInput } from '../types/push.ts'

const STORAGE_KEY = 'calendar.push.v1'

export type DevicePushSupport = 'supported' | 'unsupported' | 'appleNeedsInstall' | 'noServiceWorker'

type StoredPush = { endpoint: string; userId: string }

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

export const isAppleMobile = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const hasPushApi = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const findRegistration = async () => {
  if (!hasPushApi()) return null
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null
  } catch {
    return null
  }
}

export const detectPushSupport = async (): Promise<DevicePushSupport> => {
  if (!hasPushApi()) return isAppleMobile() && !isStandalone() ? 'appleNeedsInstall' : 'unsupported'
  return (await findRegistration()) ? 'supported' : 'noServiceWorker'
}

export const readStoredPush = (): StoredPush | null => {
  try {
    const { endpoint, userId } = asRecord(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
    return typeof endpoint === 'string' && typeof userId === 'string' ? { endpoint, userId } : null
  } catch {
    return null
  }
}

const writeStoredPush = (value: StoredPush | null) => {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
}

const toKeyBytes = (base64Url: string) => {
  const base64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64Url.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))
}

export const toSubscriptionInput = (subscription: PushSubscription): PushSubscriptionInput => {
  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error('Incomplete push subscription')
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

export const ownSubscription = async (userId: string) => {
  const stored = readStoredPush()
  const registration = await findRegistration()
  const subscription = await registration?.pushManager.getSubscription().catch(() => null)
  if (!stored || !subscription || stored.endpoint !== subscription.endpoint) return null
  return stored.userId === userId ? subscription : null
}

export class ForeignSubscriptionError extends Error {}

export const subscribeDevice = async (userId: string, publicKey: string) => {
  const registration = await findRegistration()
  if (!registration) throw new Error('No service worker')
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    if (existing.endpoint !== readStoredPush()?.endpoint) throw new ForeignSubscriptionError()
    await existing.unsubscribe()
  }
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: toKeyBytes(publicKey),
  })
  writeStoredPush({ endpoint: subscription.endpoint, userId })
  return subscription
}

export const unsubscribeDevice = async () => {
  const stored = readStoredPush()
  writeStoredPush(null)
  if (!stored) return null
  const registration = await findRegistration()
  const subscription = await registration?.pushManager.getSubscription().catch(() => null)
  if (subscription?.endpoint === stored.endpoint) await subscription.unsubscribe().catch(() => false)
  return stored.endpoint
}
