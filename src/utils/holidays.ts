export const HOLIDAYS_AUTO = 'auto'
export const HOLIDAYS_OFF = 'off'

const REGION_PATTERN = /^[A-Z]{2}(-[A-Z0-9]{1,6})?$/

export type PublicHoliday = { date: string; name: string }

export const isHolidayRegion = (value: unknown): value is string =>
  typeof value === 'string' && REGION_PATTERN.test(value)

export const isHolidaySetting = (value: unknown): value is string =>
  value === HOLIDAYS_AUTO || value === HOLIDAYS_OFF || isHolidayRegion(value)

export const toHolidayRegion = (country: string, state?: string | null) => (state ? `${country}-${state}` : country)

export const splitHolidayRegion = (region: string) => {
  const [country, state = null] = region.split('-')
  return { country, state }
}

export const getLocaleRegion = (locale: string) => {
  try {
    return new Intl.Locale(locale).maximize().region ?? null
  } catch {
    return null
  }
}

export const getHostHolidayRegion = (hostValue: string | undefined, locale: string) => {
  if (hostValue === HOLIDAYS_OFF) return null
  if (isHolidayRegion(hostValue)) return hostValue
  return getLocaleRegion(locale)
}

export const resolveHolidayRegion = (setting: string, hostValue: string | undefined, locale: string) => {
  if (setting === HOLIDAYS_OFF) return null
  if (isHolidayRegion(setting)) return setting
  return getHostHolidayRegion(hostValue, locale)
}

export const parsePublicHolidays = (value: unknown): PublicHoliday[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        if (typeof entry !== 'object' || entry === null) return []
        const { date, name } = entry as Record<string, unknown>
        return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof name === 'string' && name
          ? [{ date, name }]
          : []
      })
    : []

export const groupHolidaysByDate = (holidays: readonly PublicHoliday[]) => {
  const byDate = new Map<string, string[]>()
  for (const { date, name } of holidays) {
    const names = byDate.get(date) ?? []
    if (!names.includes(name)) names.push(name)
    byDate.set(date, names)
  }
  return byDate
}
