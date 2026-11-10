# @rokoyfa/calendar

An embeddable calendar for React apps and any other website.

- Day, week, month and year views, drag to select a time range (long-press on touch devices)
- Recurring events (daily, weekly, monthly, yearly) with "this / following / all" editing
- Works without a backend (data stays in the browser) or with your own REST backend
- Accounts, team calendars with roles and email invitations when a backend is connected
- English and German, with week start, week numbers and 12/24-hour time taken from the user's region
- Light and dark theme, responsive to the size of the widget instead of the window
- Fully isolated in a Shadow DOM: the page's CSS does not leak in and the calendar's CSS does not leak out

Two ways to use it, both from the same package:

| | For | How |
| --- | --- | --- |
| React component `<Calendar />` | React 19 apps | `npm install @rokoyfa/calendar` |
| Web component `<calendar-widget>` | Any page: plain HTML, WordPress, Vue, Angular … | one `<script>` tag, React is bundled |

## Quick start

### Plain HTML (script tag)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@0.1/dist-lib/cdn/calendar-widget.js"></script>

<calendar-widget style="height: 700px"></calendar-widget>
```

That's it. Without further attributes the calendar stores everything in the visitor's browser (localStorage).

### React

```bash
npm install @rokoyfa/calendar
```

```tsx
import { Calendar } from '@rokoyfa/calendar'

export function Page() {
  return <Calendar style={{ height: 700 }} />
}
```

`react` and `react-dom` (19.x) are peer dependencies. No CSS import is needed, styles ship inside the component.

**Give the calendar a height.** It fills its box and scrolls inside it.

## Options

Every option exists as a React prop. Most also exist as an attribute of `<calendar-widget>`.

| Prop | Attribute | Default | Description |
| --- | --- | --- | --- |
| `locale` | `locale` | browser language | `en-US`, `en-GB`, `de-DE`, … Other languages fall back to English with the user's region. |
| `theme` | `theme` | system | `light` or `dark`. Applies while the user's own setting is "Automatic". |
| `initialView` | `initial-view` | user setting | `day`, `week`, `month` or `year` |
| `storageMode` | `storage-mode` | `local` | `local` (browser) or `remote` (REST backend) |
| `apiBaseUrl` | `api-base-url` | `/api` | Base URL of the REST backend |
| `apiTimeoutMs` | `api-timeout-ms` | `10000` | Timeout per request |
| `features.auth` | `auth` | off | Sign-in and registration inside the widget. Needs a backend. |
| `features.teams` | `teams` | on | Team calendars, invitations and the calendar switcher. `teams="false"` turns them off. |
| `tenant` | `tenant` | – | Public tenant id for a multi-tenant backend, see [Tenants](#tenants-and-sign-in-through-the-host-page) |
| `getUserToken` | property `getUserToken` | – | Sign in with a token from the host page instead of widget accounts |
| `dataSource` | property `dataSource` | – | Custom data adapter, see [Data sources](#data-sources) |
| `initialPath` | `initial-path` | `/` | Screen to open, e.g. `/settings` |
| `linkParam` | `link-param` | `calendarPath` | URL parameter the widget reads its start screen from, so links in emails can open e.g. the password reset. `false` turns it off. |
| `routing` | – | `memory` | `memory` keeps the page URL untouched. `browser` lets the calendar own the URL (full-page apps only). |
| `basename` | – | – | Path prefix with `routing="browser"` |
| `onEventCreate`, `onEventUpdate`, `onEventDelete` | events `event-create`, `event-update`, `event-delete` | – | Called after every stored change with the event (or `{ id }` when deleted) |
| `className`, `style` | `class`, `style` | – | Size and placement on your page |

Boolean attributes are on when present (`auth`) and off with `="false"`.

### Reacting to changes

```tsx
<Calendar onEventCreate={(event) => console.log('created', event.title, event.startDate)} />
```

```js
document.querySelector('calendar-widget').addEventListener('event-create', (e) => console.log(e.detail))
```

Editing a recurring series can store several changes at once (for example splitting a series), so one user action may fire more than one callback.

## Data sources

Where data lives is decided by a data source. The component stays the same.

```tsx
import { Calendar, localDataSource, restDataSource } from '@rokoyfa/calendar'

<Calendar dataSource={localDataSource()} />
<Calendar dataSource={restDataSource({ baseUrl: 'https://api.example.com' })} />
```

| Data source | Behaviour |
| --- | --- |
| `localDataSource()` | Everything in the browser, no sign-in. Default. |
| `restDataSource({ baseUrl, timeoutMs?, auth?, headers?, getAccessToken?, getUserToken? })` | Talks to a backend that implements [`api/openapi.yaml`](api/openapi.yaml). With `auth: true` (default) users sign in inside the widget; guests keep working in the browser. With `auth: false` every request goes to the backend, e.g. with `getAccessToken` returning your own bearer token. |
| `tenantDataSource({ tenant, baseUrl, getUserToken? })` | `restDataSource` for a multi-tenant backend, sends `X-Calendar-Tenant` |
| your own | Implement `CalendarDataSource`. All interfaces (`EventRepository`, `CalendarRepository`, `PreferencesRepository`, `ColorRepository`, `AuthRepository`) and data types are exported. |

```ts
import { localDataSource, type CalendarDataSource } from '@rokoyfa/calendar'

const myDataSource: CalendarDataSource = {
  connect: (session, context) => ({ ...localDataSource().connect(session, context), events: myEventRepository }),
}
```

`connect` is called again when the user signs in or out. `createAuthRepository` is optional; without it there is no sign-in.

With the web component, set the property from JavaScript:

```js
document.querySelector('calendar-widget').dataSource = myDataSource
```

## Using your own backend

The REST contract is published as **OpenAPI 3.1** in [`api/openapi.yaml`](api/openapi.yaml) (also inside the package as `@rokoyfa/calendar/openapi.yaml`): authentication, events, calendars, teams, invitations, preferences, error codes and permissions.

```html
<calendar-widget storage-mode="remote" auth api-base-url="https://api.example.com" style="height: 700px"></calendar-widget>
```

Things to know when the widget runs on another domain than your backend:

- Requests use `credentials: 'include'`. The backend must answer CORS for the host page's origin with `Access-Control-Allow-Credentials: true` and allow the headers `Content-Type`, `Accept`, `Accept-Language`, `Authorization` and `X-Calendar-Tenant`.
- A session cookie must be `SameSite=None; Secure`. Browsers that block third-party cookies will still drop it, so for cross-site embedding prefer a bearer token (`getAccessToken`) or host sign-in (`getUserToken`).
- Errors are `{ "code": "…", "message": "…" }`. Known codes are shown translated, others with their message.
- Every request sends `Accept-Language`, so your emails can match the user's language.

**Links in emails** (confirm email, reset password, invitations): point them at the page that hosts the widget and add the screen as a parameter, for example `https://your-site.example/calendar?calendarPath=%2Freset-password%3Ftoken%3D…`. The widget opens that screen.

## Tenants and sign-in through the host page

For a backend that serves several websites, pass a public tenant id. Every request then carries `X-Calendar-Tenant`.

```html
<calendar-widget tenant="acme" api-base-url="https://api.example.com" style="height: 700px"></calendar-widget>
```

If your site already has its own users, let the widget sign them in with a short-lived token signed by your server:

```js
document.querySelector('calendar-widget').getUserToken = async () => (await fetch('/calendar-token')).text()
```

```tsx
<Calendar tenant="acme" apiBaseUrl="https://api.example.com" getUserToken={() => fetch('/calendar-token').then((r) => r.text())} />
```

The widget exchanges the token at `POST /auth/token` for a session and repeats this when the session expires. Sign-in, registration, password screens and the sign-out button are hidden in this mode. Return `null` when nobody is signed in on your page; the widget then works as a guest in the browser.

## Languages and regions

English is the default, German is included. The language comes from, in this order: the user's own setting in the widget, the `locale` option, the browser, `en-US`.

Formats follow the region: `en-US` starts weeks on Sunday with 12-hour time and US week numbers, `en-GB` and `de-DE` start on Monday with 24-hour time and ISO week numbers. Abbreviations are translated too (`Wk 45` / `KW 45`).

## Isolation and sizing

- The calendar renders into a Shadow DOM. Your page's styles cannot break it and its styles cannot change your page.
- Breakpoints use container queries, so a narrow widget on a wide screen gets the compact layout.
- Several widgets on one page are independent. Widgets in `local` mode on the same page share the browser storage.
- With `routing="memory"` (default) the calendar never changes your page's URL.

## Version

```ts
import { VERSION } from '@rokoyfa/calendar'
```

```js
customElements.get('calendar-widget').version
```

Pin a version on the CDN with the full number (`@rokoyfa/calendar@0.1.0`) or follow patch releases with `@0.1`. See [CHANGELOG.md](CHANGELOG.md).

## Browser support

Current Chrome, Edge, Firefox and Safari (ES2022, Shadow DOM, constructable stylesheets, container queries).

## Development

Building, the test backend, the database schema and all internals are described (in German) in [DEVELOPMENT.md](DEVELOPMENT.md).

## License

[MIT](LICENSE) © Rokoyfa
