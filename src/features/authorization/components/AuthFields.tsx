import { useI18n } from '../../../i18n/index.ts'
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
  const { m } = useI18n()
  return <TextField {...props} label={m.auth.name} name="name" autoComplete="name" maxLength={NAME_MAX_LENGTH} />
}

export function EmailField({ isNewAccount = false, ...props }: FieldProps & { isNewAccount?: boolean }) {
  const { m } = useI18n()
  return (
    <TextField
      {...props}
      label={m.auth.email}
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

export function CurrentPasswordField({ label, name = 'password', ...props }: CurrentPasswordFieldProps) {
  const { m } = useI18n()
  return (
    <PasswordField
      {...props}
      label={label ?? m.auth.password}
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

export function NewPasswordFields({ values, errors, label, onChange }: NewPasswordFieldsProps) {
  const { m } = useI18n()
  const passwordLabel = label ?? m.auth.password
  const fields = [
    { name: 'password', label: passwordLabel },
    { name: 'passwordConfirmation', label: m.auth.repeat(passwordLabel) },
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
      <p className="formHint">{m.auth.passwordHint(PASSWORD_MIN_LENGTH)}</p>
    </>
  )
}
