import { useState } from 'react'
import { Modal } from '../../../components/Modal.tsx'
import { getErrorMessage } from '../../../utils/error.ts'
import type { CalendarEvent, EditScope } from '../../../utils/event.ts'

type DeleteEventModalProps = {
  event: CalendarEvent
  onConfirm: (scope: EditScope) => Promise<void>
  onClose: () => void
}

export function DeleteEventModal({ event, onConfirm, onClose }: DeleteEventModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const isRecurring = event.recurrence !== null

  const handleConfirm = async (scope: EditScope) => {
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm(scope)
    } catch (reason) {
      setError(getErrorMessage(reason))
      setIsDeleting(false)
    }
  }

  return (
    <Modal title="Termin löschen?" variant="danger" onClose={onClose}>
      <p className="deleteMessage">
        {isRecurring
          ? `„${event.title}“ ist ein wiederkehrender Termin. Was soll gelöscht werden? Das kann nicht rückgängig gemacht werden.`
          : `Soll „${event.title}“ wirklich gelöscht werden? Das kann nicht rückgängig gemacht werden.`}
      </p>

      {error && (
        <p className="errorText" role="alert">
          {error}
        </p>
      )}

      {isRecurring ? (
        <div className="modalActions">
          <button
            type="button"
            className="button button--danger"
            disabled={isDeleting}
            onClick={() => void handleConfirm('single')}
          >
            Nur dieser Termin
          </button>
          <button
            type="button"
            className="button button--danger"
            disabled={isDeleting}
            onClick={() => void handleConfirm('all')}
          >
            Alle Termine
          </button>
          <button type="button" className="button button--secondary" onClick={onClose} data-autofocus>
            Abbrechen
          </button>
        </div>
      ) : (
        <div className="modalActions modalActions--split">
          <button
            type="button"
            className="button button--danger"
            disabled={isDeleting}
            onClick={() => void handleConfirm('all')}
          >
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
