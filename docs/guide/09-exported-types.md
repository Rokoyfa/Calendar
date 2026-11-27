# 9. Exported types

Everything below is exported from `@rokoyfa/calendar`.

## Component and configuration

| Export | Kind | |
| --- | --- | --- |
| `Calendar` | component | The React component |
| `CalendarElement`, `defineCalendarElement`, `DEFAULT_ELEMENT_NAME` | class, function, text | The web component, registering it, and its default name `calendar-widget` |
| `VERSION` | text | Version of the package |
| `CalendarProps` | type | All props of `Calendar` |
| `CalendarOptions` | type | The options that can be written as data, the shape of a configuration file |
| `CalendarConfigSource` | type | `string | CalendarOptions`, the type of `config` |
| `CalendarFeatures`, `CalendarFeature` | types | All feature switches, and the name of one |
| `DEFAULT_FEATURES`, `FEATURE_NAMES` | values | Defaults and names of the features |
| `parseCalendarOptions`, `ParsedOptions` | function, type | Checks a configuration and returns `{ options, issues }` |
| `CalendarView` | type | `'day' | 'week' | 'month' | 'year' | 'agenda' | 'tasks'` |
| `CalendarRouting`, `StorageMode`, `HolidaySource`, `HostTheme` | types | The values of `routing`, `storageMode`, `holidaySource`, `theme` |
| `EventCallbacks`, `DeletedEvent` | types | The three callbacks, and `{ id }` |
| `CalendarHandle`, `CalendarState`, `NewEventDraft` | types | The methods of `ref` and of the element, the state they report, and the argument of `createEvent()` |
| `CalendarAppearance` | type | The value of `appearance` |
| `Messages`, `PartialMessages`, `MessageOverrides`, `DeepPartial` | types | All texts, a part of them, and the type of `messages` |

The fields of `CalendarOptions` are the options in [Options](02-options.md); `CalendarFeatures` has one `boolean` per feature in [Features](03-features.md).

## Data

| Export | |
| --- | --- |
| `CalendarEvent`, `EventInput`, `EventLink`, `Attendee`, `AttendeeStatus`, `Recurrence`, `HexColor` | Events, see [Data types](10-backend.md#data-types) |
| `CalendarSummary`, `CalendarDraft`, `CalendarChanges`, `TeamChanges`, `TeamMember`, `TeamRole`, `Invitation`, `PendingInvitation`, `TeamInvitation` | Calendars, teams and invitations |
| `User`, `AuthMethod`, `UserTokenProvider` | The signed-in user, `'password' | 'hostToken'`, and the type of `getUserToken` |
| `Preferences` | A user's settings |
| `PublicHoliday` | `{ date, name }` |
| `Category` | `{ id, calendarId, name }` |
| `Attachment` | `{ id, eventId, name, type, size, createdAt, uploadedBy }` |
| `TrashedEvent`, `EventChange` | An entry in the trash, and a message of `events.subscribe` (live updates) |
| `SharedCalendar` | `{ id, name, color, categories }`, what a public link shows of a calendar |
| `ChatMessage`, `ChatKey`, `ChatPage`, `ChatUnread`, `ChatEvent` | Chat, see [Event chat](11-event-chat.md) |
| `Task`, `TaskInput`, `TaskPerson`, `TaskQuery`, `TaskRepository` | Tasks, see [Tasks](29-tasks.md) |
| `FreeBusyRepository`, `FreeBusyQuery`, `FreeBusyPerson`, `BusyInterval` | Busy time of attendees, see [Finding a common time](30-finding-a-common-time.md) |
| `PushRepository`, `PushSubscriptionInput` | Push subscriptions, see [App and push notifications](31-app-and-push-notifications.md) |

## Data adapters

| Export | |
| --- | --- |
| `localDataSource`, `restDataSource`, `tenantDataSource`, `TENANT_HEADER` | The built-in adapters and the name of the tenant header |
| `RestDataSourceOptions`, `TenantDataSourceOptions` | Their options |
| `CalendarDataSource`, `DataRepositories`, `DataSession`, `DataSourceContext` | The adapter interface |
| `EventRepository`, `EventQuery`, `EventSearchQuery` | Events |
| `CalendarRepository` | Calendars, teams, invitations, subscription links |
| `AuthRepository` | Sign-in and account |
| `ColorRepository`, `PreferencesRepository` | Own colors, settings |
| `HolidayRepository`, `HolidayQuery` | Public holidays |
| `ChatRepository` | Chat |
| `CategoryRepository` | Categories |
| `SharedCalendarRepository` | Reading a calendar through a public link |
| `AttachmentRepository` | Files on events |

```ts
interface CalendarDataSource {
  createAuthRepository?: (context: { getLanguage: () => string | null }) => AuthRepository
  connect: (session: { isAuthenticated: boolean }, context: DataSourceContext) => DataRepositories
}

type DataSourceContext = { getLanguage: () => string | null; onUnauthorized: () => void }

type DataRepositories = {
  mode: 'local' | 'remote'
  events: EventRepository
  calendars: CalendarRepository
  colors: ColorRepository
  preferences: PreferencesRepository
  holidays?: HolidayRepository
  chat?: ChatRepository
  categories?: CategoryRepository
  shared?: SharedCalendarRepository
  attachments?: AttachmentRepository
  tasks?: TaskRepository
  // externalCalendars, history, notifications, appPasswords, caldav, bookings, personalSharing, freeBusy and push are filled by restDataSource;
  // leave them out in your own adapter and the matching features stay hidden
}

interface TaskRepository {
  list(query: { calendarIds: readonly string[]; from?: string; to?: string; completed?: boolean }): Promise<Task[]>
  create(calendarId: string, input: TaskInput): Promise<Task>
  update(id: string, input: TaskInput, version?: number): Promise<Task>
  setStatus(id: string, status: TaskStatus, version?: number): Promise<Task>
  setChecklistItem(id: string, itemId: string, done: boolean, version?: number): Promise<Task>
  move(id: string, calendarId: string, version?: number): Promise<Task>
  remove(id: string, version?: number): Promise<void>
}

type TaskInput = {
  title: string
  notes: string
  dueDate: string | null
  dueTime: string | null
  estimateMinutes: number | null
  status: TaskStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  categoryIds: string[]
  builtinCategories: BuiltinCategory[]
  checklist: { id?: string; title: string; done: boolean }[]
  assigneeId: string | null
}

type TaskStatus = 'open' | 'inProgress' | 'waiting' | 'done'

type Task = Omit<TaskInput, 'assigneeId' | 'checklist'> & {
  id: string
  calendarId: string
  checklist: { id: string; title: string; done: boolean }[]
  assignee: { id: string; name: string } | null
  completedAt: string | null
  completedBy: { id: string; name: string } | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  version: number
}

interface AttachmentRepository {
  list(eventId: string): Promise<Attachment[]>
  upload(eventId: string, file: File): Promise<Attachment>
  download(attachment: Attachment): Promise<Blob>
  remove(id: string): Promise<void>
}

interface CategoryRepository {
  list(calendarIds: readonly string[]): Promise<Category[]>
  create(calendarId: string, name: string): Promise<Category>
  rename(id: string, name: string): Promise<Category>
  remove(id: string): Promise<void>
}

interface SharedCalendarRepository {
  get(token: string): Promise<SharedCalendar>
  listEvents(token: string, range: { from: string; to: string }): Promise<CalendarEvent[]>
}

interface EventRepository {
  list(query: { from: string; to: string; calendarIds: readonly string[] }): Promise<CalendarEvent[]>
  listSeries(seriesId: string): Promise<CalendarEvent[]>
  create(calendarId: string, input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput, version?: number): Promise<CalendarEvent>
  remove(id: string, version?: number): Promise<void>
  search?(query: { text: string; calendarIds: readonly string[] }): Promise<CalendarEvent[]>
  respond?(id: string, status: AttendeeStatus): Promise<CalendarEvent>
  setReminders?(id: string, reminders: number[]): Promise<CalendarEvent>
  subscribe?(listener: (change: EventChange) => void): () => void
  listTrash?(calendarId: string): Promise<TrashedEvent[]>
  restore?(id: string): Promise<CalendarEvent>
  purge?(calendarId: string, id: string): Promise<void>
  emptyTrash?(calendarId: string): Promise<number>
  move?(id: string, calendarId: string, version?: number): Promise<CalendarEvent>
}

type TrashedEvent = {
  event: CalendarEvent
  deletedAt: string
  deletedBy: string | null
  deletedByName: string | null
  expiresAt: string
  detachedCount: number
}

type EventChange =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'event.changed'; calendarId: string | null; eventId: string | null; version: number | null; changedBy: string | null }

interface ChatRepository {
  list(key: ChatKey, options?: { before?: string }): Promise<ChatPage>
  send(key: ChatKey, text: string): Promise<ChatMessage>
  edit(id: string, text: string): Promise<ChatMessage>
  remove(id: string): Promise<void>
  markRead(key: ChatKey): Promise<void>
  unread(calendarIds: readonly string[]): Promise<ChatUnread[]>
  subscribe(listener: (event: ChatEvent) => void): () => void
}

type ChatKey = { eventId: string; occurrenceDate: string | null }
type ChatMessage = ChatKey & {
  id: string
  calendarId: string
  author: { id: string; name: string } | null
  text: string
  createdAt: string
  editedAt: string | null
}
type ChatPage = { messages: ChatMessage[]; hasMore: boolean }
type ChatUnread = ChatKey & { count: number }
```

`AuthRepository` has an optional `exportData(): Promise<Blob>` for the data export. The other interfaces (`CalendarRepository`, `AuthRepository`, `ColorRepository`, `PreferencesRepository`, `HolidayRepository`) are best read in your editor from the package's type definitions.

---

[← Previous](08-data-adapters.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](10-backend.md)
