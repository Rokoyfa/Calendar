import { useCallback, useMemo, useState } from 'react'
import type { PlanningDistribution } from '../../../utils/preferences.ts'
import type { Task, TaskDraft } from '../types/task.ts'

export type TaskEditorState = { task: Task | null; draft: TaskDraft; resumePlan?: PlanningDistribution }

export function useTaskEditor() {
  const [shown, setShown] = useState<TaskEditorState | null>(null)
  const openCreate = useCallback((draft: TaskDraft = {}) => setShown({ task: null, draft }), [])
  const openEdit = useCallback(
    (task: Task, resumePlan?: PlanningDistribution) => setShown({ task, draft: {}, resumePlan }),
    [],
  )
  const close = useCallback(() => setShown(null), [])
  return useMemo(() => ({ shown, openCreate, openEdit, close }), [shown, openCreate, openEdit, close])
}

export type TaskEditor = ReturnType<typeof useTaskEditor>
