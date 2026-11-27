import type { ChangeEvent, ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'
import { FileInput } from './Input.tsx'

type FileButtonProps = {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline'
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  children: ReactNode
}

export function FileButton({ accept, multiple, disabled, variant = 'outline', onChange, children }: FileButtonProps) {
  return (
    <label className={classNames('button', variant === 'outline' && 'button--outline', disabled && 'isDisabled')}>
      {children}
      <FileInput accept={accept} multiple={multiple} disabled={disabled} onChange={onChange} />
    </label>
  )
}
