import { AppError } from '../../../utils/appError.ts'
import { LocalStorageList } from '../../storage/utils/localStorageList.ts'
import type { Task, TaskChecklistItem, TaskInput, TaskQuery, TaskRepository, TaskStatus } from '../types/task.ts'
import { isTaskDone, MAX_DONE_TASKS, normalizeTaskInput, parseTask, sortTasks } from '../utils/task.ts'

const DEFAULT_STORAGE_KEY = 'calendar.tasks.v1'

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const completion = (current: Task | null, status: TaskStatus) =>
  status !== 'done' ? null : current && isTaskDone(current) ? current.completedAt : new Date().toISOString()

const taskFields = (input: TaskInput, current: Task | null) => {
  const {
    title,
    notes,
    dueDate,
    dueTime,
    estimateMinutes,
    status,
    priority,
    categoryIds,
    builtinCategories,
    checklist,
  } = normalizeTaskInput(input)
  const known = new Set(current?.checklist.map((item) => item.id) ?? [])
  const used = new Set<string>()
  const items: TaskChecklistItem[] = checklist.map(({ id, title: itemTitle, done }) => {
    const kept = id && known.has(id) && !used.has(id) ? id : createId()
    used.add(kept)
    return { id: kept, title: itemTitle, done }
  })
  return {
    title,
    notes,
    dueDate,
    dueTime,
    estimateMinutes,
    status,
    priority,
    categoryIds,
    builtinCategories,
    checklist: items,
    completedAt: completion(current, status),
  }
}

export type TaskBlockStore = { releaseTaskBlocks(taskId: string, unlink: boolean): Promise<void> }

export class LocalTaskRepository implements TaskRepository {
  readonly #tasks: LocalStorageList<Task>
  readonly #blocks: TaskBlockStore | undefined

  constructor(storageKey = DEFAULT_STORAGE_KEY, blocks?: TaskBlockStore) {
    this.#tasks = new LocalStorageList(storageKey, parseTask, 'saveTasksFailed')
    this.#blocks = blocks
  }

  async list({ calendarIds, from, to, completed }: TaskQuery) {
    const hasRange = from !== undefined && to !== undefined
    const matches = this.#tasks
      .read()
      .filter(
        (task) =>
          calendarIds.includes(task.calendarId) &&
          (!hasRange || (task.dueDate !== null && task.dueDate >= from && task.dueDate <= to)),
      )
    const open = completed === true ? [] : matches.filter((task) => !isTaskDone(task))
    const done = completed === false ? [] : sortTasks(matches.filter(isTaskDone))
    return [...open, ...(hasRange ? done : done.slice(0, MAX_DONE_TASKS))]
  }

  async create(calendarId: string, input: TaskInput) {
    const timestamp = new Date().toISOString()
    const task: Task = {
      ...taskFields(input, null),
      id: createId(),
      calendarId,
      assignee: null,
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
    await this.#releaseOnDone(id, version, normalizeTaskInput(input).status)
    return this.#change(id, version, (task) => ({ ...task, ...taskFields(input, task) }))
  }

  async setStatus(id: string, status: TaskStatus, version?: number) {
    await this.#releaseOnDone(id, version, status)
    return this.#change(id, version, (task) =>
      task.status === status ? task : { ...task, status, completedAt: completion(task, status) },
    )
  }

  async setChecklistItem(id: string, itemId: string, done: boolean, version?: number) {
    return this.#change(id, version, (task) => {
      const item = task.checklist.find((entry) => entry.id === itemId)
      if (!item) throw new AppError('taskNotFound')
      if (item.done === done) return task
      return { ...task, checklist: task.checklist.map((entry) => (entry.id === itemId ? { ...entry, done } : entry)) }
    })
  }

  async move(id: string, calendarId: string, version?: number) {
    return this.#change(id, version, (task) =>
      task.calendarId === calendarId ? task : { ...task, calendarId, categoryIds: [] },
    )
  }

  async remove(id: string, version?: number) {
    this.#find(id, version)
    await this.#blocks?.releaseTaskBlocks(id, true)
    this.#tasks.update((tasks) => tasks.filter((task) => task.id !== id))
  }

  async #releaseOnDone(id: string, version: number | undefined, status: TaskStatus) {
    const current = this.#find(id, version)
    if (status === 'done' && !isTaskDone(current)) await this.#blocks?.releaseTaskBlocks(id, false)
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
