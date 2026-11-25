import { parseBuiltinCategories } from '../../../utils/category.ts'
import { isISODate, isTime } from '../../../utils/date.ts'
import { filledTextOrNull, isRecord, parseList, textOrEmpty } from '../../../utils/parse.ts'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskChecklistItem,
  type TaskInput,
  type TaskPerson,
  type TaskPriority,
  type TaskStatus,
} from '../types/task.ts'

export const TASK_TITLE_MAX_LENGTH = 200
export const TASK_NOTES_MAX_LENGTH = 2000
export const MAX_DONE_TASKS = 200
export const TASK_ESTIMATE_MAX_MINUTES = 5999
export const TASK_CHECKLIST_MAX_ITEMS = 50
export const TASK_MAX_CATEGORIES = 5

export const EMPTY_TASK_INPUT: TaskInput = {
  title: '',
  notes: '',
  dueDate: null,
  dueTime: null,
  estimateMinutes: null,
  status: 'open',
  priority: 'normal',
  categoryIds: [],
  builtinCategories: [],
  checklist: [],
  assigneeId: null,
}

export const isTaskStatus = (value: unknown): value is TaskStatus =>
  (TASK_STATUSES as readonly unknown[]).includes(value)

export const isTaskPriority = (value: unknown): value is TaskPriority =>
  (TASK_PRIORITIES as readonly unknown[]).includes(value)

const parseChecklistItem = (value: unknown): TaskChecklistItem | null => {
  if (!isRecord(value)) return null
  const id = filledTextOrNull(value.id)
  const title = filledTextOrNull(value.title)
  return id && title ? { id, title, done: value.done === true } : null
}

const parseIds = (value: unknown) =>
  Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && id !== '') : []

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
  const completedAt = filledTextOrNull(value.completedAt)
  const status = isTaskStatus(value.status) ? value.status : completedAt ? 'done' : 'open'
  return {
    id,
    calendarId,
    title,
    notes: textOrEmpty(value.notes),
    dueDate,
    dueTime: dueDate && isTime(value.dueTime) ? value.dueTime : null,
    estimateMinutes: isTaskEstimate(value.estimateMinutes) ? value.estimateMinutes : null,
    status,
    priority: isTaskPriority(value.priority) ? value.priority : 'normal',
    categoryIds: parseIds(value.categoryIds),
    builtinCategories: parseBuiltinCategories(value.builtinCategories),
    checklist: parseList(value.checklist, parseChecklistItem),
    assignee: parsePerson(value.assignee),
    completedAt: status === 'done' ? (completedAt ?? textOrEmpty(value.updatedAt)) : null,
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
  status: task.status,
  priority: task.priority,
  categoryIds: [...task.categoryIds],
  builtinCategories: [...task.builtinCategories],
  checklist: task.checklist.map((item) => ({ ...item })),
  assigneeId: task.assignee?.id ?? null,
})

export const normalizeTaskInput = (input: TaskInput): TaskInput => ({
  title: input.title.trim(),
  notes: input.notes.trim(),
  dueDate: input.dueDate,
  dueTime: input.dueDate ? input.dueTime : null,
  estimateMinutes: input.estimateMinutes,
  status: input.status,
  priority: input.priority,
  categoryIds: [...new Set(input.categoryIds)],
  builtinCategories: parseBuiltinCategories(input.builtinCategories),
  checklist: input.checklist.map((item) => ({ ...item, title: item.title.trim() })).filter((item) => item.title !== ''),
  assigneeId: input.assigneeId,
})

export const isTaskDone = (task: Pick<Task, 'status'>) => task.status === 'done'

const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

const dueKey = (task: Task) => `${task.dueDate ?? '9999-99-99'}T${task.dueTime ?? '99:99'}`

export const compareTasks = (a: Task, b: Task) => {
  if (isTaskDone(a) !== isTaskDone(b)) return isTaskDone(a) ? 1 : -1
  if (isTaskDone(a)) return (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    dueKey(a).localeCompare(dueKey(b)) ||
    a.title.localeCompare(b.title) ||
    a.id.localeCompare(b.id)
  )
}

const compareByDue = (a: Task, b: Task) =>
  dueKey(a).localeCompare(dueKey(b)) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || compareTasks(a, b)

export const sortTasks = (tasks: readonly Task[]) => [...tasks].sort(compareTasks)

export const groupTasksByDate = (tasks: readonly Task[]) => {
  const byDate = new Map<string, Task[]>()
  for (const task of [...tasks].sort(compareByDue)) {
    if (!task.dueDate) continue
    const list = byDate.get(task.dueDate)
    if (list) list.push(task)
    else byDate.set(task.dueDate, [task])
  }
  return byDate
}

export const groupTasksByStatus = (tasks: readonly Task[]) => {
  const groups = new Map<TaskStatus, Task[]>(TASK_STATUSES.map((status) => [status, []]))
  for (const task of sortTasks(tasks)) groups.get(task.status)!.push(task)
  return groups
}

export const isTaskOverdue = (task: Task, today: string) =>
  !isTaskDone(task) && task.dueDate !== null && task.dueDate < today

export const checklistProgress = (task: Pick<Task, 'checklist'>) => ({
  done: task.checklist.filter((item) => item.done).length,
  total: task.checklist.length,
})

export const sumTaskEstimates = (tasks: readonly Task[]) =>
  tasks.reduce((total, task) => total + (task.estimateMinutes ?? 0), 0)
