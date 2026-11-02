import type { InputHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'
import { FormField } from './FormField.tsx'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string
  value: string
  error?: string
  addon?: ReactNode
  onChange: (value: string) => void
}

export function TextField({ label, error, addon, onChange, className, ...inputProps }: TextFieldProps) {
  const input = (
    <input
      {...inputProps}
      className={classNames('input', className)}
      aria-invalid={Boolean(error)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
  return (
    <FormField label={label} error={error}>
      {addon ? (
        <span className="inlineField">
          {input}
          {addon}
        </span>
      ) : (
        input
      )}
    </FormField>
  )
}
