import { useState } from 'react'
import type { TaskPlanPreview, useTaskEditor } from '../../tasks/index.ts'
import type { CalendarView } from '../types/view.ts'

type PlanPreviewState = {
  preview: TaskPlanPreview
  view: CalendarView
  date: string
}

type PlanPreviewOptions = {
  view: CalendarView
  anchor: string
  show: (view: CalendarView, date: string) => void
  showView: (view: CalendarView, date: string) => void
  attempt: (action: () => Promise<unknown>) => Promise<boolean>
  clearError: () => void
  openTask: ReturnType<typeof useTaskEditor>['openEdit']
}

export function usePlanPreview({ view, anchor, show, showView, attempt, clearError, openTask }: PlanPreviewOptions) {
  const [state, setState] = useState<PlanPreviewState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const start = (preview: TaskPlanPreview) => {
    clearError()
    setState({ preview, view, date: anchor })
    showView('week', preview.blocks[0]?.date ?? anchor)
  }
  const end = () => {
    if (!state) return
    setState(null)
    show(state.view, state.date)
  }
  const back = () => {
    if (!state) return
    end()
    openTask(state.preview.task, state.preview.distribution)
  }
  const save = async () => {
    if (!state) return
    setIsSaving(true)
    const saved = await attempt(state.preview.save)
    setIsSaving(false)
    if (saved) end()
  }
  return { preview: state?.preview ?? null, isSaving, start, end, back, save }
}
