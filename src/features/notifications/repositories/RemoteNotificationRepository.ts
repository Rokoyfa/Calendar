import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { parseNotification, parseNotificationPage, type AppNotification } from '../utils/notification.ts'
import type { NotificationRepository } from '../../storage/index.ts'
import type { LiveSocket } from '../../../utils/liveSocket.ts'

const PATH = '/notifications'

export class RemoteNotificationRepository implements NotificationRepository {
  readonly #api: ApiClient
  readonly #socket: LiveSocket | undefined

  constructor(api: ApiClient, socket?: LiveSocket) {
    this.#api = api
    this.#socket = socket
  }

  async list({ before }: { before?: string } = {}) {
    return parseNotificationPage(await this.#api.get<unknown>(PATH, { query: { before } }))
  }

  async markRead(ids?: readonly string[]) {
    await this.#api.post<void>(`${PATH}/read`, ids ? { ids } : {})
  }

  remove(id: string) {
    return this.#api.delete(`${PATH}/${encodePathSegment(id)}`)
  }

  subscribe(listener: (notification: AppNotification) => void) {
    if (!this.#socket) return () => undefined
    return this.#socket.subscribe((message) => {
      if (message.type !== 'notification.created') return
      const notification = parseNotification(message.notification)
      if (notification) listener(notification)
    })
  }
}
