import { useCallback, type ReactNode } from 'react'
import { useI18n } from '../i18n/index.ts'
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
  tone?: 'danger' | 'neutral'
  details?: ReactNode
  children: ReactNode
}

export function ConfirmModal({
  title,
  confirmLabel,
  pendingLabel,
  onConfirm,
  onClose,
  tone = 'danger',
  details,
  children,
}: ConfirmModalProps) {
  const isDanger = tone === 'danger'
  const { m } = useI18n()
  const confirm = useCallback(async () => {
    await onConfirm()
    onClose()
  }, [onConfirm, onClose])
  const { run, isPending, error } = useAsyncAction(confirm)

  return (
    <Modal title={title} variant={isDanger ? 'danger' : undefined} onClose={onClose}>
      <div className="formSection">
        <p className="modalMessage">{children}</p>
        {details}
        <ActionFeedback error={error} />
        <div className="formActions">
          <Button variant="secondary" onClick={onClose} data-autofocus>
            {m.common.cancel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : undefined}
            isPending={isPending}
            pendingLabel={pendingLabel}
            onClick={() => void run()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
