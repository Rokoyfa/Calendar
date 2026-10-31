import { Modal } from '../../../components/Modal.tsx'
import type { EditScope } from '../../../utils/event.ts'
import { ScopeButtons } from './ScopeButtons.tsx'

type RecurrenceScopeModalProps = {
  options: readonly EditScope[]
  onSelect: (scope: EditScope) => void
  onClose: () => void
}

export function RecurrenceScopeModal({ options, onSelect, onClose }: RecurrenceScopeModalProps) {
  return (
    <Modal title="Wiederkehrenden Termin ändern" onClose={onClose}>
      <p className="modalMessage">Für welche Termine der Serie sollen die Änderungen gelten?</p>
      <ScopeButtons options={options} onSelect={onSelect} onCancel={onClose} />
    </Modal>
  )
}
