import type { ApiClient } from '../../../utils/api.ts'
import { asRecord } from '../../../utils/parse.ts'
import type { PushRepository, PushSubscriptionInput } from '../types/push.ts'

export class RemotePushRepository implements PushRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async getKey() {
    const { publicKey } = asRecord(await this.#api.get<unknown>('/push/key'))
    if (typeof publicKey !== 'string' || !/^[A-Za-z0-9_-]+$/.test(publicKey)) throw new Error('Invalid push key')
    return publicKey
  }

  async subscribe(subscription: PushSubscriptionInput) {
    await this.#api.post<unknown>('/push/subscriptions', subscription)
  }

  async unsubscribe(endpoint: string) {
    await this.#api.post<unknown>('/push/subscriptions/remove', { endpoint })
  }
}
