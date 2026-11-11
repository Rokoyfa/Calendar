# @rokoyfa/calendar

An embeddable calendar for React apps and any other website. Day, week, month and year views, recurring events, team calendars with roles and invitations. English, German, French, Spanish, Italian, Dutch, Polish and Portuguese built in, more through your own texts. Runs without a backend (data stays in the browser) or against your own REST backend. Styles are isolated in a Shadow DOM, so the host page and the calendar never affect each other.

## Setup

**Any website**, React is bundled:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@0.1/dist-lib/cdn/calendar-widget.js"></script>

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
| `timeZone` | `time-zone` | browser | IANA zone the calendar is shown in, e.g. `Europe/Berlin` |
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
  title: string                 // 1–100 chars
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
}

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
type Preferences = { theme: 'system' | 'light' | 'dark'; defaultView: View; mobileDefaultView: View; locale: string }
type Problem = { code: string; message: string }   // every error response
```

The backend stores series as one event. The component expands occurrences itself.

### When the component calls your backend

| Moment | Requests |
| --- | --- |
| Widget loads | `GET /auth/me` (only with `auth`), then `GET /preferences`, `GET /colors`, `GET /calendars`, `GET /invitations` |
| Visible range changes | `GET /events?from=…&to=…&calendarId=…` with the calendars shown. The range is one day wider than the view to cover time zone shifts. Return every event in the range **and** every series that can occur in it. |
| Create event | `POST /events` with `EventInput` + `calendarId` |
| Edit event / whole series | `PUT /events/:id` with the full `EventInput` |
| Edit only this occurrence | `PUT` the series with the date added to `excludedDates`, then `POST` a detached event with `seriesId` and `originalDate` |
| Edit this and following | `PUT` the series with `until` set to the day before (and `count: null`), `POST` a new series, `PUT` later detached events to relink them |
| Delete | single: `PUT` with `excludedDates` · following: `PUT` with `until`, `DELETE` its later detached events · all: `DELETE` detached events, then the series · plain: `DELETE /events/:id` |
| Settings, colors | `PATCH /preferences`, `POST /colors`, `DELETE /colors/:rrggbb` |
| Sign-in, teams, invitations | `/auth/*`, `/calendars`, `/teams/*`, `/invitations/*`, see the OpenAPI file |

Before editing "following" or "all" of a series, the component loads its detached events with `GET /events?seriesId=…`.

### Rules for the backend

- **Sessions:** requests use `credentials: 'include'`. Set an `HttpOnly` cookie on sign-in. If the widget runs on another domain: CORS for that origin with `Access-Control-Allow-Credentials: true`, allowed headers `Content-Type`, `Accept`, `Accept-Language`, `Authorization`, `X-Calendar-Tenant`, and the cookie as `SameSite=None; Secure`. Answer `401` when the session is gone.
- **Errors:** always `{ code, message }`. Known codes such as `invalidCredentials`, `emailTaken`, `forbidden`, `lastOwner` are shown translated, others with `message`.
- **Language:** every request carries `Accept-Language`. Use it, or the stored `locale`, for emails.
- **Email links:** point them at the host page with the screen as parameter, e.g. `https://host.example/calendar?calendarPath=%2Freset-password%3Ftoken%3D…`.

Building, the test backend and all internals are described in German in [DEVELOPMENT.md](DEVELOPMENT.md).

## License

[MIT](LICENSE) © Rokoyfa
