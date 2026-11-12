const formatters = new Map<string, Intl.DateTimeFormat>()

const formatter = (locale: string, timeZone: string, options: Intl.DateTimeFormatOptions) => {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`
  let cached = formatters.get(key)
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...options, timeZone })
    formatters.set(key, cached)
  }
  return cached
}

export const toLocalDate = (iso: string, timeZone: string) =>
  formatter('en-CA', timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

export const formatMessageTime = (iso: string, locale: string, timeZone: string) =>
  formatter(locale, timeZone, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
