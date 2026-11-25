import { Button } from '../../../components/Button.tsx'
import { useI18n } from '../../../i18n/index.ts'
import type { TaskPlanPreview } from '../types/task.ts'

type TaskPlanPreviewActionsProps = {
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}

export function TaskPlanPreviewActions({ isSaving, onSave, onCancel }: TaskPlanPreviewActionsProps) {
  const { m } = useI18n()
  return (
    <span className="planPreviewActions">
      <Button variant="secondary" disabled={isSaving} onClick={onCancel}>
        {m.common.cancel}
      </Button>
      <Button isPending={isSaving} pendingLabel={m.tasks.plan.saving} onClick={onSave}>
        {m.tasks.plan.save}
      </Button>
    </span>
  )
}

type TaskPlanPreviewBarProps = {
  preview: TaskPlanPreview
  isSaving: boolean
  onBack: () => void
}

export function TaskPlanPreviewBar({ preview, isSaving, onBack }: TaskPlanPreviewBarProps) {
  const { m, format } = useI18n()
  const text = m.tasks.plan
  const total = preview.blocks.reduce((sum, block) => sum + block.minutes, 0)
  return (
    <section className="planPreviewBar" aria-label={text.previewTitle(preview.task.title)}>
      <div className="planPreviewText">
        <strong>{text.previewTitle(preview.task.title)}</strong>
        <span>{text.previewSummary(preview.blocks.length, format.effort(total))}</span>
        <span className="planPreviewHint">
          {text.previewHint}
          {preview.replacedIds.length > 0 && ` ${text.previewReplaced}`}
        </span>
        {preview.missingMinutes > 0 && (
          <span className="planPreviewMissing">{text.missing(format.effort(preview.missingMinutes))}</span>
        )}
      </div>
      <Button variant="outline" disabled={isSaving} onClick={onBack}>
        {text.back}
      </Button>
    </section>
  )
}
