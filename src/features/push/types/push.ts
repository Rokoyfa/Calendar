export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } }

export type PushRepository = {
  getKey: () => Promise<string>
  subscribe: (subscription: PushSubscriptionInput) => Promise<void>
  unsubscribe: (endpoint: string) => Promise<void>
}
