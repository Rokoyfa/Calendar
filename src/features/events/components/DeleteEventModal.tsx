import { useI18n } from '../../../i18n/index.ts'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import type { EditScope, EventOccurrence } from '../../../utils/event.ts'
import { getScopeOptions } from '../utils/scopeOptions.ts'
import { Button } from '../../../components/Button.tsx'
import { ScopeButtons } from './ScopeButtons.tsx'

type DeleteEventModalProps = {
  occurrence: EventOccurrence
  onConfirm: (scope: EditScope) => Promise<void>
  onClose: () => void
}

export function DeleteEventModal({ occurrence, onConfirm, onClose }: DeleteEventModalProps) {
  const { m } = useI18n()
  const { run, isPending, error } = useAsyncAction(onConfirm)
  const options = getScopeOptions(occurrence)
  const isSeries = options.length > 1

  return (
    <Modal title={m.events.deleteTitle} variant="danger" onClose={onClose}>
      <p className="modalMessage">
        {isSeries ? m.events.deleteSeriesMessage(occurrence.title) : m.events.deleteMessage(occurrence.title)}
      </p>
      <ErrorMessage message={error} />
      {isSeries ? (
        <ScopeButtons
          options={options}
          variant="danger"
          disabled={isPending}
          onSelect={(scope) => void run(scope)}
          onCancel={onClose}
        />
      ) : (
        <div className="modalActions">
          <Button variant="danger" isPending={isPending} onClick={() => void run(options[0])}>
            {m.common.delete}
          </Button>
          <Button variant="secondary" onClick={onClose} data-autofocus>
            {m.common.cancel}
          </Button>
        </div>
      )}
    </Modal>
  )
}
