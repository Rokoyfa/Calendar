import { useI18n } from '../../../i18n/index.ts'
import { Modal } from '../../../components/Modal.tsx'
import type { EditScope } from '../../../utils/event.ts'
import { ScopeButtons } from './ScopeButtons.tsx'

type RecurrenceScopeModalProps = {
  options: readonly EditScope[]
  onSelect: (scope: EditScope) => void
  onClose: () => void
}

export function RecurrenceScopeModal({ options, onSelect, onClose }: RecurrenceScopeModalProps) {
  const { m } = useI18n()
  return (
    <Modal title={m.events.scopeTitle} onClose={onClose}>
      <p className="modalMessage">{m.events.scopeMessage}</p>
      <ScopeButtons options={options} onSelect={onSelect} onCancel={onClose} />
    </Modal>
  )
}
