# Changelog

All notable changes to `@rokoyfa/calendar`. Versions follow [Semantic Versioning](https://semver.org/). From 1.0 on, breaking changes to props, attributes, DOM events, exported types, the data adapter and the REST contract only come with a new major version.

## Unreleased

- The event dialog is split into tabs: General, Repeat, Attendees and Details
- Locations and links: optional `location` and up to 10 website or other links in the Details tab. Locations are shown in the calendar, links too when the event is tall enough (with a globe icon, open in a new tab), both are searchable and exported to iCalendar
- Reminders: choose in the event dialog how long before an event to be reminded. Shown as a browser notification or a notice in the calendar while it is open. Reminders are personal per user
- Search over title, location, description and links with jump to the event. Custom adapters can implement `search`, otherwise the component searches the last and next year
- iCalendar export and import (.ics) in the calendar settings. Importing again updates events with the same `uid`, recurring events, exceptions, reminders and attendees are kept
- Attendees in team calendars with responses yes, maybe and no. Unanswered events are striped, declined ones crossed out
- The calendar you were in is restored after a reload
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
