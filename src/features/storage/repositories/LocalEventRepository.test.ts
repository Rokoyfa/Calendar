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

describe('LocalEventRepository trash', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
  })

  it('moves deleted events to the trash and restores them with the same id', async () => {
    const repository = new LocalEventRepository('test.events')
    const created = await repository.create('personal', eventInput({ title: 'Weg' }))
    await repository.remove(created.id)
    expect(await repository.listAll()).toEqual([])
    const [entry] = await repository.listTrash('personal')
    expect(entry.event.title).toBe('Weg')
    const restored = await repository.restore(created.id)
    expect(restored.id).toBe(created.id)
    expect(restored.version).toBe(created.version + 1)
    expect(await repository.listTrash('personal')).toEqual([])
  })

  it('refuses to restore a detached event whose series is deleted', async () => {
    const repository = new LocalEventRepository('test.events')
    const series = await repository.create('personal', eventInput({ title: 'Serie' }))
    const detached = await repository.create(
      'personal',
      eventInput({ title: 'Einzeln', seriesId: series.id, originalDate: '2026-11-10' }),
    )
    await repository.remove(detached.id)
    await repository.remove(series.id)
    await expect(repository.restore(detached.id)).rejects.toMatchObject({ code: 'seriesDeleted' })
    await repository.restore(series.id)
    await expect(repository.restore(detached.id)).resolves.toMatchObject({ id: detached.id })
  })

  it('hides entries older than 30 days and deletes them for good on request', async () => {
    const repository = new LocalEventRepository('test.events')
    const old = await repository.create('personal', eventInput({ title: 'Alt' }))
    const recent = await repository.create('personal', eventInput({ title: 'Neu' }))
    vi.useFakeTimers({ now: new Date('2026-01-01T10:00:00Z'), toFake: ['Date'] })
    await repository.remove(old.id)
    vi.useRealTimers()
    await repository.remove(recent.id)
    expect((await repository.listTrash('personal')).map((entry) => entry.event.title)).toEqual(['Neu'])
    await repository.purge(recent.id)
    expect(await repository.listTrash('personal')).toEqual([])
  })

  it('empties the trash of one calendar only', async () => {
    const repository = new LocalEventRepository('test.events')
    const own = await repository.create('personal', eventInput({ title: 'Eigen' }))
    const other = await repository.create('team', eventInput({ title: 'Team' }))
    await repository.remove(own.id)
    await repository.remove(other.id)
    expect(await repository.emptyTrash('personal')).toBe(1)
    expect(await repository.listTrash('personal')).toEqual([])
    expect((await repository.listTrash('team')).map((entry) => entry.event.title)).toEqual(['Team'])
  })
})

