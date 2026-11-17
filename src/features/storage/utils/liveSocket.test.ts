import { afterEach, describe, expect, it, vi } from 'vitest'
import { LiveSocket } from './liveSocket.ts'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  readonly listeners = new Map<string, (event: { data?: string }) => void>()

  constructor() {
    FakeWebSocket.instances.push(this)
  }

  addEventListener(type: string, listener: (event: { data?: string }) => void) {
    this.listeners.set(type, listener)
  }

  send() {}

  close() {}

  fire(type: string, data?: string) {
    this.listeners.get(type)?.({ data })
  }
}

const failAll = async () => {
  for (let round = 0; round < 10; round += 1) {
    FakeWebSocket.instances.at(-1)?.fire('close')
    await vi.runOnlyPendingTimersAsync()
  }
}

describe('LiveSocket', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    FakeWebSocket.instances = []
  })

  it('stops trying after five failed starts when the backend has no WebSocket', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    new LiveSocket('ws://example.test/socket').subscribe(() => {})
    await failAll()
    expect(FakeWebSocket.instances).toHaveLength(5)
  })

  it('keeps reconnecting once a connection has worked', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeWebSocket)
    const messages: string[] = []
    new LiveSocket('ws://example.test/socket').subscribe((message) => messages.push(message.type))
    FakeWebSocket.instances[0].fire('open')
    await failAll()
    expect(FakeWebSocket.instances.length).toBeGreaterThan(5)
    expect(messages.slice(0, 2)).toEqual(['connected', 'disconnected'])
  })
})
