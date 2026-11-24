import { createContext, use } from 'react'
import type { Task, TaskDraft } from '../types/task.ts'

export type TasksContextValue = {
  byDate: ReadonlyMap<string, readonly Task[]>
  list: readonly Task[]
  listError: string | null
  isListLoading: boolean
  today: string
  calendarNames: ReadonlyMap<string, string> | null
  canCreate: boolean
  canComplete: (task: Task) => boolean
  toggle: (task: Task) => void
  open: (task: Task) => void
  create: (draft?: TaskDraft) => void
  quickAdd: (title: string) => Promise<void>
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
