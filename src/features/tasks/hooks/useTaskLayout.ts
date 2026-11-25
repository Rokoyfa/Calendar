import { useCallback, useState } from 'react'

export const TASK_LAYOUTS = ['list', 'board'] as const

export type TaskLayout = (typeof TASK_LAYOUTS)[number]

const STORAGE_KEY = 'calendar.taskLayout.v1'

const readLayout = (): TaskLayout => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'board' ? 'board' : 'list'
  } catch {
    return 'list'
  }
}

export function useTaskLayout() {
  const [layout, setLayout] = useState(readLayout)
  const change = useCallback((next: TaskLayout) => {
    setLayout(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      return
    }
  }, [])
  return [layout, change] as const
}
