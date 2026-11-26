import { CALENDAR_VIEWS, type CalendarView } from '../utils/calendarView.ts'

export const STORAGE_MODES = ['local', 'remote'] as const

export type StorageMode = (typeof STORAGE_MODES)[number]

export const HOLIDAY_SOURCES = ['library', 'backend'] as const

export type HolidaySource = (typeof HOLIDAY_SOURCES)[number]

export const DEFAULT_FEATURES = {
  auth: false,
  teams: true,
  chat: true,
  attendees: true,
  recurrence: true,
  reminders: true,
  links: true,
  mapLinks: true,
  holidays: true,
  search: true,
  undo: true,
  duplicate: true,
  shortcuts: true,
  subscriptions: true,
  importExport: true,
  emailNotifications: true,
  timeZones: true,
  customColors: true,
  categories: true,
  publicLinks: true,
  attachments: true,
  liveUpdates: true,
  trash: true,
  dataExport: true,
  registration: true,
  twoFactor: true,
  externalCalendars: true,
  history: true,
  notifications: true,
  caldav: true,
  caldavAccounts: true,
  overlapWarnings: true,
  print: true,
  bookingPages: true,
  personalSharing: true,
  tasks: true,
  freeBusy: true,
  push: true,
}

export type CalendarFeatures = typeof DEFAULT_FEATURES

export type CalendarFeature = keyof CalendarFeatures

export const FEATURE_NAMES = Object.keys(DEFAULT_FEATURES) as CalendarFeature[]

const TEAM_FEATURES: readonly CalendarFeature[] = ['chat', 'attendees']

export const resolveFeatures = (features: Partial<CalendarFeatures> = {}): CalendarFeatures => {
  const resolved = { ...DEFAULT_FEATURES }
  for (const name of FEATURE_NAMES) {
    const value = features[name]
    if (typeof value === 'boolean') resolved[name] = value
  }
  if (!resolved.teams) for (const name of TEAM_FEATURES) resolved[name] = false
  return resolved
}

export const resolveViews = (
  views: readonly CalendarView[] | undefined,
  features: Pick<CalendarFeatures, 'tasks'> = DEFAULT_FEATURES,
): readonly CalendarView[] => {
  const available = features.tasks ? CALENDAR_VIEWS : CALENDAR_VIEWS.filter((view) => view !== 'tasks')
  const enabled = available.filter((view) => views?.includes(view))
  return enabled.length > 0 ? enabled : available
}

export type CalendarConfig = {
  storageMode: StorageMode
  apiBaseUrl: string
  apiTimeoutMs: number
  features: CalendarFeatures
}

export const DEFAULT_CONFIG: CalendarConfig = {
  storageMode: 'local',
  apiBaseUrl: '/api',
  apiTimeoutMs: 10_000,
  features: DEFAULT_FEATURES,
}
