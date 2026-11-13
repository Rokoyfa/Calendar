export { CalendarWidget as Calendar } from './CalendarWidget.tsx'
export { VERSION } from './version.ts'
export { CalendarElement, DEFAULT_ELEMENT_NAME, defineCalendarElement } from './element.tsx'
export { DEFAULT_FEATURES, FEATURE_NAMES, parseCalendarOptions } from './config.ts'
export type {
  CalendarAppearance,
  CalendarConfigSource,
  CalendarHandle,
  CalendarState,
  NewEventDraft,
  CalendarFeature,
  CalendarFeatures,
  CalendarOptions,
  CalendarProps,
  CalendarRouting,
  HolidaySource,
  ParsedOptions,
  StorageMode,
} from './config.ts'
export type { DeletedEvent, EventCallbacks } from './eventCallbacks.ts'
export type { HostTheme } from '../context/HostContext.ts'
export type { CalendarView } from '../utils/calendarView.ts'
export type { DeepPartial, MessageOverrides, Messages, PartialMessages } from '../i18n/index.ts'
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
  CategoryRepository,
  ChatRepository,
  SharedCalendarRepository,
  ColorRepository,
  EventQuery,
  EventRepository,
  EventSearchQuery,
  HolidayQuery,
  HolidayRepository,
  PreferencesRepository,
} from '../features/storage/index.ts'
export type { Attendee, AttendeeStatus, CalendarEvent, EventInput, EventLink } from '../utils/event.ts'
export type { ChatEvent, ChatKey, ChatMessage, ChatPage, ChatUnread } from '../utils/chat.ts'
export type { Category } from '../utils/category.ts'
export type { SharedCalendar } from '../utils/sharedCalendar.ts'
export type { Preferences } from '../utils/preferences.ts'
export type { PublicHoliday } from '../utils/holidays.ts'
export type { Recurrence } from '../utils/recurrence.ts'
export type { HexColor } from '../utils/color.ts'
