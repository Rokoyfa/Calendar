import type { FieldErrors } from '../../../utils/validation.ts'
import type { AccountDeletionInput, LoginInput, PasswordResetRequestInput, ProfileInput, RegisterInput } from '../types/auth.ts'

export const NAME_MAX_LENGTH = 80
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type NewPasswordValues = {
  password: string
  passwordConfirmation: string
}

export type RegisterFormValues = RegisterInput & NewPasswordValues

export type PasswordChangeFormValues = NewPasswordValues & {
  currentPassword: string
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const validateName = (name: string) => {
  if (!name) return 'Bitte einen Namen eingeben.'
  if (name.length > NAME_MAX_LENGTH) return `Der Name darf höchstens ${NAME_MAX_LENGTH} Zeichen lang sein.`
  return undefined
}

const validateEmail = (email: string) => {
  if (!email) return 'Bitte eine E-Mail-Adresse eingeben.'
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return 'Bitte eine gültige E-Mail-Adresse eingeben.'
  return undefined
}

const requirePassword = (password: string) => (password ? undefined : 'Bitte das Passwort eingeben.')

const validateNewPassword = ({ password, passwordConfirmation }: NewPasswordValues): FieldErrors<NewPasswordValues> => ({
  password:
    password.length < PASSWORD_MIN_LENGTH
      ? `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`
      : password.length > PASSWORD_MAX_LENGTH
        ? `Das Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen lang sein.`
        : undefined,
  passwordConfirmation:
    passwordConfirmation === password ? undefined : 'Die Passwörter stimmen nicht überein.',
})

export const validateLogin = ({ email, password }: LoginInput): FieldErrors<LoginInput> => ({
  email: validateEmail(email),
  password: requirePassword(password),
})

export const validateRegister = (values: RegisterFormValues): FieldErrors<RegisterFormValues> => ({
  name: validateName(values.name),
  email: validateEmail(values.email),
  ...validateNewPassword(values),
})

export const validateProfile = ({ name }: ProfileInput): FieldErrors<ProfileInput> => ({ name: validateName(name) })

export const validatePasswordResetRequest = ({
  email,
}: PasswordResetRequestInput): FieldErrors<PasswordResetRequestInput> => ({ email: validateEmail(email) })

export const validatePasswordReset = validateNewPassword

export const validatePasswordChange = (values: PasswordChangeFormValues): FieldErrors<PasswordChangeFormValues> => {
  const errors = { currentPassword: requirePassword(values.currentPassword), ...validateNewPassword(values) }
  if (!errors.password && values.password === values.currentPassword)
    errors.password = 'Das neue Passwort muss sich vom aktuellen unterscheiden.'
  return errors
}

export const validateAccountDeletion = ({ password }: AccountDeletionInput): FieldErrors<AccountDeletionInput> => ({
  password: requirePassword(password),
})
