# Changelog

All notable changes to `@rokoyfa/calendar`. Versions follow [Semantic Versioning](https://semver.org/). From 1.0 on, breaking changes to props, attributes, DOM events, exported types, the data adapter and the REST contract only come with a new major version.

## 2.0.0 – 2026-11-20

Version 2 of the REST contract. Three endpoints have clearer paths, and host tokens follow stricter rules; everything else stays compatible.

### Breaking changes

| 1.x | 2.0 |
| --- | --- |
| `DELETE /trash/:id` | `DELETE /calendars/:calendarId/trash/:eventId` |
| `POST /events/respond` | `POST /events/email-response` |
| `PUT /calendars/:calendarId/settings` | `PUT /calendars/:calendarId/display` |
| `events.purge(id)` in custom adapters | `events.purge(calendarId, id)` |
| Tenant service: host token claim `tenant`, any signing algorithm | Claims `iss` (tenant id), `aud: rokoyfa-calendar`, `iat`, `jti`, header `kid`; only `ES256`, `EdDSA`, `RS256`; at most 5 minutes valid and accepted once |

### Added

- Tenant settings from the backend: with `tenant` set, the calendar loads `GET /tenant/config`, and what it sets wins over the page settings (features, look, language, views). Storage, connection and link settings stay with the page, and sign-in is always on. With `storageMode="local"` the tenant is ignored
- New feature switch `registration` to hide the sign-up page, and the error code `featureDisabled` for features a tenant turned off
- Rate limits: a `429` from any endpoint is shown as "Too many requests" with the waiting time from `Retry-After`, new code `rateLimited`
- `x-feature` on every operation in `api/openapi.yaml` and a table in the developer guide: a self-hosted backend only needs the core endpoints and those of the features it turns on
- New error codes `uidTaken` (another event in the calendar has the same `uid`), `tenantLimitReached` (user, team or attachment limit of a tenant) and `emailNotVerified` (invitations need a confirmed address), translated in all languages
- `GET /invitations` is empty and accepting an invitation answers `403` `emailNotVerified` while the own address is not confirmed; this also applies to addresses from host tokens
- Security rules for the public tenant service in `api/openapi.yaml` (recommendations for self-hosted backends): host token checks, sessions bound to their tenant with fixed lifetimes, `Origin` check on every change, `404` for items of other tenants, rate limits on sign-in, hashed link tokens, attachments only after a malware scan
- Developer guide: how a host signs user tokens (key pair, claims, example with `jose`) and keeps its tenant safe
- `api/openapi.yaml`: table of all error codes with status and meaning, `401` on every endpoint that needs a session, consistent path parameter names (`eventId` instead of `id`), and a note on serving the API under a versioned base path such as `/api/v2`
- Two-factor sign-in (feature `twoFactor`): page `/two-factor` with QR code, key for typing in and ten recovery codes, a code step after the password, new recovery codes and turning it off again. Endpoints `POST /auth/login/two-factor` and `/auth/two-factor*`; `POST /auth/login` answers `202` with a `challenge` when a code is needed. The confirmation mail of the test backend links to the page
- Signed-in devices in **Settings → Security**: list with browser, system and last use, sign out one device or all others (`GET /auth/sessions`, `DELETE /auth/sessions/:id`, `DELETE /auth/sessions`)
- Agenda view (`agenda`): the next 30 days as a list, shortcut `A`
- Subscribed calendars (feature `externalCalendars`): up to 10 iCal addresses per user, shown read-only next to the own calendars and loaded by the backend (`/external-calendars*`)
- Change history (feature `history`): "History" tab of events in team calendars (`GET /events/:id/history`)
- Notifications (feature `notifications`): bell with invitations, changes, cancellations, replies, chat messages and reminders, live over the WebSocket (`/notifications*`, `notification.created`)
- New settings tab **Connections** with subscribed calendars, CalDAV accounts and the access for CalDAV programs. Subscribed calendars moved there from **Calendars**
- CalDAV server (feature `caldav`): app passwords for Apple Calendar, Thunderbird, DAVx⁵ and others (`/auth/app-passwords*`, `GET /caldav`), protocol in `api/caldav.md`
- CalDAV accounts (feature `caldavAccounts`): calendars of Nextcloud, iCloud and other CalDAV services next to the own ones, editable, synchronized by the backend (`/caldav-accounts*`, `/caldav-calendars*`)
- New error codes `invalidTwoFactorCode`, `twoFactorExpired`, `twoFactorAlreadyEnabled`, `twoFactorNotEnabled`, `invalidCalendarUrl`, `alreadySubscribed`, `tooManyExternalCalendars`, `externalCalendarUnavailable`, `tooManyAppPasswords`, `tooManyCaldavAccounts` and `caldavAuthFailed`, translated in all languages
- `User` carries `twoFactorEnabled` and `hasPassword`
- Repetitions from other programs that the simple fields cannot describe (for example "last working day of the month" or "on the 1st and 15th") are shown exactly and kept unchanged: `Recurrence` gains `rule` (an `RRULE` without `UNTIL` and `COUNT`) and `dates` (`RDATE`). The dialog shows them as **Custom rule** and keeps them when other details change. Import, export, CalDAV (both directions) and the test backend support them
- Calendar field in the event dialog: new events can go to any calendar with the right to add events, including writable CalDAV calendars, and existing events or whole series move to another calendar with undo. New endpoint `POST /events/{eventId}/move`, optional `EventRepository.move`
- Test backend: CalDAV also under `/dav/{tenantPublicId}/` with `TENANT_PUBLIC_ID`
- `npm run check:size`: the initial load of the CDN bundle (now 185 KB gzip) must stay under 200 KB; it runs after `build:lib`. The parsers for iCal, CalDAV objects and subscribed calendars load only when needed
- Accessibility checks with axe (WCAG 2.2 AA) for sign-in, all calendar views in light and dark, the event dialog and all settings pages in the end-to-end tests
- Exported types `Attachment`, `AttachmentRepository`, `TrashedEvent` and `EventChange` for own data adapters, and `move` as an optional method of `EventRepository`

### Changed

- Texts: the button labels for copying are now `common.copy` and `common.copied`. `caldav.server.copy`, `caldav.server.copied`, `security.twoFactor.copy`, `security.twoFactor.copied`, `calendars.share.copied` and `calendars.feed.copied` are gone; hosts that override them in `messages` use the new keys

### Fixed

- With `teams` off, the component no longer loads `GET /invitations`, so a backend without teams needs no endpoint for it
- iCal export: detached occurrences are no longer also listed as `EXDATE` (some programs hid them), `UNTIL` of zoned series is written in UTC as RFC 5545 requires, `UTC` events use the `Z` form, and every time zone used gets a `VTIMEZONE`
- iCal import: an `UNTIL` in UTC is read in the time zone of the series, so series west of UTC no longer run one day longer
- The show/hide button of password fields is translated
- `api/openapi.yaml`: `POST` and `PATCH /external-calendars` list `502` (`externalCalendarUnavailable`)
- Accessibility: events in the month view and the "more" button are at least 24 px high, links inside text are underlined, and green status badges have enough contrast
- French texts use non-breaking spaces before `? ! ; :` and inside « », Dutch calls the viewer role "Lezer"
- Copying the public link or the subscription link no longer fails silently when the browser blocks the clipboard
- The confirmations in the trash have the same button order as all other confirmations

## 1.4.0 – 2026-11-18

- Empty the trash with one button (`DELETE /calendars/:id/trash`, optional `events.emptyTrash` for custom adapters). Restore and delete for good now look different: restore in the accent color, delete in red, through the new button variant `dangerOutline`
- Keyboard: in the day and week view the time grid is reachable with `Tab`, the arrow keys pick hour and day and `Enter` creates an event there. Closing a dialog returns the focus to where it was
- Smaller start: the event dialog, settings, sign-in pages and shared calendars are loaded on demand. The npm build loads about a quarter less JavaScript at start (552 instead of 720 kB, gzip 140 instead of 169 kB). With the script tag, keep all files of `dist-lib/cdn` together
- The delete dialog no longer says "cannot be undone" when the event goes to the trash
- Browser tests with Playwright in `e2e/` (`npm run test:e2e`), run against the test backend. They are not part of the npm package

### Upgrade notes

- Backends can offer `DELETE /calendars/:id/trash` for the new "Empty trash" button. Without it the button is not shown
- With the script tag, the calendar now loads more files on demand. When hosting `dist-lib/cdn` yourself, copy the whole folder as before

## 1.3.0 – 2026-11-17

- Accessibility: arrow keys, `Home` and `End` move between events, days and month cells are labelled groups, events are announced with time, place, calendar, own response and attachments, and the period title is announced when it changes. Contrast now meets WCAG AA in both themes: darker muted text, no faded days outside the month, and dark text on event colors and the accent in dark mode (`--calendar-on-accent` defaults to dark there)
- Data export (GDPR Art. 20): a "Data" tab in the settings downloads the user's own data as JSON, from `GET /auth/me/export` when signed in or from the browser storage in local mode. New feature switch `dataExport` and optional `AuthRepository.exportData()`
- Trash: deleted events stay in the trash of their calendar for 30 days and can be restored in the calendar settings, or deleted for good. Undo after deleting now restores the event with the same id, so attachments and chat are kept. `DELETE /events/:id` moves to the trash, new endpoints `GET /calendars/:id/trash`, `POST /events/:id/restore` and `DELETE /trash/:id`, the trash is its own tab also for the personal calendar (whose settings now have tabs), with 20 entries at a time and a search from 8 entries on, new feature switch `trash` and optional `events.listTrash`, `restore` and `purge` for custom adapters
- Live updates: changes by other people, or in other tabs, show up at once. The backend sends `event.changed` over the existing WebSocket, and an open dialog says when its event was changed or deleted in the meantime. New feature switch `liveUpdates`, new `restDataSource` option `liveUpdates` and optional `events.subscribe` for custom adapters
- Protection against editing at the same time: events carry a `version`, saving and deleting send it as `If-Match`, and the backend answers `412` with `eventChanged` when someone else changed the event in the meantime. The dialog then offers to save anyway or to load the current version, and undo no longer overwrites other people's changes. Custom adapters receive the version in `events.update` and `events.remove`
- Attachments: files can be uploaded to events in the event dialog (also while creating one and by drag and drop), downloaded by everyone who can see the event and deleted by those who may edit it. Events with attachments show a paperclip. New feature switch `attachments`, new endpoints in `api/openapi.yaml`, and events carry `attachmentCount` and `createdBy`
- Categories per calendar: managed in the calendar settings, assigned in the event dialog, with a filter in the header. Events carry `categoryIds`. New feature switch `categories`
- Public read-only links: a calendar can be shared with anyone without sign-in, opened at `/shared/:token`. New feature switch `publicLinks`
- Read-only mode: `readOnly` / `read-only` shows events without letting anyone change them
- Control from the host page: `goToDate()`, `setView()`, `next()`, `previous()`, `today()`, `openEvent()`, `createEvent()`, `refresh()` and `getState()` on the element and through `ref`, plus `view-change` / `onViewChange`
- Look and feel: accent color, font, corner radius and more through `--calendar-*` CSS properties or the `appearance` option, and a compact density
- New REST endpoints for categories and sharing in `api/openapi.yaml`
- The event dialog has an Appearance tab for color and categories; categories can be created right there. The dialog is 620 px wide on larger screens
- Categories are exported to `.ics` files as `CATEGORIES` and matched by name on import, creating missing ones when allowed
- Backwards compatible with 1.2 backends: `If-Match` is only sent when the backend returns a `version` for events, undo creates a copy when `POST /events/:id/restore` is missing, and the WebSocket gives up after five failed starts

### Upgrade notes

- Backends with versions must allow `If-Match` in `Access-Control-Allow-Headers` when the calendar runs on another origin
- `DELETE /events/:id` should now move events to the trash. Without the trash endpoints, set `features: { trash: false }`; undo then falls back to creating a copy as before
- Live updates are on by default. Without a WebSocket on the backend, set `features: { liveUpdates: false }` (and `chat: false`) to avoid the connection attempts
- In dark mode, text on event colors and the accent is now dark. Set `--calendar-on-accent` to keep white text with a dark accent

## 1.2.1 – 2026-11-13

Includes the changes of 1.2.0 (2026-11-12).

- Every optional feature can be switched off through `features` or `feature-*` attributes: chat, attendees, recurrence, reminders, links, map links, holidays, search, undo, duplicate, shortcuts, subscriptions, import and export, e-mail settings, time zones and custom colors. A feature that is off makes no backend calls, so no WebSocket is opened without chat
- `views` limits the views a user can switch between
- Configuration file: `config` takes the URL of a JSON or YAML file, or an object, with all serializable options. Props and attributes win over the file. A JSON Schema is included as `@rokoyfa/calendar/config.schema.json`
- `restDataSource` and `tenantDataSource` accept `chat: false`
- Configuration files in JSON may contain comments, and `.jsonc` is recognised. Commented example files for YAML and JSON are in `demo/`
- New [Developer Guide](DEVELOPER_GUIDE.md) with embedding, options, configuration, exported types and the backend contract. The README is now a short overview
- The chat types `ChatRepository`, `ChatMessage`, `ChatKey`, `ChatPage`, `ChatUnread` and `ChatEvent` are exported
- Text overrides of the wrong type (a text where a function is expected) are ignored instead of breaking the page
- The event dialog is split into tabs: General, Repeat, Attendees and Details
- Locations and links: optional `location` and up to 10 website or other links in the Details tab. Locations are shown in the calendar, links too when the event is tall enough (with a globe icon, open in a new tab), both are searchable and exported to iCalendar
- Reminders: choose in the event dialog how long before an event to be reminded. Shown as a browser notification or a notice in the calendar while it is open. Reminders are personal per user
- Search over title, location, description and links with jump to the event. Custom adapters can implement `search`, otherwise the component searches the last and next year
- iCalendar export and import (.ics) in the calendar settings. Importing again updates events with the same `uid`, recurring events, exceptions, reminders and attendees are kept
- Attendees in team calendars with responses yes, maybe and no, plus a button to invite all members at once. Unanswered events are striped, declined ones crossed out
- The calendar you were in is restored after a reload
- Chat per event in team calendars (one per occurrence for recurring events) with live updates over a WebSocket, unread badges, edit and delete, moderation for owners, admins and managers, and optional emails to attendees with a link straight into the chat
- Public holidays for over 200 countries and their regions, computed in the browser with date-holidays (loaded only when shown) or delivered by your backend (`holiday-source="backend"`, `GET /holidays`). Region from the new `holidays` attribute, the language, or the user's setting
- Calendar subscriptions: a secret link per user and calendar for Google Calendar, Outlook or Apple Calendar (`/calendars/:id/feed`, `/feeds/:token.ics`)
- Email settings (invitations, changes, reminders) in a new Notifications tab, and a page that saves the yes / maybe / no answer from an invitation email without signing in (`POST /events/respond`)
- Members without edit rights can set their own reminders on any event (`PUT /events/:id/reminders`)
- Locations open in Google Maps from the dialog, the calendar grid and the reply page. Another map service can be set with `map-url`, locations that are web addresses open directly
- Duplicate events from the event dialog
- Undo after deleting, moving or resizing events (notice at the bottom or Ctrl+Z / ⌘Z). Single events are deleted without a confirmation, recurring ones still ask which events
- Keyboard shortcuts: `T` today, `N` new event, `/` search, `D` `W` `M` `Y` views. The header tooltips show them
- Time zone setting: automatic (zone from the host, otherwise the system, recommended) or a fixed zone. Events are shown in it and new events start in it
- Search results show times in your own time zone and open events that move to another day there
- New event fields `uid`, `location`, `links`, `reminders`, `attendees`, preference `timeZone`, new endpoints `GET /events/search` and `POST /events/:id/response`. Older events and backends without them keep working

## 1.1.0 – 2026-11-11

- Arrow keys switch to the previous or next day, week, month or year also right after loading and after closing a dialog, not only after clicking into the calendar. With several calendars on a page, the last used one reacts

## 1.0.0 – 2026-11-11

First stable release. The public API is now frozen in the sense of SemVer.

**Upgrading from 0.1:** No changes are needed on the host page. Your own backend should store the new event fields `allDay` and `timeZone` and return them; events without them are read as before. `GET /events` is now called with a range one day wider on each side.


- All-day events: `allDay` in the event format, switch in the event dialog, all-day row above the day and week grid
- Time zones: events store an IANA `timeZone` (or `null` for the same local time everywhere), the dialog has a zone picker and shows the time in the viewer's zone, new prop `timeZone` / attribute `time-zone` sets the zone the calendar is shown in
- Move events by pressing and holding them for one second, then dragging (mouse and touch). In the day and week view the lower edge changes the end time. Recurring events ask whether to change this, the following or all events
- Events without `allDay`/`timeZone` keep working as floating timed events
- The visible range sent to the backend is one day wider on each side
- French, Spanish, Italian, Dutch, Polish and Portuguese, loaded on demand. Language names in the settings appear in their own language
- `messages` prop and property to override texts or add languages
- Automated tests with Vitest (`npm test`), run before every publish

## 0.1.0 – 2026-11-10

First public release.

- `<Calendar />` React component and `<calendar-widget>` web component from one package, isolated in a Shadow DOM
- Day, week, month and year views, drag to select a time range, recurring events with "this / following / all" editing
- Data sources: `localDataSource`, `restDataSource`, `tenantDataSource` and custom adapters
- Accounts, team calendars with roles, invitations and ownership transfer when a backend is connected
- Sign-in through the host page with `getUserToken`
- English and German, region-aware week start, week numbers and time formats
- Host options `theme`, `initialView`, `features.teams`, `linkParam` and callbacks `onEventCreate`, `onEventUpdate`, `onEventDelete` (DOM events on the web component)
- REST contract as OpenAPI 3.1 in `api/openapi.yaml`
