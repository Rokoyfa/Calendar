import type { ComponentProps } from 'react'
import { useI18n } from '../i18n/index.ts'
import { Button } from './Button.tsx'

type FormActionsProps = {
  isPending: boolean
  onCancel?: () => void
  submitLabel?: string
  pendingLabel?: string
  variant?: ComponentProps<typeof Button>['variant']
  disabled?: boolean
}

export function FormActions({ isPending, onCancel, submitLabel, pendingLabel, variant, disabled }: FormActionsProps) {
  const { m } = useI18n()
  return (
    <div className="formActions">
      {onCancel && (
        <Button variant="secondary" onClick={onCancel}>
          {m.common.cancel}
        </Button>
      )}
      <Button
        type="submit"
        variant={variant}
        isPending={isPending}
        pendingLabel={pendingLabel ?? (submitLabel ? undefined : m.common.saving)}
        disabled={disabled}
      >
        {submitLabel ?? m.common.save}
      </Button>
    </div>
  )
}
