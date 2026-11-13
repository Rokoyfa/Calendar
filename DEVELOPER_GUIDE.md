# Developer Guide

Everything you need to put `@rokoyfa/calendar` on your page: embedding, all options, the configuration file, the types the package exports, and what a backend has to provide. For a first look see the [README](README.md).

**Contents**

1. [Embedding](#1-embedding)
2. [Options](#2-options)
3. [Features](#3-features)
4. [Configuration file](#4-configuration-file)
5. [Languages and texts](#5-languages-and-texts)
6. [Reacting to changes](#6-reacting-to-changes)
7. [Sign-in and tenants](#7-sign-in-and-tenants)
8. [Data adapters](#8-data-adapters)
9. [Exported types](#9-exported-types)
10. [Backend](#10-backend)
11. [Event chat](#11-event-chat)
12. [Calendar subscriptions](#12-calendar-subscriptions)

## 1. Embedding

There are two ways to embed the calendar. Both render the same component and take the same options.

### Web component, for any website

One script, no build step. React is bundled.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@1/dist-lib/cdn/calendar-widget.js"></script>

<calendar-widget style="height: 700px"></calendar-widget>
```

The script registers `<calendar-widget>`. Options are attributes in kebab-case (`initial-view="month"`). Values that are not text (functions, objects) are set as properties on the element, before or after the script has loaded:

```js
const calendar = document.querySelector('calendar-widget')
calendar.getUserToken = async () => (await fetch('/calendar-token')).text()
calendar.config = { features: { chat: false } }
```

When hosting the script yourself, copy the whole `dist-lib/cdn` folder. Languages other than English, the holiday data and the YAML parser are separate files next to `calendar-widget.js` that are loaded on demand.

To register the element under another name, or to control when it is registered, use the npm package:

```js
import { defineCalendarElement, CalendarElement } from '@rokoyfa/calendar'

defineCalendarElement('team-calendar')
console.log(CalendarElement.version)
```

### React component

Needs React 19.

```bash
npm install @rokoyfa/calendar
```

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar style={{ height: 700 }} />
```

### What the host page should know

- **Height.** Give the calendar a height, it fills its box and scrolls inside. Without one it grows with its content.
- **Styles.** The calendar renders into a Shadow DOM. Your CSS does not reach in, its CSS does not leak out, and no stylesheet has to be imported.
- **Responsive.** The layout follows the width of the calendar, not of the window. A narrow calendar on a wide screen shows the phone layout.
- **Several calendars** on one page are independent, each with its own view and dialogs. In local mode they share the browser's storage.
- **Address bar.** By default (`routing: memory`) the calendar never touches the address of your page.

## 2. Options

Every option can be given in three ways: as a React prop, as an attribute of the web component, or in a [configuration file](#4-configuration-file).

### Data

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `storageMode` | `storage-mode` | `local` | `local` keeps events in the visitor's browser, `remote` in your backend. With the `auth` feature the sign-in decides: signed-in users use the backend, guests the browser |
| `apiBaseUrl` | `api-base-url` | `/api` | Base URL of your backend, relative or absolute |
| `apiTimeoutMs` | `api-timeout-ms` | `10000` | Time limit per request in milliseconds |
| `tenant` | `tenant` | – | Tenant of a multi-tenant backend, see [Sign-in and tenants](#7-sign-in-and-tenants) |
| `getUserToken` | property `getUserToken` | – | Sign-in through your own page, see [Sign-in and tenants](#7-sign-in-and-tenants) |
| `dataSource` | property `dataSource` | – | Your own data adapter, see [Data adapters](#8-data-adapters). Replaces the five options above |

### Features and views

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `features` | `feature-*` | see [Features](#3-features) | Switches for every optional feature |
| `views` | `views` | all four | Views the user can switch between: `day`, `week`, `month`, `year`. Attribute: separated by spaces or commas, `views="week month"`. With one view the switch disappears |
| `initialView` | `initial-view` | user's start view | View shown first. Wins over the user's setting |

### Appearance

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `locale` | `locale` | browser | Language and region: `en-US`, `de-DE`, `fr-FR`, `pt-BR`, … See [Languages and texts](#5-languages-and-texts) |
| `messages` | property `messages` | – | Own texts or languages |
| `theme` | `theme` | follows the device | `light` or `dark`. Applies while the user has chosen "system" in the settings |
| `timeZone` | `time-zone` | browser | IANA zone the calendar is shown in, e.g. `Europe/Berlin`. New events start in it. A zone the user picks in the settings wins |
| `holidays` | `holidays` | from `locale` | Region for public holidays: `DE`, `DE-NW`, `AT`, `US-CA`, or `off`. Users can override it in the settings |
| `holidaySource` | `holiday-source` | `library` | `library` computes holidays in the browser, `backend` asks your backend (`GET /holidays`) and falls back to the library |
| `mapUrl` | `map-url` | Google Maps | Map service for locations, with `{query}` for the place: `https://www.openstreetmap.org/search?query={query}`, `https://maps.apple.com/?q={query}` |
| `className`, `style` | `class`, `style` | – | Size and place on your page |

### Navigation

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `routing` | – | `memory` | `memory`: the calendar's pages (settings, sign-in, …) change inside the widget only. `browser`: they get addresses in the address bar, for when the calendar is the whole page. The web component always uses `memory` |
| `basename` | – | – | Path prefix for `routing="browser"` |
| `initialPath` | `initial-path` | `/` | Page the widget opens on, e.g. `/settings` |
| `linkParam` | `link-param` | `calendarPath` | Query parameter of your page that links from e-mails use to open a page of the widget, e.g. `?calendarPath=%2Freset-password%3Ftoken%3D…`. `false` turns it off |

### Configuration and callbacks

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `config` | `config`, property `config` | – | URL of a JSON or YAML file, or an object with options. See [Configuration file](#4-configuration-file) |
| `onEventCreate`, `onEventUpdate`, `onEventDelete` | events `event-create`, `event-update`, `event-delete` | – | After every stored change, see [Reacting to changes](#6-reacting-to-changes) |

### Which setting wins

Several places can set the same thing. From strongest to weakest:

1. What the user chose in the calendar's settings (language, theme, time zone, holidays, start view). Exception: `initialView` wins over the user's start view.
2. Props and attributes.
3. The configuration file.
4. The browser or device (language, time zone, light or dark).
5. The defaults in the tables above.

## 3. Features

Everything beyond the core calendar (views, creating, editing, moving and deleting events, colors, all-day events) can be switched off. A feature that is off disappears from the interface and the component makes no calls for it, so your backend does not have to provide it.

```jsx
<Calendar storageMode="remote" features={{ auth: true, chat: false, subscriptions: false }} views={['week', 'month']} />
```

```html
<calendar-widget storage-mode="remote" feature-auth feature-chat="false" feature-subscriptions="false" views="week month"></calendar-widget>
```

| Feature | Attribute | Default | What it covers | Your backend needs |
| --- | --- | --- | --- | --- |
| `auth` | `feature-auth` | off | Sign-in, registration, accounts | `/auth/*` |
| `teams` | `feature-teams` | on | Team calendars, members, roles, invitations | `/calendars`, `/teams/*`, `/invitations` |
| `chat` | `feature-chat` | on | Chat per event in team calendars | Chat endpoints and the WebSocket, see [Event chat](#11-event-chat) |
| `attendees` | `feature-attendees` | on | Inviting members to events, replies | `POST /events/:id/response` |
| `recurrence` | `feature-recurrence` | on | Creating and editing recurring events | – |
| `reminders` | `feature-reminders` | on | Reminders and their notifications | `PUT /events/:id/reminders` for members without edit rights |
| `links` | `feature-links` | on | Website and other links on events | – |
| `mapLinks` | `feature-map-links` | on | Opening a location in a map service | – |
| `holidays` | `feature-holidays` | on | Public holidays and their setting | `GET /holidays` only with `holidaySource="backend"` |
| `search` | `feature-search` | on | Event search | `GET /events/search` |
| `undo` | `feature-undo` | on | Undo after moving or deleting | – |
| `duplicate` | `feature-duplicate` | on | Duplicating events | – |
| `shortcuts` | `feature-shortcuts` | on | Keyboard shortcuts | – |
| `subscriptions` | `feature-subscriptions` | on | Subscription links in the calendar settings | `/calendars/:id/feed`, `/feeds/:token.ics` |
| `importExport` | `feature-import-export` | on | iCalendar import and export | – |
| `emailNotifications` | `feature-email-notifications` | on | E-mail settings of a signed-in user | Sending the e-mails |
| `timeZones` | `feature-time-zones` | on | Time zone per event and in the settings | – |
| `customColors` | `feature-custom-colors` | on | Own event colors | `/colors` |

Good to know:

- `chat` and `attendees` need `teams`. Without teams they are off, whatever you set.
- With `undo` off, deleting an event asks for confirmation first.
- With `recurrence`, `links` or `reminders` off, existing data is kept when an event is saved. It is only no longer shown or editable.
- With `timeZones` off, the calendar always uses the automatic zone (your `timeZone`, otherwise the browser's).
- With a single entry in `views`, the view switch disappears.
- The attributes `auth` and `teams` still work as short forms of `feature-auth` and `feature-teams`.

## 4. Configuration file

Instead of props or attributes you can keep the options in a file, or pass them as an object. This keeps the embedding code the same on every page and the settings in one place.

```html
<calendar-widget config="/calendar.config.yaml"></calendar-widget>
```

```tsx
<Calendar config="/calendar.config.json" />
<Calendar config={{ storageMode: 'remote', features: { auth: true, chat: false } }} />
```

```js
document.querySelector('calendar-widget').config = { features: { chat: false } }
```

### Example files

Two complete, commented examples list every option with its default. Copy one and delete what you do not need:

- [`demo/calendar.config.yaml`](demo/calendar.config.yaml)
- [`demo/calendar.config.jsonc`](demo/calendar.config.jsonc), the same as JSON

A short file is enough, everything left out keeps its default:

```yaml
storageMode: remote
apiBaseUrl: https://api.example.com
locale: de-DE
views: [week, month]
features:
  auth: true
  chat: false
  subscriptions: false
```

```jsonc
{
  // comments are allowed
  "storageMode": "remote",
  "apiBaseUrl": "https://api.example.com",
  "locale": "de-DE",
  "views": ["week", "month"],
  "features": { "auth": true, "chat": false, "subscriptions": false }
}
```

### What can be in the file

All options from [Options](#2-options) under their prop names, except those that cannot be written as data: `dataSource`, `getUserToken`, the event callbacks, `className`, `style`, and `config` itself.

| Field | Type | Default |
| --- | --- | --- |
| `storageMode` | `"local"` or `"remote"` | `"local"` |
| `apiBaseUrl` | text | `"/api"` |
| `apiTimeoutMs` | whole number above 0 | `10000` |
| `tenant` | text | – |
| `features` | object of feature names and `true` / `false` | see [Features](#3-features) |
| `views` | list of `day`, `week`, `month`, `year` | all four |
| `initialView` | `day`, `week`, `month` or `year` | user's start view |
| `locale` | text | browser |
| `messages` | object: language → texts | – |
| `theme` | `"light"` or `"dark"` | follows the device |
| `timeZone` | text (IANA zone) | browser |
| `holidays` | text (region or `"off"`) | from `locale` |
| `holidaySource` | `"library"` or `"backend"` | `"library"` |
| `mapUrl` | text with `{query}` | Google Maps |
| `routing` | `"memory"` or `"browser"` | `"memory"` |
| `basename` | text | – |
| `initialPath` | text | `/` |
| `linkParam` | text or `false` | `"calendarPath"` |

### How the file is read

- **Format.** Files ending in `.yaml` or `.yml` are read as YAML, files ending in `.json` or `.jsonc` as JSON. For other addresses the `Content-Type` of the answer decides. JSON files may contain `//` and `/* */` comments.
- **YAML parser.** It is only loaded when a YAML file is used. With the script tag it is a separate file next to `calendar-widget.js`, with the npm package it comes from the `yaml` dependency.
- **Precedence.** Props and attributes win over the file, for features one switch at a time. So one shared file can be adjusted per page: `<calendar-widget config="/calendar.config.yaml" feature-search="false">`.
- **Mistakes in the file.** Unknown or invalid entries are skipped, the rest is used. Every skipped entry is listed as a warning in the browser console, starting with `[calendar]`.
- **File not reachable or not parseable.** The calendar shows a message and does not start. It never falls back to defaults silently, because that could mean storing events in the wrong place.
- **Loading.** The file is fetched once when the calendar starts and again when the `config` address changes. Cache it like any other static file.
- **Texts.** `messages` in a file can override plain texts. Texts that are functions need the `messages` prop or property, see [Languages and texts](#5-languages-and-texts).
- **Security.** The file is public, like everything a browser loads. Never put secrets in it.

### Editor support

A JSON Schema ships with the package as `@rokoyfa/calendar/config.schema.json`. With it, editors complete field names and flag wrong values.

```json
{ "$schema": "https://unpkg.com/@rokoyfa/calendar/schema/calendar-config.schema.json" }
```

```yaml
# yaml-language-server: $schema=https://unpkg.com/@rokoyfa/calendar/schema/calendar-config.schema.json
```

### Checking a configuration yourself

`parseCalendarOptions` is the function the calendar uses. It returns the valid options and a list of problems, useful in a build step or an admin page:

```ts
import { parseCalendarOptions } from '@rokoyfa/calendar'

const { options, issues } = parseCalendarOptions(JSON.parse(text))
if (issues.length > 0) console.warn(issues)
```

## 5. Languages and texts

English, German, French, Spanish, Italian, Dutch, Polish and Portuguese are built in. Which language is used, in this order:

1. The user's choice in the settings.
2. Your `locale`.
3. The browser's languages.
4. `en-US`.

Formats follow the region, not the language: `en-US` starts the week on Sunday and shows `1:00 PM`, `en-GB` starts on Monday and shows `13:00`. A language that is not available falls back to English with the user's region.

**Own texts and languages.** `messages` overrides single texts or adds a language. Missing texts fall back to the built-in language, or to English for a new one. The full list of keys is the `Messages` type.

```js
document.querySelector('calendar-widget').messages = {
  de: { calendar: { newEvent: 'Neuer Eintrag' } },
  sv: { calendar: { today: 'Idag', newEvent: 'Ny händelse' }, views: { weekNumber: (week) => `V. ${week}` } },
}
```

Texts with values in them are functions, like `weekNumber` above. An override of the wrong kind (a text where a function is expected, or the other way round) is ignored.

## 6. Reacting to changes

After every stored change the calendar tells your page.

```tsx
<Calendar
  onEventCreate={(event) => console.log('created', event)}
  onEventUpdate={(event) => console.log('updated', event)}
  onEventDelete={({ id }) => console.log('deleted', id)}
/>
```

```js
const calendar = document.querySelector('calendar-widget')
calendar.addEventListener('event-create', (e) => console.log(e.detail))
calendar.addEventListener('event-update', (e) => console.log(e.detail))
calendar.addEventListener('event-delete', (e) => console.log(e.detail.id))
```

- Create and update carry the stored `CalendarEvent`, delete carries `{ id }`.
- The DOM events bubble and cross the Shadow DOM, so you can listen on a parent element.
- One action on a recurring event can cause several calls. Changing "only this occurrence" updates the series and creates a detached event.
- An undo causes the reverse calls.

## 7. Sign-in and tenants

There are three ways to handle users.

**No sign-in** (default). Everything stays in the visitor's browser. With `storageMode="remote"` all requests go to your backend without the calendar asking anyone to sign in. Who the visitor is, is then up to your backend, for example through a session cookie of your own site or a token from `getAccessToken` (see [Data adapters](#8-data-adapters)).

**The calendar's own accounts.** Turn on the `auth` feature. The calendar then has pages for sign-in, registration, password reset and e-mail confirmation. Guests keep working in the browser, and after signing in they are asked whether to move their local events into the account.

```html
<calendar-widget storage-mode="remote" feature-auth api-base-url="https://api.example.com"></calendar-widget>
```

**Sign-in through your page.** If your visitors are already signed in on your site, pass `getUserToken`. It returns a short-lived token signed by your server, or `null` when nobody is signed in.

```tsx
<Calendar
  tenant="acme"
  apiBaseUrl="https://api.example.com"
  getUserToken={() => fetch('/calendar-token').then((r) => r.text())}
/>
```

- The calendar first asks `GET /auth/me`. On `401` it calls `getUserToken` and exchanges the token at `POST /auth/token` for a session. When the session runs out later, this happens again by itself.
- In this mode there are no sign-in, registration or password pages, no sign-out button and no account tab. The account belongs to your site.
- With `null` the calendar works like for guests, in the browser.

**Tenants.** `tenant` is for a backend that serves several host pages. Every request then carries the header `X-Calendar-Tenant`, and sign-in is on. What the backend has to check is described in the OpenAPI file.

## 8. Data adapters

Where the data comes from is decided by a `CalendarDataSource`. Without the `dataSource` option the calendar picks a built-in one from `storageMode`, `apiBaseUrl`, `tenant` and the `auth` feature.

```tsx
import { Calendar, localDataSource, restDataSource, tenantDataSource } from '@rokoyfa/calendar'

<Calendar dataSource={localDataSource()} />
<Calendar dataSource={restDataSource({ baseUrl: 'https://api.example.com' })} />
<Calendar dataSource={restDataSource({ baseUrl: '/api', auth: false, getAccessToken: () => myToken })} />
<Calendar dataSource={tenantDataSource({ tenant: 'acme', baseUrl: 'https://api.example.com', getUserToken })} />
```

| Adapter | Behaviour |
| --- | --- |
| `localDataSource()` | Everything in the browser (localStorage), no sign-in |
| `restDataSource(options)` | Talks to the [REST API](api/openapi.yaml) |
| `tenantDataSource(options)` | `restDataSource` with the tenant header and sign-in |

`restDataSource` options:

| Option | Default | |
| --- | --- | --- |
| `baseUrl` | required | Base URL of the backend |
| `timeoutMs` | `10000` | Time limit per request |
| `auth` | `true` | With sign-in in the widget: guests work in the browser, signed-in users on the backend. `false`: always the backend |
| `headers` | – | Extra headers for every request |
| `getAccessToken` | – | Returns a bearer token for the `Authorization` header |
| `getUserToken` | – | Sign-in through your page, see above |
| `holidaySource` | `library` | `backend` asks `GET /holidays` |
| `chat` | `true` | `false` creates no chat connection |
| `chatSocketUrl` | from `baseUrl` | Address of the chat WebSocket |

Note that `restDataSource` defaults to `auth: true`, while the `auth` feature of the component defaults to off.

### Your own adapter

For any other data source, implement the interfaces yourself. All types are exported.

```ts
import type { CalendarDataSource } from '@rokoyfa/calendar'

const myDataSource: CalendarDataSource = {
  createAuthRepository: ({ getLanguage }) => myAuth,
  connect: ({ isAuthenticated }, { getLanguage, onUnauthorized }) => ({
    mode: 'remote',
    events: myEvents,
    calendars: myCalendars,
    colors: myColors,
    preferences: myPreferences,
    holidays: myHolidays,
    chat: myChat,
  }),
}
```

- `connect` returns the repositories for the current state. It is called again on sign-in and sign-out.
- `createAuthRepository` is optional. Without it there is no sign-in in the widget.
- `holidays` and `chat` are optional. Without `chat` there is no chat, without `holidays` they are computed in the browser.
- `mode: 'remote'` makes the calendar offer to move local events into the account after sign-in.
- Optional methods switch their feature on: `events.search`, `events.respond`, `events.setReminders`, `calendars.getFeed` / `createFeed` / `deleteFeed`. Without `search` the calendar searches the last and next year itself.
- Call `onUnauthorized` when a session has run out. `getLanguage` returns the current language for your requests.
- Errors with a known `code` are shown translated, others with their `message`.

A simple start is to take most repositories from `localDataSource()` and replace only `events`:

```ts
const local = localDataSource()

const myDataSource: CalendarDataSource = {
  connect: (session, context) => ({ ...local.connect(session, context), events: myEvents }),
}
```

## 9. Exported types

Everything below is exported from `@rokoyfa/calendar`.

### Component and configuration

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
| `CalendarView` | type | `'day' | 'week' | 'month' | 'year'` |
| `CalendarRouting`, `StorageMode`, `HolidaySource`, `HostTheme` | types | The values of `routing`, `storageMode`, `holidaySource`, `theme` |
| `EventCallbacks`, `DeletedEvent` | types | The three callbacks, and `{ id }` |
| `Messages`, `PartialMessages`, `MessageOverrides`, `DeepPartial` | types | All texts, a part of them, and the type of `messages` |

```ts
type CalendarOptions = {
  tenant?: string
  storageMode?: 'local' | 'remote'
  apiBaseUrl?: string
  apiTimeoutMs?: number
  features?: Partial<CalendarFeatures>
  views?: readonly CalendarView[]
  routing?: 'memory' | 'browser'
  basename?: string
  initialPath?: string
  linkParam?: string | false
  locale?: string
  messages?: MessageOverrides
  theme?: 'light' | 'dark'
  initialView?: CalendarView
  timeZone?: string
  holidays?: string
  holidaySource?: 'library' | 'backend'
  mapUrl?: string
}

type CalendarProps = CalendarOptions &
  EventCallbacks & {
    config?: string | CalendarOptions
    dataSource?: CalendarDataSource
    getUserToken?: UserTokenProvider
    className?: string
    style?: CSSProperties
  }

type CalendarFeatures = {
  auth: boolean
  teams: boolean
  chat: boolean
  attendees: boolean
  recurrence: boolean
  reminders: boolean
  links: boolean
  mapLinks: boolean
  holidays: boolean
  search: boolean
  undo: boolean
  duplicate: boolean
  shortcuts: boolean
  subscriptions: boolean
  importExport: boolean
  emailNotifications: boolean
  timeZones: boolean
  customColors: boolean
}
```

### Data

| Export | |
| --- | --- |
| `CalendarEvent`, `EventInput`, `EventLink`, `Attendee`, `AttendeeStatus`, `Recurrence`, `HexColor` | Events, see [Data types](#data-types) |
| `CalendarSummary`, `CalendarDraft`, `CalendarChanges`, `TeamChanges`, `TeamMember`, `TeamRole`, `Invitation`, `PendingInvitation`, `TeamInvitation` | Calendars, teams and invitations |
| `User`, `AuthMethod`, `UserTokenProvider` | The signed-in user, `'password' | 'hostToken'`, and the type of `getUserToken` |
| `Preferences` | A user's settings |
| `PublicHoliday` | `{ date, name }` |
| `ChatMessage`, `ChatKey`, `ChatPage`, `ChatUnread`, `ChatEvent` | Chat, see [Event chat](#11-event-chat) |

### Data adapters

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
}

interface EventRepository {
  list(query: { from: string; to: string; calendarIds: readonly string[] }): Promise<CalendarEvent[]>
  listSeries(seriesId: string): Promise<CalendarEvent[]>
  create(calendarId: string, input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput): Promise<CalendarEvent>
  remove(id: string): Promise<void>
  search?(query: { text: string; calendarIds: readonly string[] }): Promise<CalendarEvent[]>
  respond?(id: string, status: AttendeeStatus): Promise<CalendarEvent>
  setReminders?(id: string, reminders: number[]): Promise<CalendarEvent>
}

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

The other interfaces (`CalendarRepository`, `AuthRepository`, `ColorRepository`, `PreferencesRepository`, `HolidayRepository`) are best read in your editor from the package's type definitions.

## 10. Backend

The full contract is [`api/openapi.yaml`](api/openapi.yaml) (OpenAPI 3.1, also shipped as `@rokoyfa/calendar/openapi.yaml`). The essentials:

### Data types

```ts
type CalendarEvent = EventInput & {
  id: string
  calendarId: string
  createdAt: string             // ISO date-time
  updatedAt: string
}

type EventInput = {
  uid: string                   // stable id for iCalendar, shared by a series and its detached events
  title: string                 // 1–100 chars
  location: string              // max 200 chars, '' if none
  links: EventLink[]            // up to 10 http(s) links
  startDate: string             // 'YYYY-MM-DD'
  start: string                 // 'HH:mm' in timeZone
  endDate: string               // inclusive for all-day events
  end: string
  allDay: boolean               // start and end are '00:00'
  timeZone: string | null       // IANA zone, null = same local time everywhere (always null for all-day)
  description: string           // max 2000 chars
  color: 'blue' | 'red' | 'green' | 'yellow' | `#${string}`
  recurrence: Recurrence | null
  excludedDates: string[]       // occurrences removed from a series
  seriesId: string | null       // set on an occurrence detached from a series
  originalDate: string | null   // its original date in that series
  reminders: number[]           // minutes before the start, per user (see below)
  attendees: Attendee[]
}

type Attendee = { email: string; name: string; status: 'needsAction' | 'accepted' | 'tentative' | 'declined' }

type EventLink = { url: string; label: string } // url max 2000 chars, label max 100 chars, '' if none

type Recurrence = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number              // 1–99
  weekdays: number[]            // 0 = Monday … 6 = Sunday
  monthlyMode: 'dayOfMonth' | 'weekdayOfMonth' | 'lastWeekdayOfMonth'
  until: string | null          // either until or count, or neither
  count: number | null
}

type CalendarSummary = {
  id: string; teamId: string; name: string; color: string
  kind: 'personal' | 'team'; teamName: string | null; description: string
  role: 'owner' | 'admin' | 'manager' | 'editor' | 'member' | 'contributor' | 'viewer'
  showInPersonal: boolean; permissions: string[]
}

type User = { id: string; email: string; name: string; emailVerified: boolean }
type Preferences = {
  theme: 'system' | 'light' | 'dark'; defaultView: View; mobileDefaultView: View; locale: string
  timeZone: string              // 'auto' or IANA zone
  holidays: string              // 'auto', 'off' or a region such as 'DE-NW'
}
type PublicHoliday = { date: string; name: string } // GET /holidays, only with holiday-source="backend"
// Preferences also carry emailInvites, emailChanges, emailReminders, emailChat: booleans for the emails below
type Problem = { code: string; message: string }   // every error response
```

The backend stores series as one event. The component expands occurrences itself.

**Reminders are personal.** Store them per user and event, return only the caller's own `reminders`, and keep other members' reminders when someone saves the event. The component shows reminders while it is open (browser notification or a notice in the calendar). Emails or push messages when it is closed are up to your backend.

### When the component calls your backend

| Moment | Requests |
| --- | --- |
| Widget loads | `GET /auth/me` (only with `auth`), then `GET /preferences`, `GET /colors`, `GET /calendars`, `GET /invitations` |
| Visible range changes | `GET /events?from=…&to=…&calendarId=…` with the calendars shown. The range is two days wider than the view to cover time zone shifts. Return every event in the range **and** every series that can occur in it. |
| Create event | `POST /events` with `EventInput` + `calendarId` |
| Edit event / whole series | `PUT /events/:id` with the full `EventInput` |
| Edit only this occurrence | `PUT` the series with the date added to `excludedDates`, then `POST` a detached event with `seriesId` and `originalDate` |
| Edit this and following | `PUT` the series with `until` set to the day before (and `count: null`), `POST` a new series, `PUT` later detached events to relink them |
| Delete | single: `PUT` with `excludedDates` · following: `PUT` with `until`, `DELETE` its later detached events · all: `DELETE` detached events, then the series · plain: `DELETE /events/:id` |
| Search | `GET /events/search?q=…&calendarId=…` (optional: without it the component searches the last and next year via `GET /events`) |
| Answer as attendee | `POST /events/:id/response` with `{ status }` |
| Change only own reminders | `PUT /events/:id/reminders` with `{ reminders }` (also for members without edit rights) |
| Answer from an email link | `POST /events/respond` with `{ token, status }`, no session needed |
| Event chat | `GET`/`POST /events/:id/chat?date=…`, `POST /events/:id/chat/read`, `PATCH`/`DELETE /chat/messages/:id`, `GET /chat/unread?calendarId=…`, WebSocket `/chat/socket` |
| Subscription link | `GET`, `POST` (new link), `DELETE /calendars/:id/feed`. The link points at your `GET /feeds/:token.ics` |
| Reminders | `GET /events` for the next four weeks of all calendars, every five minutes while the widget is open |
| Import .ics | `GET /events` for the whole calendar, then `PUT` for known `uid`s and `POST` for new ones |
| Settings, colors | `PATCH /preferences`, `POST /colors`, `DELETE /colors/:rrggbb` |
| Holidays (only with `holiday-source="backend"`) | `GET /holidays?from=…&to=…&region=DE-NW&lang=de`, answer `PublicHoliday[]` |
| Sign-in, teams, invitations | `/auth/*`, `/calendars`, `/teams/*`, `/invitations/*`, see the OpenAPI file |

Before editing "following" or "all" of a series, the component loads its detached events with `GET /events?seriesId=…`.

### Rules for the backend

- **Sessions:** requests use `credentials: 'include'`. Set an `HttpOnly` cookie on sign-in. If the widget runs on another domain: CORS for that origin with `Access-Control-Allow-Credentials: true`, allowed headers `Content-Type`, `Accept`, `Accept-Language`, `Authorization`, `X-Calendar-Tenant`, and the cookie as `SameSite=None; Secure`. Answer `401` when the session is gone.
- **Errors:** always `{ code, message }`. Known codes such as `invalidCredentials`, `emailTaken`, `forbidden`, `lastOwner` are shown translated, others with `message`.
- **Language:** every request carries `Accept-Language`. Use it, or the stored `locale`, for emails.
- **Emails about events** (your backend sends them, the component only stores the user's choice): an invitation with yes / maybe / no links to `/respond?status=accepted&token=…` when someone is added as attendee (`emailInvites`), a notice when title, time, place or repetition change or the event is cancelled (`emailChanges`), and reminders at the user's own reminder times even while the calendar is closed (`emailReminders`, off by default). Only to verified addresses, never to the person who made the change.
- **Subscriptions:** `GET /feeds/:token.ics` answers without a session with the calendar as iCalendar (RFC 5545) and the subscriber's own reminders. Keep one secret token per user and calendar, a new one replaces the old. Stop serving it when the user leaves the calendar.
- **Email links:** point them at the host page with the screen as parameter, e.g. `https://host.example/calendar?calendarPath=%2Freset-password%3Ftoken%3D…`.

## 11. Event chat

Events in team calendars have a **Chat** tab: every member can read and write, edit and delete their own messages, and owners, admins and managers (`manage_calendars`) can delete any message. Recurring events have one chat per occurrence. A detached occurrence keeps the chat of its original date. The calendar shows unread messages as a red badge on the event and in the tab title, and attendees can get an email about new messages (`emailChat`, on by default, at most one email per chat every few minutes).

Messages go over REST (see the OpenAPI file, tag *Chat*). New, edited and deleted messages arrive live over a WebSocket:

- **Address:** `{apiBaseUrl}/chat/socket` with `ws://` or `wss://`, derived from `apiBaseUrl` (relative addresses use the page's host). With `tenant` the tenant is added as `?tenant=…`, because browsers cannot set headers on WebSockets. `restDataSource` takes another address as `chatSocketUrl`.
- **Sign-in:** the session cookie is sent with the handshake. Check the `Origin` header against the allowed origins and answer `401` without a session.
- **Server → client** (JSON text frames): `{ "type": "message.created" | "message.updated", "message": ChatMessage }` and `{ "type": "message.deleted", "id", "calendarId", "eventId", "occurrenceDate" }`, sent to every connected member of the calendar's team.
- **Client → server:** only `{ "type": "ping" }` every 25 seconds, answer with `{ "type": "pong" }` or ignore it.
- The component reconnects with growing pauses (1 to 30 seconds) and reloads the open chat and the unread counts after reconnecting, so a lost connection only delays messages.

Emails link to the host page with `?calendar=…&event=…&date=…&tab=chat`, which opens the event with the chat.

Without a WebSocket on your backend, turn the feature off: `features: { chat: false }`. The calendar then opens no connection and shows no chat.

## 12. Calendar subscriptions

With a backend that serves `/calendars/:id/feed` and `/feeds/:token.ics`, every signed-in user can subscribe to a calendar in another calendar app and see its events there, for example on the phone. Users get the link in the calendar settings: **Import & export** tab for team calendars, on the settings page for the personal calendar → **Subscribe** → **Create subscription link**. They can copy the link or open it in their calendar app.

- The subscription is **read-only**. Changes made in the other app do not come back.
- The link is **personal and secret**: it contains the user's own reminders, and anyone who has it can see all events of the calendar. **Create new link** turns the old one off, **End subscription** removes it.
- It stops working when the user leaves the calendar.

### Adding the link in calendar apps

| App | Steps |
| --- | --- |
| **Apple Calendar on Mac** | **Open in calendar app** in the settings, or *File → New Calendar Subscription…*, paste the link, **Subscribe**. Set *Auto-refresh* and choose *iCloud* as location so the calendar also appears on iPhone and iPad. |
| **Apple Calendar on iPhone / iPad** | **Open in calendar app** in the settings, or *Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar* (older iOS: *Settings → Calendar → Accounts*), paste the link as server, **Next**, **Save**. |
| **Google Calendar** | Only in the browser at calendar.google.com: next to *Other calendars* click **+** → **From URL**, paste the link, **Add calendar**. It then also shows in the Google Calendar apps on Android and iPhone. |
| **Outlook.com / Outlook on the web / new Outlook** | *Calendar → Add calendar → Subscribe from web*, paste the link, give it a name, **Import**. |
| **Classic Outlook for Windows** | *Home → Add Calendar → From Internet…* (in some versions *Open Calendar → From Internet*), paste the link, **OK**, confirm with **Yes**. |
| **Thunderbird** | *New Calendar → On the Network*, paste the link, choose the iCalendar (ICS) format. |

Menu names change between app versions. If a path does not match, look for “subscribe”, “from URL” or “from internet”.

### How quickly changes show up

A subscription is not live: the app downloads the whole calendar again at intervals that the app decides. Changes made in this calendar therefore appear with a delay:

| App | Refresh |
| --- | --- |
| Apple Calendar on Mac | Adjustable per subscription, from every 5 minutes to weekly (right-click the calendar → *Get Info* → *Auto-refresh*). *View → Refresh Calendars* (⌘R) refreshes right away. |
| Apple Calendar on iPhone / iPad | Follows *Fetch New Data* (*Settings → Apps → Calendar → Calendar Accounts → Fetch New Data*). Choose *Every 15 Minutes* or *Hourly*. Subscriptions have no push. A subscription added on the Mac with location *iCloud* is refreshed by iCloud. |
| Google Calendar | Google's own schedule, usually several hours, sometimes up to a day. Cannot be changed. |
| Outlook.com / web / new Outlook | Microsoft's own schedule, roughly every 3 hours, sometimes more than 24 hours. Cannot be changed. |
| Classic Outlook for Windows | Follows the update limit in the feed (one hour here) and Outlook's send/receive settings. |

The feed asks clients to reload every hour (`REFRESH-INTERVAL` and `X-PUBLISHED-TTL`), but most apps follow their own settings. For changes that must show up immediately, users should open this calendar directly. Two-way sync with near-instant updates would need a CalDAV server, which this component does not cover.

Without the feed endpoints, turn the feature off: `features: { subscriptions: false }`.
