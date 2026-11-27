# 10. Backend

The full contract is [`api/openapi.yaml`](../../api/openapi.yaml) (OpenAPI 3.1, also shipped as `@rokoyfa/calendar/openapi.yaml`). The essentials:

**Only what you turned on.** Your own backend needs the core endpoints and the endpoints of the features you switch on in your options or configuration file, nothing else. Every operation in the OpenAPI file carries `x-feature` with the feature it belongs to; the table in [Features](03-features.md) lists the same per feature.

| Needed | Endpoints |
| --- | --- |
| Always, as soon as there is a backend (`storageMode="remote"` or `auth`) | `GET`/`POST /events`, `PUT`/`DELETE /events/:id`, `GET /calendars`, `PATCH /calendars/:id`, `GET`/`PATCH /preferences` |
| Per feature that is on | see the column "Your backend needs" in [Features](03-features.md) |
| Sign-in through your page (`getUserToken`) | `POST /auth/token`, in a token format of your choice |
| Only for the public tenant service | `GET /tenant/config` and the rules under "Public tenant service" in the OpenAPI file |

Turn a feature off and the component never calls its endpoints: `features: { chat: false, attachments: false, trash: false }` needs neither chat, attachments nor trash on your side.

## Data types

```ts
type CalendarEvent = EventInput & {
  id: string
  calendarId: string
  createdAt: string             // ISO date-time
  updatedAt: string
  version: number               // starts at 1, goes up on every change, read-only
  request?: { status: 'pending' | 'accepted'; requester: { id: string; name: string } | null } | null // read-only, missing means null
}

type EventInput = {
  uid: string                   // stable id for iCalendar, shared by a series and its detached events
  title: string                 // 1–100 chars
  location: string              // max 200 chars, '' if none
  links: EventLink[]            // up to 10 http(s) links
  categoryIds: string[]         // up to 5 categories of the event's calendar
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
  visibility?: 'private' | 'public' // for people the personal calendar is shared with, missing means 'private'
  builtinCategories?: BuiltinCategory[] // fixed categories, independent of the calendar, missing means none
  taskId?: string | null        // set on a block planned for a task, only on single events
}

type BuiltinCategory = 'work' | 'leisure' | 'household' | 'family' | 'health' | 'sport' | 'learning'

type Attendee = { email: string; name: string; status: 'needsAction' | 'accepted' | 'tentative' | 'declined' }

type EventLink = { url: string; label: string } // url max 2000 chars, label max 100 chars, '' if none

type Recurrence = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number              // 1–99
  weekdays: number[]            // 0 = Monday … 6 = Sunday
  monthlyMode: 'dayOfMonth' | 'weekdayOfMonth' | 'lastWeekdayOfMonth'
  until: string | null          // either until or count, or neither
  count: number | null
  rule: string | null           // RRULE without UNTIL/COUNT from another program, decides the occurrences when set
  dates: string[]               // additional occurrences (RDATE) after the start, max 100
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
// Preferences also carry emailInvites, emailChanges, emailReminders, emailChat, emailTaskDue: booleans for the emails below
// and the task planning: planningDistribution ('even' | 'early' | 'late'), planningCountry ('auto' or a country such as 'DE'),
// planningDayStart and planningDayEnd ('HH:MM', at least one hour apart)
// and shareFreeBusy (boolean, default true): whether others may see when the user is busy, see section 30
type Problem = { code: string; message: string }   // every error response
```

The backend stores series as one event. The component expands occurrences itself.

**Reminders are personal.** Store them per user and event, return only the caller's own `reminders`, and keep other members' reminders when someone saves the event. The component shows reminders while it is open (browser notification or a notice in the calendar). Emails or push messages when it is closed are up to your backend.

## When the component calls your backend

| Moment | Requests |
| --- | --- |
| Widget loads | `GET /auth/me` (only with `auth`), then `GET /preferences`, `GET /colors`, `GET /calendars`, `GET /invitations` |
| Visible range changes | `GET /events?from=…&to=…&calendarId=…` with the calendars shown. The range is two days wider than the view to cover time zone shifts. Return every event in the range **and** every series that can occur in it. |
| Create event | `POST /events` with `EventInput` + `calendarId` |
| Move to another calendar | `POST /events/:id/move` with `{ calendarId }` and `If-Match`, after saving the other changes |
| Edit event / whole series | `PUT /events/:id` with the full `EventInput` |
| Edit only this occurrence | `PUT` the series with the date added to `excludedDates`, then `POST` a detached event with `seriesId` and `originalDate` |
| Edit this and following | `PUT` the series with `until` set to the day before (and `count: null`), `POST` a new series, `PUT` later detached events to relink them |
| Delete | single: `PUT` with `excludedDates` · following: `PUT` with `until`, `DELETE` its later detached events · all: `DELETE` detached events, then the series · plain: `DELETE /events/:id` |
| Search | `GET /events/search?q=…&calendarId=…` (optional: without it the component searches the last and next year via `GET /events`) |
| Answer as attendee | `POST /events/:id/response` with `{ status }` |
| Change only own reminders | `PUT /events/:id/reminders` with `{ reminders }` (also for members without edit rights) |
| Answer from an email link | `POST /events/email-response` with `{ token, status }`, no session needed |
| Data export | `GET /auth/me/export` from the "Data" tab in the settings, answered with a JSON file |
| Trash | `GET /calendars/:id/trash` in the calendar settings, `POST /events/:id/restore`, `DELETE /calendars/:id/trash/:eventId`, `DELETE /calendars/:id/trash` to empty it. Undo after deleting also calls `POST /events/:id/restore` |
| Live updates | WebSocket `/chat/socket`, opened while the calendar is shown. After an `event.changed` message for a shown calendar, the component reloads the events of the visible range |
| Event chat | `GET`/`POST /events/:id/chat?date=…`, `POST /events/:id/chat/read`, `PATCH`/`DELETE /chat/messages/:id`, `GET /chat/unread?calendarId=…`, WebSocket `/chat/socket` |
| Categories | `GET /categories?calendarId=…` with the calendars shown, `POST /calendars/:id/categories`, `PATCH` and `DELETE /categories/:id`. Events carry `categoryIds` |
| Attachments | `GET` and `POST /events/:id/attachments` (multipart, field `file`), `GET /attachments/:id/content`, `DELETE /attachments/:id`. Events carry a read-only `attachmentCount` |
| Public link | `GET`, `POST` (new link), `DELETE /calendars/:id/share`. The page behind the link calls `GET /shared/:token` and `GET /shared/:token/events?from=…&to=…` without a session |
| Subscription link | `GET`, `POST` (new link), `DELETE /calendars/:id/feed`. The link points at your `GET /feeds/:token.ics` |
| Reminders | `GET /events` for the next four weeks of all calendars, every five minutes while the widget is open |
| Import .ics | `GET /events` for the whole calendar, then `PUT` for known `uid`s and `POST` for new ones |
| Settings, colors | `PATCH /preferences`, `POST /colors`, `DELETE /colors/:rrggbb` |
| Holidays (only with `holiday-source="backend"`) | `GET /holidays?from=…&to=…&region=DE-NW&lang=de`, answer `PublicHoliday[]` |
| Sign-in, teams, invitations | `/auth/*`, `/calendars`, `/teams/*`, `/invitations/*`, see the OpenAPI file |
| Two-factor sign-in | `POST /auth/login` may answer `202` with `{ twoFactorRequired, challenge }`, then `POST /auth/login/two-factor`. The page `/two-factor` calls `GET /auth/two-factor`, `POST /auth/two-factor/setup`, `/confirm`, `/recovery-codes` and `DELETE /auth/two-factor` |
| Devices | "Security" tab in the settings: `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions` |
| Subscribed calendars | `GET /external-calendars` on start, `GET /external-calendars/:id/ics` for every shown one and again every 15 minutes, `POST`, `PATCH` and `DELETE /external-calendars/:id` from the settings |
| Change history | `GET /events/:id/history` when the "History" tab of an event is opened |
| Notifications | `GET /notifications` on start, `notification.created` over the WebSocket, `POST /notifications/read`, `DELETE /notifications/:id` |
| Overlap note | `GET /events` for the day before to the day after the edited event, while the dialog is open |
| Booking pages | "Booking pages" tab of the calendar settings: `GET`/`POST /calendars/:id/booking-pages`, `PATCH`/`DELETE /booking-pages/:id`, `POST /booking-pages/:id/renew`. The public page calls `GET /booking/:token`, `GET /booking/:token/slots?from=…&to=…` and `POST /booking/:token`, the pages behind the email links `POST /bookings/confirm`, `/bookings/lookup` and `/bookings/cancel`, all without a session |
| Sharing the personal calendar | "Sharing" tab of the personal calendar: `GET`/`PUT /personal-sharing`, `POST /personal-sharing/viewers`, `DELETE /personal-sharing/viewers/:id`. People it is shared with: `GET /peer-calendars` on start, `POST /peer-calendars/:id/accept` or `/decline`, `PATCH`/`DELETE /peer-calendars/:id`, `GET /peer-calendars/:id/events?from=…&to=…` for every shown one, `POST /peer-calendars/:id/requests`, `PUT`/`DELETE /peer-calendars/:id/requests/:eventId`. The owner answers with `POST /events/:id/request/accept` or `/decline` |

Before editing "following" or "all" of a series, the component loads its detached events with `GET /events?seriesId=…`.

## Rules for the backend

- **Security:** the rules under "Public tenant service" in `api/openapi.yaml` (host tokens, sessions, origin checks, `404` for items of others) are binding for the tenant service. For your own backend they are a good checklist, not a requirement.
- **Sessions:** requests use `credentials: 'include'`. Set an `HttpOnly` cookie on sign-in. If the widget runs on another domain: CORS for that origin with `Access-Control-Allow-Credentials: true`, allowed headers `Content-Type`, `Accept`, `Accept-Language`, `Authorization`, `If-Match`, `X-Calendar-Tenant`, and the cookie as `SameSite=None; Secure`. Answer `401` when the session is gone.
- **Errors:** always a `Problem` `{ code, message }` with a code from the table in `api/openapi.yaml` (status and meaning per code). The component translates known codes and shows `message` for others.
- **Language:** every request carries `Accept-Language`. Use it, or the stored `locale`, for emails.
- **Emails about events** (your backend sends them, the component only stores the user's choice): an invitation with yes / maybe / no links to `/respond?status=accepted&token=…` when someone is added as attendee (`emailInvites`), a notice when title, time, place or repetition change or the event is cancelled (`emailChanges`), and reminders at the user's own reminder times even while the calendar is closed (`emailReminders`, off by default). Only to verified addresses, never to the person who made the change.
- **Subscriptions:** `GET /feeds/:token.ics` answers without a session with the calendar as iCalendar (RFC 5545), the subscriber's own reminders and the category names as `CATEGORIES` (comma-separated, with `,` and `;` inside a name escaped as `\,` and `\;`). Keep one secret token per user and calendar, a new one replaces the old. Stop serving it when the user leaves the calendar.
- **Version:** this is version 2 of the REST contract (`api/openapi.yaml`, `info.version`). Serve it under a versioned base path such as `/api/v2` and set `apiBaseUrl` / `api-base-url` to it, so a later major version can run next to it.
- **Rate limits:** any endpoint may answer `429` with `Retry-After` (seconds or HTTP date) and the code `rateLimited` or a more specific one. The component shows how long to wait. Cross-origin backends must list `Retry-After` in `Access-Control-Expose-Headers`.
- **Editing at the same time:** every event has a `version` that starts at 1. Raise it on every `PUT`, attendee response and removed category, but not when someone only changes their own reminders. `PUT` and `DELETE /events/:id` send `If-Match: "<version>"` with the version the user saw, but only when your events carry a `version`; without it nothing changes for your backend. If the event has a newer version, answer `412` with `eventChanged` and change nothing. The dialog then offers to save anyway (sent without `If-Match`) or to load the current version. Without `If-Match`, or with `*`, skip the check.
- **Categories:** belong to one calendar, names are unique per calendar without regard to case. Reject an event whose `categoryIds` are not from its calendar, and remove a deleted category from all events.
- **Attachments:** at most 10 MB per file and 20 per event. Store the files outside the database, keep only the file name, and serve them with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` and a sandboxing `Content-Security-Policy`, because uploaded files are untrusted. Delete them together with their event, calendar or team. Never hand them out through public links or subscription feeds.
- **Public links:** one unguessable token per calendar. `GET /shared/:token/events` must leave out everything personal: empty `attendees` and `reminders`, no `createdBy`, and never chat messages. A new link, or stopping the share, must make the old token fail at once.
- **Booking pages:** see [Booking pages](27-booking-pages.md). The page token is as secret as a public link; the confirm and cancel tokens of a booking are stored only as hashes. Never show the booker who else booked, and never show the owner's events on the public page, only free times.
- **Data export:** `GET /auth/me/export` returns everything stored about the signed-in user as JSON (see `AccountExport` in the OpenAPI file). Leave out password hashes, sessions, tokens and secret links, and never include other people's events or messages.
- **Trash:** `DELETE /events/:id` moves the event to the trash instead of deleting it, together with the detached events of a series. Keep attachments, chat and email response links. Deleted events must no longer appear anywhere else: lists, search, feeds, public links, reminders. Restoring keeps the id and raises `version`; refuse a detached event whose series is still in the trash with `409 seriesDeleted`. After 30 days delete the event for good with its attachments and chat, and do the same at once when its calendar or team is deleted.
- **Live updates:** after every change to an event (create, `PUT`, `DELETE`, attendee response, attachment added or removed, category removed) send `{ "type": "event.changed", "calendarId", "eventId", "version", "changedBy" }` over the WebSocket to every connected member of the calendar's team. `version` is the new version, `null` when the event was deleted. `changedBy` is the user id, or `null` for changes without a session such as answers from an email link. Send one message per event, also for detached events deleted with their series.
- **Email links:** point them at the host page with the screen as parameter, e.g. `https://host.example/calendar?calendarPath=%2Freset-password%3Ftoken%3D…`.
- **Two-factor sign-in:** TOTP after RFC 6238 (SHA-1, 6 digits, 30 seconds, ±1 step). Store the secret encrypted and accept every 30-second step only once. Recovery codes and the challenge between password and code are stored as hashes; the challenge lives 10 minutes and 5 attempts. Turning the two-factor sign-in on ends all other sessions. The confirmation mail after registration should link to the page `/two-factor` of the component, so users can turn it on right away.
- **Subscribed calendars:** load the address on the server, never in the browser, and protect that against SSRF: only `https` (turn `webcal://` into `https://`), port 443, resolve the name and refuse private, loopback, link-local and multicast addresses, connect to exactly the address you checked, check every redirect again, limit time and size (the test backend uses 10 seconds and 5 MB). Keep a copy for 15 minutes. The full address can contain a private key: store it encrypted and only return its host.
- **CalDAV accounts:** the same SSRF protection for every request, also for the principal, calendar home and calendar addresses the other server names. Store address, user name and password encrypted (for example AES-256-GCM bound to the account and field), never return the password, and send it only to that server. Synchronize with `sync-collection` where the server offers it and `getctag`/`getetag` otherwise; write with `If-None-Match: *` for new objects and `If-Match` for changes.
- **CalDAV server:** accept only app passwords (random, at least 100 bits, stored as a hash), count failures like sign-in attempts, refuse DTDs and entities in XML, limit body size and depth, and decide every request with the same roles as the REST endpoints. Details in `api/caldav.md`.
- **Change history:** record who changed which field of an event, one entry per request. Changes to attendees, links, categories and the repetition are listed by name only. Keep the history for a year.
- **Notifications:** create them for invitations to a team or an event, changes and cancellations of events someone is invited to, replies to the creator, chat messages and reminders. Never for one's own actions, and for people only invited by email only once their address is confirmed. Send `{ "type": "notification.created", "notification" }` over the WebSocket to the user.

---

[← Previous](09-exported-types.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](11-event-chat.md)
