import { PasswordField } from '../../../components/PasswordField.tsx'
import type { FieldErrors } from '../../../utils/validation.ts'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type NewPasswordValues } from '../utils/validation.ts'

type NewPasswordFieldsProps = {
  values: NewPasswordValues
  errors: FieldErrors<NewPasswordValues>
  label?: string
  onChange: (field: keyof NewPasswordValues, value: string) => void
}

export function NewPasswordFields({ values, errors, label = 'Passwort', onChange }: NewPasswordFieldsProps) {
  return (
    <>
      <PasswordField
        label={label}
        name="password"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={values.password}
        error={errors.password}
        onChange={(password) => onChange('password', password)}
      />
      <PasswordField
        label={`${label} wiederholen`}
        name="passwordConfirmation"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX_LENGTH}
        value={values.passwordConfirmation}
        error={errors.passwordConfirmation}
        onChange={(confirmation) => onChange('passwordConfirmation', confirmation)}
      />
      <p className="formHint">Mindestens {PASSWORD_MIN_LENGTH} Zeichen.</p>
    </>
  )
}
