import { useEffect, useId, useRef, type ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  variant?: 'default' | 'danger'
}

export function Modal({ title, onClose, children, variant = 'default' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={classNames('modal', variant === 'danger' && 'modal--danger')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modalContent">
        <header className="modalHeader">
          <h2 id={titleId} className="modalTitle">
            {title}
          </h2>
          <button type="button" className="closeButton" aria-label="Schließen" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
