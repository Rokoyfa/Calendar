import type { ReactNode } from 'react'
import { useAsyncAction } from '../hooks/useAsyncAction.ts'
import { Button } from './Button.tsx'
import { Modal } from './Modal.tsx'
import { ActionFeedback } from './StatusMessage.tsx'

type ConfirmModalProps = {
  title: string
  confirmLabel: string
  pendingLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
  children: ReactNode
}

export function ConfirmModal({ title, confirmLabel, pendingLabel, onConfirm, onClose, children }: ConfirmModalProps) {
  const { run, isPending, error } = useAsyncAction(onConfirm)

  return (
    <Modal title={title} variant="danger" onClose={onClose}>
      <div className="formSection">
        <p className="modalMessage">{children}</p>
        <ActionFeedback error={error} />
        <div className="formActions">
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Abbrechen
          </Button>
          <Button variant="danger" isPending={isPending} pendingLabel={pendingLabel} onClick={() => void run()}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
