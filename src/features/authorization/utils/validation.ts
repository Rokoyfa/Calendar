import type { Messages } from '../../../i18n/index.ts'
import { validateEmail, type FieldErrors } from '../../../utils/validation.ts'
import type { AccountDeletionInput, LoginInput, PasswordResetRequestInput, ProfileInput, RegisterInput } from '../types/auth.ts'

export { EMAIL_MAX_LENGTH, normalizeEmail } from '../../../utils/validation.ts'

export const NAME_MAX_LENGTH = 80
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

export type NewPasswordValues = {
  password: string
  passwordConfirmation: string
}

export type RegisterFormValues = RegisterInput & NewPasswordValues

export type PasswordChangeFormValues = NewPasswordValues & {
  currentPassword: string
}

const validateName = (name: string, m: Messages) => {
  if (!name) return m.auth.validation.nameRequired
  if (name.length > NAME_MAX_LENGTH) return m.auth.validation.nameTooLong(NAME_MAX_LENGTH)
  return undefined
}

const requirePassword = (password: string, m: Messages) => (password ? undefined : m.auth.validation.passwordRequired)

const validateNewPassword = (
  { password, passwordConfirmation }: NewPasswordValues,
  m: Messages,
): FieldErrors<NewPasswordValues> => ({
  password:
    password.length < PASSWORD_MIN_LENGTH
      ? m.auth.validation.passwordTooShort(PASSWORD_MIN_LENGTH)
      : password.length > PASSWORD_MAX_LENGTH
        ? m.auth.validation.passwordTooLong(PASSWORD_MAX_LENGTH)
        : undefined,
  passwordConfirmation: passwordConfirmation === password ? undefined : m.auth.validation.passwordMismatch,
})

export const validateLogin = ({ email, password }: LoginInput, m: Messages): FieldErrors<LoginInput> => ({
  email: validateEmail(email, m),
  password: requirePassword(password, m),
})

export const validateRegister = (values: RegisterFormValues, m: Messages): FieldErrors<RegisterFormValues> => ({
  name: validateName(values.name, m),
  email: validateEmail(values.email, m),
  ...validateNewPassword(values, m),
})

export const validateProfile = ({ name }: ProfileInput, m: Messages): FieldErrors<ProfileInput> => ({
  name: validateName(name, m),
})

export const validatePasswordResetRequest = (
  { email }: PasswordResetRequestInput,
  m: Messages,
): FieldErrors<PasswordResetRequestInput> => ({ email: validateEmail(email, m) })

export const validatePasswordReset = validateNewPassword

export const validatePasswordChange = (
  values: PasswordChangeFormValues,
  m: Messages,
): FieldErrors<PasswordChangeFormValues> => {
  const errors = { currentPassword: requirePassword(values.currentPassword, m), ...validateNewPassword(values, m) }
  if (!errors.password && values.password === values.currentPassword)
    errors.password = m.auth.validation.passwordUnchanged
  return errors
}

export const validateAccountDeletion = (
  { password }: AccountDeletionInput,
  m: Messages,
): FieldErrors<AccountDeletionInput> => ({
  password: requirePassword(password, m),
})
