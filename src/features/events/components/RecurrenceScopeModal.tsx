import { Modal } from '../../../components/Modal.tsx'
import type { EditScope } from '../../../utils/event.ts'
import { EDIT_SCOPE_LABELS } from '../constants/scopes.ts'

type RecurrenceScopeModalProps = {
  options: readonly EditScope[]
  onSelect: (scope: EditScope) => void
  onClose: () => void
}

export function RecurrenceScopeModal({ options, onSelect, onClose }: RecurrenceScopeModalProps) {
  return (
    <Modal title="Wiederkehrenden Termin ändern" onClose={onClose}>
      <p className="deleteMessage">Für welche Termine der Serie sollen die Änderungen gelten?</p>
      <div className="scopeActions">
        {options.map((scope, index) => (
          <button
            key={scope}
            type="button"
            className="button button--block"
            onClick={() => onSelect(scope)}
            data-autofocus={index === 0 ? true : undefined}
          >
            {EDIT_SCOPE_LABELS[scope]}
          </button>
        ))}
        <button type="button" className="button button--secondary button--block" onClick={onClose}>
          Abbrechen
        </button>
      </div>
    </Modal>
  )
}
