import { isCalendarView, type CalendarView } from './calendarView.ts'
import { asRecord, isOneOf } from './object.ts'

export const THEMES = ['system', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  system: 'Wie System',
  light: 'Hell',
  dark: 'Dunkel',
}

export type Preferences = {
  theme: Theme
  defaultView: CalendarView
  mobileDefaultView: CalendarView
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  defaultView: 'week',
  mobileDefaultView: 'day',
}

export const MOBILE_MEDIA_QUERY = '(max-width: 700px)'

export const parsePreferences = (value: unknown): Preferences => {
  const { theme, defaultView, mobileDefaultView } = asRecord(value)
  return {
    theme: isOneOf(THEMES, theme) ? theme : DEFAULT_PREFERENCES.theme,
    defaultView: isCalendarView(defaultView) ? defaultView : DEFAULT_PREFERENCES.defaultView,
    mobileDefaultView: isCalendarView(mobileDefaultView) ? mobileDefaultView : DEFAULT_PREFERENCES.mobileDefaultView,
  }
}

export const getStartView = ({ defaultView, mobileDefaultView }: Preferences, isMobile: boolean) =>
  isMobile ? mobileDefaultView : defaultView
