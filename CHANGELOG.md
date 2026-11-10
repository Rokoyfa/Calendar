# Changelog

All notable changes to `@rokoyfa/calendar`. Versions follow [Semantic Versioning](https://semver.org/). Until 1.0, minor versions may contain breaking changes.

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
