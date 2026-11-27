import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '../utils/classNames.ts'

type MoreButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>

export function MoreButton({ className, ...buttonProps }: MoreButtonProps) {
  return <button {...buttonProps} type="button" className={classNames('moreEvents', className)} />
}
