export const isIntegerInRange = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
