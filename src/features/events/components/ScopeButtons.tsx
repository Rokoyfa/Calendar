import type { EditScope } from '../../../utils/event.ts'
import { classNames } from '../../../utils/classNames.ts'
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
        <button
          key={scope}
          type="button"
          className={classNames('button button--block', variant === 'danger' && 'button--danger')}
          disabled={disabled}
          onClick={() => onSelect(scope)}
          data-autofocus={!focusCancel && index === 0 ? true : undefined}
        >
          {EDIT_SCOPE_LABELS[scope]}
        </button>
      ))}
      <button
        type="button"
        className="button button--secondary button--block"
        onClick={onCancel}
        data-autofocus={focusCancel ? true : undefined}
      >
        Abbrechen
      </button>
    </div>
  )
}
