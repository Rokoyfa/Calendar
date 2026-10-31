import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
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

const IRREVERSIBLE = 'Das kann nicht rückgängig gemacht werden.'

export function DeleteEventModal({ occurrence, onConfirm, onClose }: DeleteEventModalProps) {
  const { run, isPending, error } = useAsyncAction(onConfirm)
  const options = getScopeOptions(occurrence)
  const isSeries = options.length > 1

  return (
    <Modal title="Termin löschen?" variant="danger" onClose={onClose}>
      <p className="modalMessage">
        {isSeries
          ? `„${occurrence.title}“ ist ein wiederkehrender Termin. Was soll gelöscht werden? ${IRREVERSIBLE}`
          : `Soll „${occurrence.title}“ wirklich gelöscht werden? ${IRREVERSIBLE}`}
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
        <div className="modalActions modalActions--split">
          <button type="button" className="button button--danger" disabled={isPending} onClick={() => void run('all')}>
            Ja
          </button>
          <button type="button" className="button button--success" onClick={onClose} data-autofocus>
            Nein
          </button>
        </div>
      )}
    </Modal>
  )
}
