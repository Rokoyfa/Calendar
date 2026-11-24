import { useCallback, useMemo, useState } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { isUnsupportedEndpoint } from '../../../utils/apiError.ts'
import { useStorage } from '../../storage/index.ts'
import type { Task, TaskInput, TaskRepository } from '../types/task.ts'

const NO_TASKS: Task[] = []

type TaskListOptions = {
  calendarIds: readonly string[]
  from?: string
  to?: string
  enabled?: boolean
}

export function useTaskList(
  repository: TaskRepository | undefined,
  { calendarIds, from, to, enabled = true }: TaskListOptions,
) {
  const { version } = useStorage()
  const [isUnsupported, setIsUnsupported] = useState(false)
  const load = useCallback(async () => {
    if (!repository || !enabled || calendarIds.length === 0) return NO_TASKS
    try {
      return await repository.list({ calendarIds, from, to })
    } catch (error) {
      if (!isUnsupportedEndpoint(error)) throw error
      setIsUnsupported(true)
      return NO_TASKS
    }
  }, [repository, enabled, calendarIds, from, to])
  const { data, error, isLoading } = useAsyncResource(load, NO_TASKS, version)
  return { tasks: data, error, isLoading, isUnsupported }
}

export function useTaskActions(repository: TaskRepository) {
  const { invalidate } = useStorage()
  return useMemo(() => {
    const withReload = async <T>(operation: () => Promise<T>) => {
      try {
        return await operation()
      } finally {
        invalidate()
      }
    }
    return {
      create: (calendarId: string, input: TaskInput) => withReload(() => repository.create(calendarId, input)),
      save: (task: Task, input: TaskInput, calendarId: string) =>
        withReload(async () => {
          const updated = await repository.update(task.id, input, task.version)
          return calendarId === task.calendarId ? updated : repository.move(task.id, calendarId, updated.version)
        }),
      setCompleted: (task: Task, completed: boolean) =>
        withReload(() => repository.setCompleted(task.id, completed, task.version)),
      remove: (task: Task) => withReload(() => repository.remove(task.id, task.version)),
    }
  }, [repository, invalidate])
}

export type TaskActions = ReturnType<typeof useTaskActions>
