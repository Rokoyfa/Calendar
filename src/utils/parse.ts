import { AppError } from './appError.ts'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

export const textOrEmpty = (value: unknown) => (typeof value === 'string' ? value : '')

export const textOrNull = (value: unknown) => (typeof value === 'string' ? value : null)

export const filledTextOrNull = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

export const isPresent = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined

export const parseList = <T>(value: unknown, parseItem: (item: unknown) => T | null): T[] =>
  Array.isArray(value) ? value.map(parseItem).filter(isPresent) : []

export const requireValue = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new AppError('unknown')
  return value
}
