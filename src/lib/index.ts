export { CalendarWidget as Calendar } from './CalendarWidget.tsx'
export { VERSION } from './version.ts'
export { CalendarElement, DEFAULT_ELEMENT_NAME, defineCalendarElement } from './element.tsx'
export type { CalendarFeatures, CalendarProps, CalendarRouting, StorageMode } from './config.ts'
export type { DeletedEvent, EventCallbacks } from './eventCallbacks.ts'
export type { HostTheme } from '../context/HostContext.ts'
export type { CalendarView } from '../utils/calendarView.ts'
export { localDataSource, restDataSource, TENANT_HEADER, tenantDataSource } from '../data/index.ts'
export type {
  CalendarDataSource,
  DataRepositories,
  DataSession,
  DataSourceContext,
  RestDataSourceOptions,
  TenantDataSourceOptions,
} from '../data/index.ts'
export type { AuthMethod, AuthRepository, User, UserTokenProvider } from '../features/authorization/index.ts'
export type {
  CalendarChanges,
  CalendarDraft,
  CalendarRepository,
  CalendarSummary,
  Invitation,
  PendingInvitation,
  TeamChanges,
  TeamInvitation,
  TeamMember,
  TeamRole,
} from '../features/calendars/index.ts'
export type {
  ColorRepository,
  EventQuery,
  EventRepository,
  PreferencesRepository,
} from '../features/storage/index.ts'
export type { CalendarEvent, EventInput } from '../utils/event.ts'
export type { Preferences } from '../utils/preferences.ts'
export type { Recurrence } from '../utils/recurrence.ts'
export type { HexColor } from '../utils/color.ts'
