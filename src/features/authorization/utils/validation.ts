import type { FieldErrors } from '../../../utils/validation.ts'
import type { LoginInput, RegisterInput } from '../types/auth.ts'

export const NAME_MAX_LENGTH = 80
export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type RegisterFormValues = RegisterInput & { passwordConfirmation: string }

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const validateEmail = (email: string) => {
  if (!email) return 'Bitte eine E-Mail-Adresse eingeben.'
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return 'Bitte eine gültige E-Mail-Adresse eingeben.'
  return undefined
}

export const validateLogin = ({ email, password }: LoginInput): FieldErrors<LoginInput> => ({
  email: validateEmail(email),
  password: password ? undefined : 'Bitte das Passwort eingeben.',
})

export const validateRegister = ({
  name,
  email,
  password,
  passwordConfirmation,
}: RegisterFormValues): FieldErrors<RegisterFormValues> => ({
  name: !name
    ? 'Bitte einen Namen eingeben.'
    : name.length > NAME_MAX_LENGTH
      ? `Der Name darf höchstens ${NAME_MAX_LENGTH} Zeichen lang sein.`
      : undefined,
  email: validateEmail(email),
  password:
    password.length < PASSWORD_MIN_LENGTH
      ? `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`
      : password.length > PASSWORD_MAX_LENGTH
        ? `Das Passwort darf höchstens ${PASSWORD_MAX_LENGTH} Zeichen lang sein.`
        : undefined,
  passwordConfirmation:
    passwordConfirmation === password ? undefined : 'Die Passwörter stimmen nicht überein.',
})
