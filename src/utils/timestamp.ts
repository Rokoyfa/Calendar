const formatters = new Map<string, Intl.DateTimeFormat>()

export const formatTimestamp = (iso: string, locale: string, timeZone: string) => {
  const key = `${locale}|${timeZone}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone })
    formatters.set(key, formatter)
  }
  return formatter.format(new Date(iso))
}
