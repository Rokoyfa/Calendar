import type { CSSProperties, ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

type ChoiceChipProps = {
  type: 'radio' | 'checkbox'
  label: string
  checked: boolean
  onChange: () => void
  name?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export function ChoiceChip({ type, label, checked, onChange, name, className, style, children }: ChoiceChipProps) {
  return (
    <label className={classNames('chip', className, checked && 'active')} style={style} title={label}>
      <input
        type={type}
        name={name}
        className="visuallyHidden"
        aria-label={label}
        checked={checked}
        onChange={onChange}
      />
      {children}
    </label>
  )
}
