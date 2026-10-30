import { useState } from 'react'
import { Modal } from '../../../components/Modal.tsx'
import { getErrorMessage } from '../../../utils/error.ts'
import type { CalendarEvent } from '../../../utils/event.ts'

type DeleteEventModalProps = {
  event: CalendarEvent
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function DeleteEventModal({ event, onConfirm, onClose }: DeleteEventModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (reason) {
      setError(getErrorMessage(reason))
      setIsDeleting(false)
    }
  }

  return (
    <Modal title="Termin löschen?" variant="danger" onClose={onClose}>
      <p className="deleteMessage">
        Soll „{event.title}“ wirklich gelöscht werden? Das kann nicht rückgängig gemacht werden.
      </p>

      {error && (
        <p className="errorText" role="alert">
          {error}
        </p>
      )}

      <div className="modalActions modalActions--split">
        <button
          type="button"
          className="button button--danger"
          disabled={isDeleting}
          onClick={() => void handleConfirm()}
        >
          Ja
        </button>
        <button type="button" className="button button--success" onClick={onClose} data-autofocus>
          Nein
        </button>
      </div>
    </Modal>
  )
}
