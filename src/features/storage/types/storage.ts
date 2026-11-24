import type { Attachment } from '../../../utils/attachment.ts'
import type { Category } from '../../../utils/category.ts'
import type { HexColor } from '../../../utils/color.ts'
import type { DateRange } from '../../../utils/date.ts'
import type { AttendeeStatus, CalendarEvent, EventInput } from '../../../utils/event.ts'
import type { ChatEvent, ChatKey, ChatMessage, ChatPage, ChatUnread } from '../../../utils/chat.ts'
import type { EventChange } from '../../../utils/eventChange.ts'
import type { TrashedEvent } from '../../../utils/trash.ts'
import type { PublicHoliday } from '../../../utils/holidays.ts'
import type { Preferences } from '../../../utils/preferences.ts'
import type { SharedCalendar } from '../../../utils/sharedCalendar.ts'
import type {
  ExternalCalendar,
  ExternalCalendarChanges,
  ExternalCalendarInput,
} from '../../../utils/externalCalendar.ts'
import type { HistoryPage } from '../../../utils/history.ts'
import type {
  AppPassword,
  CaldavAccess,
  CaldavAccount,
  CaldavAccountChanges,
  CaldavAccountInput,
  CaldavCalendar,
  CaldavCalendarChanges,
  CaldavObject,
  CreatedAppPassword,
} from '../../../utils/caldav.ts'
import type { AppNotification, NotificationPage } from '../../../utils/notification.ts'
import type {
  EventRequestInput,
  PeerCalendar,
  PeerCalendarChanges,
  PeerEvent,
  SharingState,
  SharingViewer,
} from '../../../utils/peerCalendar.ts'
import type {
  BookingHold,
  BookingPage,
  BookingPageSettings,
  BookingRequest,
  BookingSummary,
  PublicBookingPage,
} from '../../../utils/booking.ts'

export type EventQuery = DateRange & { calendarIds: readonly string[] }

export type EventSearchQuery = { text: string; calendarIds: readonly string[] }

export interface EventRepository {
  list(query: EventQuery): Promise<CalendarEvent[]>
  listSeries(seriesId: string): Promise<CalendarEvent[]>
  create(calendarId: string, input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput, version?: number): Promise<CalendarEvent>
  remove(id: string, version?: number): Promise<void>
  move?(id: string, calendarId: string, version?: number): Promise<CalendarEvent>
  search?(query: EventSearchQuery): Promise<CalendarEvent[]>
  respond?(id: string, status: AttendeeStatus): Promise<CalendarEvent>
  setReminders?(id: string, reminders: number[]): Promise<CalendarEvent>
  subscribe?(listener: (change: EventChange) => void): () => void
  listTrash?(calendarId: string): Promise<TrashedEvent[]>
  restore?(id: string): Promise<CalendarEvent>
  purge?(calendarId: string, id: string): Promise<void>
  emptyTrash?(calendarId: string): Promise<number>
}

export interface ColorRepository {
  list(): Promise<HexColor[]>
  add(color: HexColor): Promise<HexColor[]>
  remove(color: HexColor): Promise<HexColor[]>
}

export interface CategoryRepository {
  list(calendarIds: readonly string[]): Promise<Category[]>
  create(calendarId: string, name: string): Promise<Category>
  rename(id: string, name: string): Promise<Category>
  remove(id: string): Promise<void>
}

export interface AttachmentRepository {
  list(eventId: string): Promise<Attachment[]>
  upload(eventId: string, file: File): Promise<Attachment>
  download(attachment: Attachment): Promise<Blob>
  remove(id: string): Promise<void>
}

export interface ExternalCalendarRepository {
  list(): Promise<ExternalCalendar[]>
  create(input: ExternalCalendarInput): Promise<ExternalCalendar>
  update(id: string, changes: ExternalCalendarChanges): Promise<ExternalCalendar>
  remove(id: string): Promise<void>
  content(id: string): Promise<string>
}

export interface AppPasswordRepository {
  list(): Promise<AppPassword[]>
  create(name: string): Promise<CreatedAppPassword>
  remove(id: string): Promise<void>
  access(): Promise<CaldavAccess>
}

export interface CaldavRepository {
  list(): Promise<CaldavAccount[]>
  create(input: CaldavAccountInput): Promise<CaldavAccount>
  update(id: string, changes: CaldavAccountChanges): Promise<CaldavAccount>
  remove(id: string): Promise<void>
  sync(id: string): Promise<CaldavAccount>
  updateCalendar(id: string, changes: CaldavCalendarChanges): Promise<CaldavCalendar>
  listObjects(calendarId: string): Promise<CaldavObject[]>
  createObject(calendarId: string, data: string): Promise<CaldavObject>
  updateObject(calendarId: string, objectId: string, data: string, etag: string): Promise<CaldavObject>
  removeObject(calendarId: string, objectId: string, etag: string): Promise<void>
}

export interface PeerEventSource {
  setCalendars(calendars: readonly PeerCalendar[]): void
}

export interface CaldavEventSource {
  setCalendars(calendars: readonly CaldavCalendar[]): void
  forget(calendarIds?: readonly string[]): void
}

export interface HistoryRepository {
  list(eventId: string, options?: { before?: string }): Promise<HistoryPage>
}

export interface NotificationRepository {
  list(options?: { before?: string }): Promise<NotificationPage>
  markRead(ids?: readonly string[]): Promise<void>
  remove(id: string): Promise<void>
  subscribe(listener: (notification: AppNotification) => void): () => void
}

export interface SharedCalendarRepository {
  get(token: string): Promise<SharedCalendar>
  listEvents(token: string, range: DateRange): Promise<CalendarEvent[]>
}

export interface PersonalSharingRepository {
  getSharing(): Promise<SharingState>
  setSharing(enabled: boolean): Promise<SharingState>
  invite(email: string): Promise<SharingViewer>
  removeViewer(id: string): Promise<void>
  listPeers(): Promise<PeerCalendar[]>
  acceptPeer(id: string): Promise<PeerCalendar>
  declinePeer(id: string): Promise<void>
  updatePeer(id: string, changes: PeerCalendarChanges): Promise<PeerCalendar>
  leavePeer(id: string): Promise<void>
  listPeerEvents(id: string, range: DateRange): Promise<PeerEvent[]>
  createRequest(id: string, input: EventRequestInput): Promise<PeerEvent>
  updateRequest(id: string, eventId: string, input: EventRequestInput): Promise<PeerEvent>
  withdrawRequest(id: string, eventId: string): Promise<void>
  acceptRequest(eventId: string): Promise<CalendarEvent>
  declineRequest(eventId: string): Promise<void>
}

export interface BookingRepository {
  listPages(calendarId: string): Promise<BookingPage[]>
  createPage(calendarId: string, settings: BookingPageSettings): Promise<BookingPage>
  updatePage(id: string, changes: Partial<BookingPageSettings>): Promise<BookingPage>
  renewPage(id: string): Promise<BookingPage>
  removePage(id: string): Promise<void>
  getPublic(token: string): Promise<PublicBookingPage>
  listSlots(token: string, range: DateRange): Promise<string[]>
  book(token: string, request: BookingRequest): Promise<BookingHold>
  confirm(token: string): Promise<BookingSummary>
  lookup(token: string): Promise<BookingSummary>
  cancel(token: string): Promise<BookingSummary>
}

export interface PreferencesRepository {
  get(): Promise<Preferences>
  update(changes: Partial<Preferences>): Promise<Preferences>
}

export type HolidayQuery = DateRange & { region: string; language: string }

export interface HolidayRepository {
  list(query: HolidayQuery): Promise<PublicHoliday[]>
}

export interface ChatRepository {
  list(key: ChatKey, options?: { before?: string }): Promise<ChatPage>
  send(key: ChatKey, text: string): Promise<ChatMessage>
  edit(id: string, text: string): Promise<ChatMessage>
  remove(id: string): Promise<void>
  markRead(key: ChatKey): Promise<void>
  unread(calendarIds: readonly string[]): Promise<ChatUnread[]>
  subscribe(listener: (event: ChatEvent) => void): () => void
}

export type StorageMode = 'local' | 'remote'

export type StorageRepositories = {
  mode: StorageMode
  events: EventRepository
  colors: ColorRepository
  preferences: PreferencesRepository
  holidays?: HolidayRepository
  chat?: ChatRepository
  categories?: CategoryRepository
  shared?: SharedCalendarRepository
  bookings?: BookingRepository
  personalSharing?: PersonalSharingRepository
  peerEvents?: PeerEventSource
  attachments?: AttachmentRepository
  externalCalendars?: ExternalCalendarRepository
  history?: HistoryRepository
  notifications?: NotificationRepository
  appPasswords?: AppPasswordRepository
  caldav?: CaldavRepository
  caldavEvents?: CaldavEventSource
}

export type StorageContextValue = StorageRepositories & {
  version: number
  invalidate: () => void
}
