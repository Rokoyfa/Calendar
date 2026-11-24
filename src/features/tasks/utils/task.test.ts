import { describe, expect, it } from 'vitest'
import type { Task } from '../types/task.ts'
import {
  groupTasks,
  groupTasksByDate,
  normalizeTaskInput,
  parseTask,
  sortTasks,
  sumTaskEstimates,
  taskGroupOf,
} from './task.ts'

const task = (fields: Partial<Task>): Task => ({
  id: 't',
  calendarId: 'c1',
  title: 'Aufgabe',
  notes: '',
  dueDate: null,
  dueTime: null,
  estimateMinutes: null,
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
        assigneeId: null,
      }),
    ).toEqual({ title: 'A', notes: 'n', dueDate: null, dueTime: null, estimateMinutes: 45, assigneeId: null })
  })

  it('sorts open tasks by due date and time, then done ones by completion', () => {
    const sorted = sortTasks([
      task({ id: 'done-old', completedAt: '2026-11-01T00:00:00.000Z' }),
      task({ id: 'someday' }),
      task({ id: 'late', dueDate: '2026-11-25', dueTime: '18:00' }),
      task({ id: 'early', dueDate: '2026-11-25', dueTime: '08:00' }),
      task({ id: 'date-only', dueDate: '2026-11-25' }),
      task({ id: 'done-new', completedAt: '2026-11-20T00:00:00.000Z' }),
    ])
    expect(sorted.map(({ id }) => id)).toEqual(['early', 'late', 'date-only', 'someday', 'done-new', 'done-old'])
  })

  it('groups tasks for the list', () => {
    const groups = groupTasks(
      [
        task({ id: 'a', dueDate: '2026-11-20' }),
        task({ id: 'b', dueDate: TODAY }),
        task({ id: 'c', dueDate: '2026-12-01' }),
        task({ id: 'd' }),
        task({ id: 'e', dueDate: '2026-11-20', completedAt: '2026-11-21T00:00:00.000Z' }),
      ],
      TODAY,
    )
    expect([...groups].map(([group, tasks]) => [group, tasks.map(({ id }) => id)])).toEqual([
      ['overdue', ['a']],
      ['today', ['b']],
      ['upcoming', ['c']],
      ['someday', ['d']],
      ['done', ['e']],
    ])
    expect(taskGroupOf(task({ dueDate: '2026-11-23', completedAt: 'x' }), TODAY)).toBe('done')
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
