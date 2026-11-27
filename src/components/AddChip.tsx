import type { ButtonHTMLAttributes } from 'react'
import { classNames } from '../utils/classNames.ts'

type AddChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>

export function AddChip({ className, ...buttonProps }: AddChipProps) {
  return <button {...buttonProps} type="button" className={classNames('categoryChip', 'addChip', className)} />
}
