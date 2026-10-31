import { Modal } from '../../../components/Modal.tsx'
import type { EditScope } from '../../../utils/event.ts'

type RecurrenceScopeModalProps = {
  onSelect: (scope: EditScope) => void
  onClose: () => void
}

export function RecurrenceScopeModal({ onSelect, onClose }: RecurrenceScopeModalProps) {
  return (
    <Modal title="Wiederkehrenden Termin ändern" onClose={onClose}>
      <p className="deleteMessage">Sollen die Änderungen nur für diesen Termin oder für alle Termine der Serie gelten?</p>
      <div className="modalActions">
        <button type="button" className="button" onClick={() => onSelect('single')} data-autofocus>
          Nur dieser Termin
        </button>
        <button type="button" className="button" onClick={() => onSelect('all')}>
          Alle Termine
        </button>
        <button type="button" className="button button--secondary" onClick={onClose}>
          Abbrechen
        </button>
      </div>
    </Modal>
  )
}
