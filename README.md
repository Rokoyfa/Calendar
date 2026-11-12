# @rokoyfa/calendar

An embeddable calendar for React apps and any other website. Day, week, month and year views, recurring events, team calendars with roles and invitations. English, German, French, Spanish, Italian, Dutch, Polish and Portuguese built in, more through your own texts. Runs without a backend (data stays in the browser) or against your own REST backend. Styles are isolated in a Shadow DOM, so the host page and the calendar never affect each other.

## Setup

**Any website**, React is bundled:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@1/dist-lib/cdn/calendar-widget.js"></script>

<calendar-widget style="height: 700px"></calendar-widget>
```

**React 19**:

```bash
npm install @rokoyfa/calendar
```

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar style={{ height: 700 }} />
```

Give the calendar a height, it fills its box. No CSS import is needed.

## Examples

```html
<!-- German, dark, month view -->
<calendar-widget locale="de-DE" theme="dark" initial-view="month" style="height: 600px"></calendar-widget>

<!-- Your backend with sign-in -->
<calendar-widget storage-mode="remote" auth api-base-url="https://api.example.com" style="height: 700px"></calendar-widget>
```

```tsx
<Calendar
  storageMode="remote"
  apiBaseUrl="https://api.example.com"
  features={{ auth: true, teams: false }}
  onEventCreate={(event) => console.log('created', event)}
/>
```

```js
document.querySelector('calendar-widget').addEventListener('event-create', (e) => console.log(e.detail))
```

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `locale` | `locale` | browser | `en-US`, `de-DE`, `fr-FR`, `pt-BR`, … Formats follow the region |
| `messages` | property | – | Own texts per language, see below |
| `theme` | `theme` | system | `light`, `dark` |
| `initialView` | `initial-view` | user setting | `day`, `week`, `month`, `year` |
| `timeZone` | `time-zone` | browser | IANA zone the calendar is shown in, e.g. `Europe/Berlin`. New events start in it. A zone the user picks in the settings takes precedence |
| `holidays` | `holidays` | from `locale` | Public holidays to show: country or region code such as `DE`, `DE-NW`, `AT`, `US-CA`, or `off`. Users can override it in the settings |
| `mapUrl` | `map-url` | Google Maps | Map service for locations, with `{query}` for the place, e.g. `https://www.openstreetmap.org/search?query={query}` or `https://maps.apple.com/?q={query}` |
| `holidaySource` | `holiday-source` | `library` | `library` computes holidays in the browser, `backend` asks your backend (`GET /holidays`) and falls back to the library |
| `storageMode` | `storage-mode` | `local` | `local` or `remote` |
| `apiBaseUrl` | `api-base-url` | `/api` | Base URL of your backend |
| `features` | `auth`, `teams` | auth off, teams on | `teams="false"` turns team features off |
| `tenant`, `getUserToken` | `tenant`, property | – | Multi-tenant backend, sign-in through your own page |
| `dataSource` | property | – | Custom data adapter instead of REST |
| `onEventCreate` / `Update` / `Delete` | `event-create` / `-update` / `-delete` | – | After every stored change |

**Own texts and languages.** Override single texts or add a language. Missing texts fall back to the built-in language, or to English for a new one. The full list of keys is the `Messages` type.

```js
document.querySelector('calendar-widget').messages = {
  de: { calendar: { newEvent: 'Neuer Eintrag' } },
  sv: { calendar: { today: 'Idag', newEvent: 'Ny händelse' }, views: { weekNumber: (week) => `V. ${week}` } },
}
```

The CDN build loads languages other than English on demand from files next to `calendar-widget.js`. When hosting it yourself, copy the whole `dist-lib/cdn` folder.

**Demo:** [`demo/cdn.html`](demo/cdn.html) shows local mode with an event log, a dark German month view and a compact widget. Download it and open it in a browser, it loads the published package from jsDelivr.

## Calendar subscriptions

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

## Building your own backend

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
// Preferences also carry emailInvites, emailChanges, emailReminders: booleans for the emails below
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

Building, the test backend and all internals are described in German in [DEVELOPMENT.md](DEVELOPMENT.md).

## License

[MIT](LICENSE) © Rokoyfa

Public holiday data comes from [date-holidays](https://github.com/commenthol/date-holidays) (code ISC, data [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)). It is loaded only when holidays are shown.
