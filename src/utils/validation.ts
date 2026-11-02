export type FieldErrors<T> = Partial<Record<keyof T, string>>

export const hasFieldErrors = (errors: object) => Object.values(errors).some(Boolean)
