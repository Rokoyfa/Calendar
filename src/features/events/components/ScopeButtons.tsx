import type { EditScope } from '../../../utils/event.ts'
import { Button } from '../../../components/Button.tsx'
import { EDIT_SCOPE_LABELS } from '../constants/scopes.ts'

type ScopeButtonsProps = {
  options: readonly EditScope[]
  variant?: 'default' | 'danger'
  disabled?: boolean
  onSelect: (scope: EditScope) => void
  onCancel: () => void
}

export function ScopeButtons({ options, variant = 'default', disabled, onSelect, onCancel }: ScopeButtonsProps) {
  const focusCancel = variant === 'danger'
  return (
    <div className="modalActions modalActions--stacked">
      {options.map((scope, index) => (
        <Button
          key={scope}
          variant={variant === 'danger' ? 'danger' : 'primary'}
          block
          disabled={disabled}
          onClick={() => onSelect(scope)}
          data-autofocus={!focusCancel && index === 0 ? true : undefined}
        >
          {EDIT_SCOPE_LABELS[scope]}
        </Button>
      ))}
      <Button variant="secondary" block onClick={onCancel} data-autofocus={focusCancel ? true : undefined}>
        Abbrechen
      </Button>
    </div>
  )
}
