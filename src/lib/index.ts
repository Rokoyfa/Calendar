export { CalendarWidget as Calendar } from './CalendarWidget.tsx'
export { VERSION } from './version.ts'
export { enableInstallPrompt, enablePageSync } from '../features/pwa/index.ts'
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
export type { CalendarView } from '../domain/calendarView.ts'
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
  AttachmentRepository,
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
export type { Attendee, AttendeeStatus, CalendarEvent, EventInput, EventLink } from '../domain/event.ts'
export type { ChatEvent, ChatKey, ChatMessage, ChatPage, ChatUnread } from '../features/chat/index.ts'
export type { Category } from '../domain/category.ts'
export type { Attachment } from '../features/attachments/index.ts'
export type { TrashedEvent } from '../features/events/index.ts'
export type { EventChange } from '../domain/eventChange.ts'
export type { SharedCalendar } from '../features/calendars/index.ts'
export type { Preferences, StoredPreferences } from '../domain/preferences.ts'
export type { PublicHoliday } from '../domain/holidays.ts'
export type { Recurrence } from '../domain/recurrence.ts'
export type { HexColor } from '../utils/color.ts'
export type {
  Task,
  TaskChecklistInput,
  TaskChecklistItem,
  TaskInput,
  TaskPerson,
  TaskPriority,
  TaskQuery,
  TaskRepository,
  TaskStatus,
} from '../features/tasks/index.ts'
export type { BusyInterval, FreeBusyPerson, FreeBusyQuery, FreeBusyRepository } from '../features/freebusy/index.ts'
export type { PushRepository, PushSubscriptionInput } from '../features/push/index.ts'
