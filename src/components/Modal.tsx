import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { classNames } from '../utils/classNames.ts'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  variant?: 'default' | 'danger'
  size?: 'default' | 'large'
}

export function Modal({ title, onClose, children, variant = 'default', size = 'default' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => dialog.close()
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classNames('modal', variant === 'danger' && 'modal--danger', size === 'large' && 'modal--large')}
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
    </dialog>,
    document.body,
  )
}
