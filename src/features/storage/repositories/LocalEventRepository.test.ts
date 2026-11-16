import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eventInput } from '../../../test/fixtures.ts'
import { LocalEventRepository } from './LocalEventRepository.ts'

const createStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

describe('LocalEventRepository versions', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
  })

  it('starts at version 1 and counts up on every update', async () => {
    const repository = new LocalEventRepository('test.events')
    const created = await repository.create('personal', eventInput())
    expect(created.version).toBe(1)
    const updated = await repository.update(created.id, eventInput({ title: 'Neu' }), 1)
    expect(updated.version).toBe(2)
  })

  it('rejects an update based on an older version', async () => {
    const repository = new LocalEventRepository('test.events')
    const created = await repository.create('personal', eventInput())
    await repository.update(created.id, eventInput({ title: 'Erste' }), created.version)
    await expect(repository.update(created.id, eventInput({ title: 'Zweite' }), created.version)).rejects.toMatchObject(
      {
        code: 'eventChanged',
      },
    )
  })

  it('rejects a delete based on an older version and allows it without a version', async () => {
    const repository = new LocalEventRepository('test.events')
    const created = await repository.create('personal', eventInput())
    await repository.update(created.id, eventInput({ title: 'Geändert' }))
    await expect(repository.remove(created.id, created.version)).rejects.toMatchObject({ code: 'eventChanged' })
    await repository.remove(created.id)
    expect(await repository.listAll()).toEqual([])
  })
})
