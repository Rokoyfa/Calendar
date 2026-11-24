export type TaskPerson = {
  id: string
  name: string
}

export type TaskInput = {
  title: string
  notes: string
  dueDate: string | null
  dueTime: string | null
  estimateMinutes: number | null
  assigneeId: string | null
}

export type Task = Omit<TaskInput, 'assigneeId'> & {
  id: string
  calendarId: string
  assignee: TaskPerson | null
  completedAt: string | null
  completedBy: TaskPerson | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export const TASK_STATUSES = ['open', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export type TaskQuery = {
  calendarIds: readonly string[]
  from?: string
  to?: string
  status?: TaskStatus
}

export interface TaskRepository {
  list(query: TaskQuery): Promise<Task[]>
  create(calendarId: string, input: TaskInput): Promise<Task>
  update(id: string, input: TaskInput, version?: number): Promise<Task>
  setCompleted(id: string, completed: boolean, version?: number): Promise<Task>
  move(id: string, calendarId: string, version?: number): Promise<Task>
  remove(id: string, version?: number): Promise<void>
}

export type TaskAccess = {
  canCreateIn: (calendarId: string) => boolean
  canEdit: (task: Task) => boolean
  canComplete: (task: Task) => boolean
  canDelete: (task: Task) => boolean
}

export type TaskCalendarChoice = { id: string; name: string }

export type TaskDraft = Partial<TaskInput> & { calendarId?: string }

export type TaskSetup = {
  calendarIds: readonly string[]
  targetCalendarId: string
  choices: readonly TaskCalendarChoice[]
  calendarNames: ReadonlyMap<string, string>
  access: TaskAccess
  loadAssignees?: (calendarId: string) => Promise<TaskPerson[]>
  openTaskId?: string | null
  onOpenTaskDone?: () => void
}
