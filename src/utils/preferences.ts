import { AUTO_LOCALE, canonicalizeLocale } from '../i18n/locale.ts'
import { isCalendarView, type CalendarView } from './calendarView.ts'
import { asRecord, isOneOf } from './object.ts'
import { HOLIDAYS_AUTO, isHolidaySetting } from './holidays.ts'
import { isTimeZone } from './timeZone.ts'

export const THEMES = ['system', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export const AUTO_TIME_ZONE = 'auto'

export type Preferences = {
  theme: Theme
  defaultView: CalendarView
  mobileDefaultView: CalendarView
  locale: string
  timeZone: string
  holidays: string
  emailInvites: boolean
  emailChanges: boolean
  emailReminders: boolean
  emailChat: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  defaultView: 'week',
  mobileDefaultView: 'day',
  locale: 'auto',
  timeZone: AUTO_TIME_ZONE,
  holidays: HOLIDAYS_AUTO,
  emailInvites: true,
  emailChanges: true,
  emailReminders: false,
  emailChat: true,
}

const COMPACT_MAX_WIDTH = 700

export const isCompactWidth = (width: number) => width <= COMPACT_MAX_WIDTH

export const parsePreferences = (value: unknown): Preferences => {
  const {
    theme,
    defaultView,
    mobileDefaultView,
    locale,
    timeZone,
    holidays,
    emailInvites,
    emailChanges,
    emailReminders,
    emailChat,
  } = asRecord(value)
  return {
    theme: isOneOf(THEMES, theme) ? theme : DEFAULT_PREFERENCES.theme,
    defaultView: isCalendarView(defaultView) ? defaultView : DEFAULT_PREFERENCES.defaultView,
    mobileDefaultView: isCalendarView(mobileDefaultView) ? mobileDefaultView : DEFAULT_PREFERENCES.mobileDefaultView,
    locale: locale === AUTO_LOCALE ? AUTO_LOCALE : (canonicalizeLocale(locale) ?? DEFAULT_PREFERENCES.locale),
    timeZone: isTimeZone(timeZone) ? timeZone : AUTO_TIME_ZONE,
    holidays: isHolidaySetting(holidays) ? holidays : HOLIDAYS_AUTO,
    emailInvites: typeof emailInvites === 'boolean' ? emailInvites : DEFAULT_PREFERENCES.emailInvites,
    emailChanges: typeof emailChanges === 'boolean' ? emailChanges : DEFAULT_PREFERENCES.emailChanges,
    emailReminders: typeof emailReminders === 'boolean' ? emailReminders : DEFAULT_PREFERENCES.emailReminders,
    emailChat: typeof emailChat === 'boolean' ? emailChat : DEFAULT_PREFERENCES.emailChat,
  }
}

export const getStartView = ({ defaultView, mobileDefaultView }: Preferences, isMobile: boolean) =>
  isMobile ? mobileDefaultView : defaultView
