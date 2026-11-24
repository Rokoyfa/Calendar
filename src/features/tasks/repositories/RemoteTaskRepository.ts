import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { requireValue } from '../../../utils/parse.ts'
import type { TaskInput, TaskQuery, TaskRepository } from '../types/task.ts'
import { parseTask, parseTasks } from '../utils/task.ts'

const TASKS_PATH = '/tasks'

const ifMatch = (version: number | undefined): HeadersInit | undefined =>
  version === undefined || version < 1 ? undefined : { 'If-Match': `"${version}"` }

const taskPath = (id: string, action?: string) =>
  [TASKS_PATH, encodePathSegment(id), ...(action ? [action] : [])].join('/')

export class RemoteTaskRepository implements TaskRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async list({ calendarIds, from, to, status }: TaskQuery) {
    if (calendarIds.length === 0) return []
    return parseTasks(
      await this.#api.get<unknown>(TASKS_PATH, { query: { calendarId: [...calendarIds], from, to, status } }),
    )
  }

  async create(calendarId: string, input: TaskInput) {
    return requireValue(parseTask(await this.#api.post<unknown>(TASKS_PATH, { ...input, calendarId })))
  }

  async update(id: string, input: TaskInput, version?: number) {
    return requireValue(parseTask(await this.#api.put<unknown>(taskPath(id), input, { headers: ifMatch(version) })))
  }

  async setCompleted(id: string, completed: boolean, version?: number) {
    const path = taskPath(id, completed ? 'complete' : 'reopen')
    return requireValue(parseTask(await this.#api.post<unknown>(path, undefined, { headers: ifMatch(version) })))
  }

  async move(id: string, calendarId: string, version?: number) {
    const path = taskPath(id, 'move')
    return requireValue(parseTask(await this.#api.post<unknown>(path, { calendarId }, { headers: ifMatch(version) })))
  }

  async remove(id: string, version?: number) {
    await this.#api.delete(taskPath(id), { headers: ifMatch(version) })
  }
}
