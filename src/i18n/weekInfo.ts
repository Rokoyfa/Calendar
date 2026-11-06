export type WeekInfo = {
  firstDay: number
  minimalDays: number
}

type IntlWeekInfo = { firstDay: number; minimalDays?: number }

type LocaleWithWeekInfo = Intl.Locale & {
  getWeekInfo?: () => IntlWeekInfo
  weekInfo?: IntlWeekInfo
}

const SUNDAY_FIRST_REGIONS = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'IL', 'PH', 'KR', 'TW', 'HK', 'IN', 'ZA'])

const ISO_WEEK: WeekInfo = { firstDay: 1, minimalDays: 4 }

const SUNDAY_WEEK: WeekInfo = { firstDay: 0, minimalDays: 1 }

const fromIntl = (locale: LocaleWithWeekInfo): WeekInfo | null => {
  const info = locale.getWeekInfo?.() ?? locale.weekInfo
  if (!info) return null
  const firstDay = info.firstDay % 7
  return { firstDay, minimalDays: info.minimalDays ?? (firstDay === ISO_WEEK.firstDay ? ISO_WEEK : SUNDAY_WEEK).minimalDays }
}

export function getWeekInfo(tag: string): WeekInfo {
  const locale = new Intl.Locale(tag).maximize() as LocaleWithWeekInfo
  return fromIntl(locale) ?? (SUNDAY_FIRST_REGIONS.has(locale.region ?? '') ? SUNDAY_WEEK : ISO_WEEK)
}
