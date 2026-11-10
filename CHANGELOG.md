# Changelog

All notable changes to `@rokoyfa/calendar`. Versions follow [Semantic Versioning](https://semver.org/). Until 1.0, minor versions may contain breaking changes.

## Unreleased

- All-day events: `allDay` in the event format, switch in the event dialog, all-day row above the day and week grid
- Time zones: events store an IANA `timeZone` (or `null` for the same local time everywhere), the dialog has a zone picker and shows the time in the viewer's zone, new prop `timeZone` / attribute `time-zone` sets the zone the calendar is shown in
- Events without `allDay`/`timeZone` keep working as floating timed events
- The visible range sent to the backend is one day wider on each side
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
