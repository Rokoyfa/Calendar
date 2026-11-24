import { isISODate, isTime } from '../../../utils/date.ts'
import { filledTextOrNull, isRecord, parseList, textOrEmpty } from '../../../utils/parse.ts'
import type { Task, TaskInput, TaskPerson } from '../types/task.ts'

export const TASK_TITLE_MAX_LENGTH = 200
export const TASK_NOTES_MAX_LENGTH = 2000
export const MAX_DONE_TASKS = 200
export const TASK_ESTIMATE_MAX_MINUTES = 5999

export const EMPTY_TASK_INPUT: TaskInput = {
  title: '',
  notes: '',
  dueDate: null,
  dueTime: null,
  estimateMinutes: null,
  assigneeId: null,
}

export const isTaskEstimate = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= TASK_ESTIMATE_MAX_MINUTES

const parsePerson = (value: unknown): TaskPerson | null => {
  if (!isRecord(value)) return null
  const id = filledTextOrNull(value.id)
  return id ? { id, name: textOrEmpty(value.name) } : null
}

const positiveInteger = (value: unknown) => (Number.isInteger(value) && (value as number) > 0 ? (value as number) : 1)

export const parseTask = (value: unknown): Task | null => {
  if (!isRecord(value)) return null
  const id = filledTextOrNull(value.id)
  const calendarId = filledTextOrNull(value.calendarId)
  const title = filledTextOrNull(value.title)
  if (!id || !calendarId || !title) return null
  const dueDate = isISODate(value.dueDate) ? value.dueDate : null
  return {
    id,
    calendarId,
    title,
    notes: textOrEmpty(value.notes),
    dueDate,
    dueTime: dueDate && isTime(value.dueTime) ? value.dueTime : null,
    estimateMinutes: isTaskEstimate(value.estimateMinutes) ? value.estimateMinutes : null,
    assignee: parsePerson(value.assignee),
    completedAt: filledTextOrNull(value.completedAt),
    completedBy: parsePerson(value.completedBy),
    createdBy: filledTextOrNull(value.createdBy),
    createdAt: textOrEmpty(value.createdAt),
    updatedAt: textOrEmpty(value.updatedAt),
    version: positiveInteger(value.version),
  }
}

export const parseTasks = (value: unknown) => parseList(value, parseTask)

export const toTaskInput = (task: Task): TaskInput => ({
  title: task.title,
  notes: task.notes,
  dueDate: task.dueDate,
  dueTime: task.dueTime,
  estimateMinutes: task.estimateMinutes,
  assigneeId: task.assignee?.id ?? null,
})

export const normalizeTaskInput = (input: TaskInput): TaskInput => ({
  title: input.title.trim(),
  notes: input.notes.trim(),
  dueDate: input.dueDate,
  dueTime: input.dueDate ? input.dueTime : null,
  estimateMinutes: input.estimateMinutes,
  assigneeId: input.assigneeId,
})

export const isTaskDone = (task: Pick<Task, 'completedAt'>) => task.completedAt !== null

const dueKey = (task: Task) => `${task.dueDate ?? '9999-99-99'}T${task.dueTime ?? '99:99'}`

export const compareTasks = (a: Task, b: Task) => {
  if (isTaskDone(a) !== isTaskDone(b)) return isTaskDone(a) ? 1 : -1
  if (isTaskDone(a)) return (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
  return dueKey(a).localeCompare(dueKey(b)) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
}

export const sortTasks = (tasks: readonly Task[]) => [...tasks].sort(compareTasks)

export const groupTasksByDate = (tasks: readonly Task[]) => {
  const byDate = new Map<string, Task[]>()
  for (const task of sortTasks(tasks)) {
    if (!task.dueDate) continue
    const list = byDate.get(task.dueDate)
    if (list) list.push(task)
    else byDate.set(task.dueDate, [task])
  }
  return byDate
}

export const TASK_GROUPS = ['overdue', 'today', 'upcoming', 'someday', 'done'] as const

export type TaskGroup = (typeof TASK_GROUPS)[number]

export const taskGroupOf = (task: Task, today: string): TaskGroup => {
  if (isTaskDone(task)) return 'done'
  if (!task.dueDate) return 'someday'
  if (task.dueDate < today) return 'overdue'
  return task.dueDate === today ? 'today' : 'upcoming'
}

export const groupTasks = (tasks: readonly Task[], today: string) => {
  const groups = new Map<TaskGroup, Task[]>(TASK_GROUPS.map((group) => [group, []]))
  for (const task of sortTasks(tasks)) groups.get(taskGroupOf(task, today))!.push(task)
  return groups
}

export const isTaskOverdue = (task: Task, today: string) => taskGroupOf(task, today) === 'overdue'

export const sumTaskEstimates = (tasks: readonly Task[]) =>
  tasks.reduce((total, task) => total + (task.estimateMinutes ?? 0), 0)
