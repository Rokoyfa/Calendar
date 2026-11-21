export const plural = (count: number, one: string, few: string, many: string) => {
  if (count === 1) return one
  const lastDigit = count % 10
  const lastTwo = count % 100
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many
}

export const FEW_UNITS: Record<string, string> = { dni: 'dni', tygodni: 'tygodnie', miesięcy: 'miesiące', lat: 'lata' }
