import { PasswordField } from '../../../components/PasswordField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import type { FieldErrors } from '../../../utils/validation.ts'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type NewPasswordValues,
} from '../utils/validation.ts'

type FieldProps = {
  value: string
  error?: string
  onChange: (value: string) => void
  autoFocus?: boolean
}

export function NameField(props: FieldProps) {
  return <TextField {...props} label="Name" name="name" autoComplete="name" maxLength={NAME_MAX_LENGTH} />
}

export function EmailField({ isNewAccount = false, ...props }: FieldProps & { isNewAccount?: boolean }) {
  return (
    <TextField
      {...props}
      label="E-Mail-Adresse"
      name="email"
      type="email"
      inputMode="email"
      autoComplete={isNewAccount ? 'email' : 'username'}
      maxLength={EMAIL_MAX_LENGTH}
    />
  )
}

type CurrentPasswordFieldProps = FieldProps & {
  label?: string
  name?: string
  'data-autofocus'?: boolean
}

export function CurrentPasswordField({ label = 'Passwort', name = 'password', ...props }: CurrentPasswordFieldProps) {
  return (
    <PasswordField
      {...props}
      label={label}
      name={name}
      autoComplete="current-password"
      maxLength={PASSWORD_MAX_LENGTH}
    />
  )
}

type NewPasswordFieldsProps = {
  values: NewPasswordValues
  errors: FieldErrors<NewPasswordValues>
  label?: string
  onChange: (field: keyof NewPasswordValues, value: string) => void
}

export function NewPasswordFields({ values, errors, label = 'Passwort', onChange }: NewPasswordFieldsProps) {
  const fields = [
    { name: 'password', label },
    { name: 'passwordConfirmation', label: `${label} wiederholen` },
  ] as const

  return (
    <>
      {fields.map((field) => (
        <PasswordField
          key={field.name}
          label={field.label}
          name={field.name}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values[field.name]}
          error={errors[field.name]}
          onChange={(value) => onChange(field.name, value)}
        />
      ))}
      <p className="formHint">Mindestens {PASSWORD_MIN_LENGTH} Zeichen.</p>
    </>
  )
}
