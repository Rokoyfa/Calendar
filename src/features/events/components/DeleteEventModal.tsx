import { useI18n } from '../../../i18n/index.ts'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import type { EditScope, EventOccurrence } from '../../../utils/event.ts'
import { getScopeOptions } from '../utils/scopeOptions.ts'
import { ScopeButtons } from './ScopeButtons.tsx'

type DeleteEventModalProps = {
  occurrence: EventOccurrence
  onConfirm: (scope: EditScope) => Promise<void>
  onClose: () => void
}

export function DeleteEventModal({ occurrence, onConfirm, onClose }: DeleteEventModalProps) {
  const { m } = useI18n()
  const { run, isPending, error } = useAsyncAction(onConfirm)

  return (
    <Modal title={m.events.deleteTitle} variant="danger" onClose={onClose}>
      <p className="modalMessage">{m.events.deleteSeriesMessage(occurrence.title)}</p>
      <ErrorMessage message={error} />
      <ScopeButtons
        options={getScopeOptions(occurrence)}
        variant="danger"
        disabled={isPending}
        onSelect={(scope) => void run(scope)}
        onCancel={onClose}
      />
    </Modal>
  )
}
