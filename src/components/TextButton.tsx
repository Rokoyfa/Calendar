import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '../utils/classNames.ts'

type TextButtonVariant = 'link' | 'subtle' | 'danger'

type TextButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: TextButtonVariant
}

export function TextButton({ variant = 'link', className, ...buttonProps }: TextButtonProps) {
  return (
    <button
      {...buttonProps}
      type="button"
      className={classNames('textButton', variant !== 'link' && `textButton--${variant}`, className)}
    />
  )
}
