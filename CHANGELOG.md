# Changelog

All notable changes to `@rokoyfa/calendar`. Versions follow [Semantic Versioning](https://semver.org/). From 1.0 on, breaking changes to props, attributes, DOM events, exported types, the data adapter and the REST contract only come with a new major version.

## Unreleased

- Categories per calendar: managed in the calendar settings, assigned in the event dialog, with a filter in the header. Events carry `categoryIds`. New feature switch `categories`
- Public read-only links: a calendar can be shared with anyone without sign-in, opened at `/shared/:token`. New feature switch `publicLinks`
- Read-only mode: `readOnly` / `read-only` shows events without letting anyone change them
- Control from the host page: `goToDate()`, `setView()`, `next()`, `previous()`, `today()`, `openEvent()`, `createEvent()`, `refresh()` and `getState()` on the element and through `ref`, plus `view-change` / `onViewChange`
- Look and feel: accent color, font, corner radius and more through `--calendar-*` CSS properties or the `appearance` option, and a compact density
- New REST endpoints for categories and sharing in `api/openapi.yaml`
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
