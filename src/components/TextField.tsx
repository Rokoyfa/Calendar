import type { InputHTMLAttributes, ReactNode } from 'react'
import { EMAIL_MAX_LENGTH } from '../utils/validation.ts'
import { FormField } from './FormField.tsx'
import { Input } from './Input.tsx'

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string
  value: string
  error?: string
  addon?: ReactNode
  onChange: (value: string) => void
}

export function TextField({ label, error, addon, onChange, className, ...inputProps }: TextFieldProps) {
  const input = (
    <Input
      {...inputProps}
      className={className}
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

export function UrlField(props: Omit<TextFieldProps, 'type'>) {
  return (
    <TextField type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://" {...props} />
  )
}

export function EmailTextField(props: Omit<TextFieldProps, 'type'>) {
  return (
    <TextField
      type="email"
      inputMode="email"
      autoComplete="off"
      spellCheck={false}
      maxLength={EMAIL_MAX_LENGTH}
      {...props}
    />
  )
}
