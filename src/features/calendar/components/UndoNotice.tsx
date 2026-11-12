import { useEffect } from 'react'
import { useI18n } from '../../../i18n/index.ts'

const VISIBLE_MS = 8000
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

type UndoNoticeProps = {
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export function UndoNotice({ message, onUndo, onDismiss }: UndoNoticeProps) {
  const { m } = useI18n()

  useEffect(() => {
    const timeout = setTimeout(onDismiss, VISIBLE_MS)
    return () => clearTimeout(timeout)
  }, [onDismiss])

  return (
    <div className="undoNotice" role="status">
      <span className="undoNoticeText">{message}</span>
      <button
        type="button"
        className="undoNoticeAction"
        title={`${m.calendar.undo.action} (${isMac ? '⌘Z' : m.calendar.undo.ctrlZ})`}
        onClick={onUndo}
      >
        {m.calendar.undo.action}
      </button>
      <button type="button" className="closeButton" aria-label={m.calendar.dismiss} onClick={onDismiss}>
        ×
      </button>
    </div>
  )
}
