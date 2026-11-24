import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

type IconButtonProps = {
  label: string
  title?: string
  plain?: boolean
  disabled?: boolean
  opensDialog?: boolean
  expanded?: boolean
  onClick: () => void
  children: ReactNode
}

export function IconButton({
  label,
  title = label,
  plain,
  disabled,
  opensDialog,
  expanded,
  onClick,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={classNames('iconButton', plain && 'iconButton--plain')}
      aria-label={label}
      title={title}
      disabled={disabled}
      aria-haspopup={opensDialog ? 'dialog' : undefined}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
