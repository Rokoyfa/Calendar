import { AppError } from '../../../utils/appError.ts'
import { LocalStorageList } from '../../storage/utils/localStorageList.ts'
import type { Task, TaskInput, TaskQuery, TaskRepository } from '../types/task.ts'
import { isTaskDone, MAX_DONE_TASKS, normalizeTaskInput, parseTask, sortTasks } from '../utils/task.ts'

const DEFAULT_STORAGE_KEY = 'calendar.tasks.v1'

const taskFields = (input: TaskInput) => {
  const { title, notes, dueDate, dueTime, estimateMinutes } = normalizeTaskInput(input)
  return { title, notes, dueDate, dueTime, estimateMinutes }
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export class LocalTaskRepository implements TaskRepository {
  readonly #tasks: LocalStorageList<Task>

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.#tasks = new LocalStorageList(storageKey, parseTask, 'saveTasksFailed')
  }

  async list({ calendarIds, from, to, status }: TaskQuery) {
    const hasRange = from !== undefined && to !== undefined
    const matches = this.#tasks
      .read()
      .filter(
        (task) =>
          calendarIds.includes(task.calendarId) &&
          (!hasRange || (task.dueDate !== null && task.dueDate >= from && task.dueDate <= to)),
      )
    const open = status === 'done' ? [] : matches.filter((task) => !isTaskDone(task))
    const done = status === 'open' ? [] : sortTasks(matches.filter(isTaskDone))
    return [...open, ...(hasRange ? done : done.slice(0, MAX_DONE_TASKS))]
  }

  async create(calendarId: string, input: TaskInput) {
    const timestamp = new Date().toISOString()
    const task: Task = {
      ...taskFields(input),
      id: createId(),
      calendarId,
      assignee: null,
      completedAt: null,
      completedBy: null,
      createdBy: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
    }
    this.#tasks.update((tasks) => [...tasks, task])
    return task
  }

  async update(id: string, input: TaskInput, version?: number) {
    return this.#change(id, version, (task) => ({ ...task, ...taskFields(input) }))
  }

  async setCompleted(id: string, completed: boolean, version?: number) {
    return this.#change(id, version, (task) =>
      isTaskDone(task) === completed ? task : { ...task, completedAt: completed ? new Date().toISOString() : null },
    )
  }

  async move(id: string, calendarId: string, version?: number) {
    return this.#change(id, version, (task) => ({ ...task, calendarId }))
  }

  async remove(id: string, version?: number) {
    this.#find(id, version)
    this.#tasks.update((tasks) => tasks.filter((task) => task.id !== id))
  }

  #find(id: string, version?: number) {
    const task = this.#tasks.read().find((entry) => entry.id === id)
    if (!task) throw new AppError('taskNotFound')
    if (version !== undefined && version !== task.version) throw new AppError('taskChanged')
    return task
  }

  #change(id: string, version: number | undefined, change: (task: Task) => Task) {
    const current = this.#find(id, version)
    const next = change(current)
    if (next === current) return current
    const saved = { ...next, updatedAt: new Date().toISOString(), version: current.version + 1 }
    this.#tasks.update((tasks) => tasks.map((task) => (task.id === id ? saved : task)))
    return saved
  }
}
