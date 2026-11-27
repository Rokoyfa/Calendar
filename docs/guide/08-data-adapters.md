# 8. Data adapters

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
| `restDataSource(options)` | Talks to the [REST API](../../api/openapi.yaml) |
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
| `chat` | `true` | `false` turns the chat off |
| `liveUpdates` | `true` | `false` turns live updates of events off. Without chat and live updates no WebSocket is opened |
| `chatSocketUrl` | from `baseUrl` | Address of the WebSocket, used by the chat and live updates |

Note that `restDataSource` defaults to `auth: true`, while the `auth` feature of the component defaults to off.

## Your own adapter

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
    categories: myCategories,
    shared: mySharedCalendars,
  }),
}
```

- `connect` returns the repositories for the current state. It is called again on sign-in and sign-out.
- `createAuthRepository` is optional. Without it there is no sign-in in the widget.
- `holidays`, `chat`, `categories` and `shared` are optional. Without `chat` there is no chat, without `categories` no categories, without `shared` public links cannot be opened, and without `holidays` they are computed in the browser.
- `mode: 'remote'` makes the calendar offer to move local events into the account after sign-in.
- Optional methods switch their feature on: `events.search`, `events.respond`, `events.setReminders`, `events.subscribe` (live updates), `events.listTrash` / `restore` / `purge` (trash), `events.move` (moving events to another calendar), `calendars.getFeed` / `createFeed` / `deleteFeed`, `calendars.getShare` / `createShare` / `deleteShare`. Without `search` the calendar searches the last and next year itself.
- Call `onUnauthorized` when a session has run out. `getLanguage` returns the current language for your requests.
- Errors with a known `code` are shown translated, others with their `message`.
- `events.update(id, input, version)` and `events.remove(id, version)` get the `version` the user saw. Throw an error with code `eventChanged` if the stored event is newer; without `version`, save without checking.

A simple start is to take most repositories from `localDataSource()` and replace only `events`:

```ts
const local = localDataSource()

const myDataSource: CalendarDataSource = {
  connect: (session, context) => ({ ...local.connect(session, context), events: myEvents }),
}
```

---

[← Previous](07-sign-in-and-tenants.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](09-exported-types.md)
