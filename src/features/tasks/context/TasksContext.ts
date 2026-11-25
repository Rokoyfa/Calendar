import { createContext, use } from 'react'
import type { Category } from '../../../utils/category.ts'
import type { Task, TaskDraft, TaskStatus } from '../types/task.ts'

export type TasksContextValue = {
  byDate: ReadonlyMap<string, readonly Task[]>
  list: readonly Task[]
  listError: string | null
  isListLoading: boolean
  today: string
  calendarNames: ReadonlyMap<string, string> | null
  categories: ReadonlyMap<string, Category>
  canCreate: boolean
  canProgress: (task: Task) => boolean
  toggle: (task: Task) => void
  changeStatus: (task: Task, status: TaskStatus) => void
  open: (task: Task) => void
  create: (draft?: TaskDraft) => void
}

const NO_TASKS: readonly Task[] = []

export const TasksContext = createContext<TasksContextValue | null>(null)

export const useTasksContext = () => use(TasksContext)

export const useDayTasks = (date: string) => use(TasksContext)?.byDate.get(date) ?? NO_TASKS

export const useTaskRows = (dates: readonly string[], limit: number) => {
  const byDate = use(TasksContext)?.byDate
  if (!byDate) return 0
  return Math.min(Math.max(0, ...dates.map((date) => byDate.get(date)?.length ?? 0)), limit)
}
