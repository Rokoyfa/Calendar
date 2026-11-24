import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRootElement } from '../context/RootElementContext.ts'
import { classNames } from '../utils/classNames.ts'
import { useI18n } from '../i18n/index.ts'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  variant?: 'default' | 'danger'
  size?: 'default' | 'large'
  placement?: 'center' | 'start'
}

export function Modal({
  title,
  onClose,
  children,
  variant = 'default',
  size = 'default',
  placement = 'center',
}: ModalProps) {
  const { m } = useI18n()
  const root = useRootElement()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const rootNode = dialog.getRootNode() as Document | ShadowRoot
    const previous = rootNode.activeElement instanceof HTMLElement ? rootNode.activeElement : null
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => {
      dialog.close()
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classNames(
        'modal',
        variant === 'danger' && 'modal--danger',
        size === 'large' && 'modal--large',
        placement === 'start' && 'modal--start',
      )}
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
        <div className="modalHeader">
          <h2 id={titleId} className="modalTitle">
            {title}
          </h2>
          <button type="button" className="closeButton" aria-label={m.common.close} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>,
    root,
  )
}
