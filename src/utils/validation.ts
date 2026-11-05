export type FieldErrors<T> = Partial<Record<keyof T, string>>

export const hasFieldErrors = (errors: object) => Object.values(errors).some(Boolean)

export const EMAIL_MAX_LENGTH = 254

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const validateEmail = (email: string) => {
  if (!email) return 'Bitte eine E-Mail-Adresse eingeben.'
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return 'Bitte eine gültige E-Mail-Adresse eingeben.'
  return undefined
}
