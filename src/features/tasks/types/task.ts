import type { PlanningDistribution } from '../../../domain/preferences.ts'
import type { PlannedBlock } from '../utils/taskPlanner.ts'
import type { CalendarEvent } from '../../../domain/event.ts'
import type { BuiltinCategory } from '../../../domain/category.ts'
import type { Recurrence } from '../../../domain/recurrence.ts'

export type TaskPerson = {
  id: string
  name: string
}

export const TASK_STATUSES = ['open', 'inProgress', 'waiting', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export type TaskChecklistItem = { id: string; title: string; done: boolean }

export type TaskChecklistInput = { id?: string; title: string; done: boolean }

export type TaskInput = {
  title: string
  notes: string
  dueDate: string | null
  dueTime: string | null
  estimateMinutes: number | null
  status: TaskStatus
  priority: TaskPriority
  categoryIds: string[]
  builtinCategories: BuiltinCategory[]
  checklist: TaskChecklistInput[]
  assigneeId: string | null
  recurrence: Recurrence | null
}

export type Task = Omit<TaskInput, 'assigneeId' | 'checklist'> & {
  id: string
  calendarId: string
  checklist: TaskChecklistItem[]
  assignee: TaskPerson | null
  completedAt: string | null
  completedBy: TaskPerson | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export type TaskQuery = {
  calendarIds: readonly string[]
  from?: string
  to?: string
  completed?: boolean
}

export interface TaskRepository {
  list(query: TaskQuery): Promise<Task[]>
  create(calendarId: string, input: TaskInput): Promise<Task>
  update(id: string, input: TaskInput, version?: number): Promise<Task>
  setStatus(id: string, status: TaskStatus, version?: number): Promise<Task>
  setChecklistItem(id: string, itemId: string, done: boolean, version?: number): Promise<Task>
  move(id: string, calendarId: string, version?: number): Promise<Task>
  remove(id: string, version?: number): Promise<void>
}

export type TaskAccess = {
  canCreateIn: (calendarId: string) => boolean
  canEdit: (task: Task) => boolean
  canProgress: (task: Task) => boolean
  canDelete: (task: Task) => boolean
}

export type TaskCalendarChoice = { id: string; name: string }

export type TaskDraft = Partial<TaskInput> & { calendarId?: string }

export type TaskPlanningSetup = {
  calendarId: string
  busyCalendarIds: readonly string[]
  externalEvents: readonly CalendarEvent[]
}

export type TaskPlanPreview = {
  task: Task
  calendarId: string
  timeZone: string
  blocks: readonly PlannedBlock[]
  replacedIds: readonly string[]
  missingMinutes: number
  distribution: PlanningDistribution
  save: () => Promise<void>
}

export type TaskSetup = {
  calendarIds: readonly string[]
  targetCalendarId: string
  choices: readonly TaskCalendarChoice[]
  calendarNames: ReadonlyMap<string, string>
  access: TaskAccess
  loadAssignees?: (calendarId: string) => Promise<TaskPerson[]>
  openTaskId?: string | null
  openTaskPlan?: boolean
  onOpenTaskDone?: () => void
  planning?: TaskPlanningSetup
}
