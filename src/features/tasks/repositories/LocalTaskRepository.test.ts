import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isAppError } from '../../../utils/appError.ts'
import type { TaskInput } from '../types/task.ts'
import { EMPTY_TASK_INPUT } from '../utils/task.ts'
import { LocalTaskRepository } from './LocalTaskRepository.ts'

const createStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

const input = (fields: Partial<TaskInput> = {}): TaskInput => ({ ...EMPTY_TASK_INPUT, title: 'Steuer', ...fields })

const codeOf = async (promise: Promise<unknown>) => {
  try {
    await promise
    return null
  } catch (error) {
    return isAppError(error) ? error.code : 'other'
  }
}

describe('LocalTaskRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage())
  })

  it('creates tasks without assignee and lists them by range', async () => {
    const repository = new LocalTaskRepository('test.tasks')
    const due = await repository.create('personal', input({ dueDate: '2026-11-25', assigneeId: 'u1' }))
    await repository.create('personal', input({ title: 'Irgendwann' }))
    await repository.create('other', input({ dueDate: '2026-11-25' }))
    expect(due).toMatchObject({ version: 1, assignee: null, completedAt: null })
    expect(await repository.list({ calendarIds: ['personal'] })).toHaveLength(2)
    const ranged = await repository.list({ calendarIds: ['personal'], from: '2026-11-24', to: '2026-11-30' })
    expect(ranged.map(({ id }) => id)).toEqual([due.id])
  })

  it('completes, reopens and counts versions', async () => {
    const repository = new LocalTaskRepository('test.tasks')
    const created = await repository.create('personal', input())
    const done = await repository.setCompleted(created.id, true, 1)
    expect(done.version).toBe(2)
    expect(done.completedAt).not.toBeNull()
    expect(await repository.list({ calendarIds: ['personal'], status: 'open' })).toHaveLength(0)
    const reopened = await repository.setCompleted(created.id, false, 2)
    expect(reopened).toMatchObject({ version: 3, completedAt: null })
  })

  it('rejects stale versions and unknown tasks', async () => {
    const repository = new LocalTaskRepository('test.tasks')
    const created = await repository.create('personal', input())
    await repository.update(created.id, input({ title: 'Neu' }), 1)
    expect(await codeOf(repository.update(created.id, input({ title: 'Alt' }), 1))).toBe('taskChanged')
    expect(await codeOf(repository.remove('missing'))).toBe('taskNotFound')
  })

  it('moves and deletes', async () => {
    const repository = new LocalTaskRepository('test.tasks')
    const created = await repository.create('personal', input())
    const moved = await repository.move(created.id, 'second', created.version)
    expect(moved.calendarId).toBe('second')
    await repository.remove(created.id, moved.version)
    expect(await repository.list({ calendarIds: ['personal', 'second'] })).toHaveLength(0)
  })
})
