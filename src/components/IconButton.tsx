import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

type IconButtonProps = {
  label: string
  title?: string
  plain?: boolean
  onClick: () => void
  children: ReactNode
}

export function IconButton({ label, title = label, plain, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      className={classNames('iconButton', plain && 'iconButton--plain')}
      aria-label={label}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
