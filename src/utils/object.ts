export const pick = <T extends object, K extends keyof T>(source: T, keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, source[key]])) as Pick<T, K>

export const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  values.includes(value as T)

export const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
