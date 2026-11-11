import { AUTO_LOCALE, canonicalizeLocale } from '../i18n/locale.ts'
import { isCalendarView, type CalendarView } from './calendarView.ts'
import { asRecord, isOneOf } from './object.ts'

export const THEMES = ['system', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export type Preferences = {
  theme: Theme
  defaultView: CalendarView
  mobileDefaultView: CalendarView
  locale: string
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  defaultView: 'week',
  mobileDefaultView: 'day',
  locale: 'auto',
}

const COMPACT_MAX_WIDTH = 700

export const isCompactWidth = (width: number) => width <= COMPACT_MAX_WIDTH

export const parsePreferences = (value: unknown): Preferences => {
  const { theme, defaultView, mobileDefaultView, locale } = asRecord(value)
  return {
    theme: isOneOf(THEMES, theme) ? theme : DEFAULT_PREFERENCES.theme,
    defaultView: isCalendarView(defaultView) ? defaultView : DEFAULT_PREFERENCES.defaultView,
    mobileDefaultView: isCalendarView(mobileDefaultView) ? mobileDefaultView : DEFAULT_PREFERENCES.mobileDefaultView,
    locale: locale === AUTO_LOCALE ? AUTO_LOCALE : (canonicalizeLocale(locale) ?? DEFAULT_PREFERENCES.locale),
  }
}

export const getStartView = ({ defaultView, mobileDefaultView }: Preferences, isMobile: boolean) =>
  isMobile ? mobileDefaultView : defaultView
