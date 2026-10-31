import type { ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

type FormFieldProps = {
  label: string
  error?: string
  as?: 'label' | 'fieldset'
  className?: string
  children: ReactNode
}

export function FormField({ label, error, as: Element = 'label', className, children }: FormFieldProps) {
  const Caption = Element === 'fieldset' ? 'legend' : 'span'
  return (
    <Element className={classNames('field', className)}>
      <Caption className="descriptor">{label}</Caption>
      {children}
      {error && <span className="errorText">{error}</span>}
    </Element>
  )
}
