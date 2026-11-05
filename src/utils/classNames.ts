export type ClassNameValue = string | false | null | undefined

export const classNames = (...names: readonly ClassNameValue[]) => names.filter(Boolean).join(' ')
