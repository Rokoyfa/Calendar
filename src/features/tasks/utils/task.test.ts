import { describe, expect, it } from 'vitest'
import type { Task } from '../types/task.ts'
import {
  checklistProgress,
  groupTasksByDate,
  groupTasksByStatus,
  isTaskOverdue,
  normalizeTaskInput,
  parseTask,
  sortTasks,
  sumTaskEstimates,
} from './task.ts'

const task = (fields: Partial<Task>): Task => ({
  id: 't',
  calendarId: 'c1',
  title: 'Aufgabe',
  notes: '',
  dueDate: null,
  dueTime: null,
  estimateMinutes: null,
  status: 'open',
  priority: 'normal',
  categoryIds: [],
  builtinCategories: [],
  checklist: [],
  assignee: null,
  completedAt: null,
  completedBy: null,
  createdBy: null,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  version: 1,
  ...fields,
})

const TODAY = '2026-11-24'

describe('task utils', () => {
  it('parses a task and drops a time without date', () => {
    expect(parseTask({ id: 't1', calendarId: 'c1', title: 'A', dueTime: '09:00', version: 3 })).toMatchObject({
      id: 't1',
      dueDate: null,
      dueTime: null,
      version: 3,
    })
    expect(
      parseTask({
        id: 't2',
        calendarId: 'c1',
        title: 'B',
        dueDate: '2026-11-30',
        dueTime: '09:30',
        assignee: { id: 'u1', name: 'Carla' },
      }),
    ).toMatchObject({ dueDate: '2026-11-30', dueTime: '09:30', assignee: { id: 'u1', name: 'Carla' } })
    expect(parseTask({ id: 't3', calendarId: 'c1', title: '' })).toBeNull()
  })

  it('trims input and clears the time without date', () => {
    expect(
      normalizeTaskInput({
        title: ' A ',
        notes: ' n ',
        dueDate: null,
        dueTime: '10:00',
        estimateMinutes: 45,
        status: 'waiting',
        priority: 'high',
        categoryIds: ['k1', 'k1'],
        builtinCategories: ['learning', 'work'],
        checklist: [
          { title: ' Erst ', done: false },
          { title: '  ', done: true },
        ],
        assigneeId: null,
      }),
    ).toEqual({
      title: 'A',
      notes: 'n',
      dueDate: null,
      dueTime: null,
      estimateMinutes: 45,
      status: 'waiting',
      priority: 'high',
      categoryIds: ['k1'],
      builtinCategories: ['work', 'learning'],
      checklist: [{ title: 'Erst', done: false }],
      assigneeId: null,
    })
  })

  it('reads status, priority and checklist and falls back for older data', () => {
    expect(
      parseTask({
        id: 't',
        calendarId: 'c1',
        title: 'A',
        status: 'inProgress',
        priority: 'urgent',
        categoryIds: ['k1', 3],
        checklist: [{ id: 'i1', title: 'Eins', done: true }, { title: 'ohne id' }],
      }),
    ).toMatchObject({
      status: 'inProgress',
      priority: 'urgent',
      categoryIds: ['k1'],
      checklist: [{ id: 'i1', title: 'Eins', done: true }],
    })
    expect(parseTask({ id: 't', calendarId: 'c1', title: 'A', completedAt: '2026-11-01T00:00:00Z' })).toMatchObject({
      status: 'done',
      priority: 'normal',
    })
    expect(parseTask({ id: 't', calendarId: 'c1', title: 'A', status: 'erledigt' })?.status).toBe('open')
  })

  it('sorts open tasks by priority, due date and time, then done ones by completion', () => {
    const sorted = sortTasks([
      task({ id: 'urgent', priority: 'urgent' }),
      task({ id: 'done-old', status: 'done', completedAt: '2026-11-01T00:00:00.000Z' }),
      task({ id: 'someday' }),
      task({ id: 'late', dueDate: '2026-11-25', dueTime: '18:00' }),
      task({ id: 'early', dueDate: '2026-11-25', dueTime: '08:00' }),
      task({ id: 'date-only', dueDate: '2026-11-25' }),
      task({ id: 'done-new', status: 'done', completedAt: '2026-11-20T00:00:00.000Z' }),
    ])
    expect(sorted.map(({ id }) => id)).toEqual([
      'urgent',
      'early',
      'late',
      'date-only',
      'someday',
      'done-new',
      'done-old',
    ])
  })

  it('groups tasks by status and finds overdue ones', () => {
    const groups = groupTasksByStatus([
      task({ id: 'a', dueDate: '2026-11-20' }),
      task({ id: 'b', status: 'inProgress' }),
      task({ id: 'c', status: 'waiting' }),
      task({ id: 'd', status: 'done', dueDate: '2026-11-20', completedAt: '2026-11-21T00:00:00.000Z' }),
    ])
    expect([...groups].map(([status, tasks]) => [status, tasks.map(({ id }) => id)])).toEqual([
      ['open', ['a']],
      ['inProgress', ['b']],
      ['waiting', ['c']],
      ['done', ['d']],
    ])
    expect(isTaskOverdue(task({ dueDate: '2026-11-20' }), TODAY)).toBe(true)
    expect(isTaskOverdue(task({ dueDate: '2026-11-20', status: 'done' }), TODAY)).toBe(false)
    expect(
      checklistProgress(
        task({
          checklist: [
            { id: '1', title: 'A', done: true },
            { id: '2', title: 'B', done: false },
          ],
        }),
      ),
    ).toEqual({ done: 1, total: 2 })
  })

  it('groups tasks by due date and skips those without one', () => {
    const byDate = groupTasksByDate([task({ id: 'a', dueDate: TODAY }), task({ id: 'b' })])
    expect([...byDate.keys()]).toEqual([TODAY])
  })

  it('keeps a valid estimate and sums estimates', () => {
    expect(parseTask({ id: 'a', calendarId: 'c1', title: 'A', estimateMinutes: 90 })?.estimateMinutes).toBe(90)
    expect(parseTask({ id: 'b', calendarId: 'c1', title: 'B', estimateMinutes: 0 })?.estimateMinutes).toBeNull()
    expect(parseTask({ id: 'c', calendarId: 'c1', title: 'C', estimateMinutes: 6000 })?.estimateMinutes).toBeNull()
    expect(parseTask({ id: 'd', calendarId: 'c1', title: 'D', estimateMinutes: 1.5 })?.estimateMinutes).toBeNull()
    expect(sumTaskEstimates([task({ estimateMinutes: 30 }), task({}), task({ estimateMinutes: 45 })])).toBe(75)
  })
})
