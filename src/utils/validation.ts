import type { Messages } from '../i18n/index.ts'

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export const hasFieldErrors = (errors: object) => Object.values(errors).some(Boolean)

export const EMAIL_MAX_LENGTH = 254

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const validateEmail = (email: string, m: Messages) => {
  if (!email) return m.validation.emailRequired
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return m.validation.emailInvalid
  return undefined
}
