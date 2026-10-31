export const isIntegerInRange = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max

export const integerRangeMessage = (min: number, max: number) => `Bitte eine ganze Zahl von ${min} bis ${max} eingeben.`
