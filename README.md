# @rokoyfa/calendar

An embeddable calendar for React apps and any other website. It runs without a backend, with data kept in the browser, or against your own REST backend.

- Day, week, month, year and agenda views with drag and drop
- Recurring and all-day events, time zones, reminders, locations, links and attachments
- Team calendars with roles, invitations, attendees, a chat per event, change history and notifications
- Two-way sync with other calendar apps over CalDAV, iCalendar import and export, subscription links and subscribed calendars
- Booking pages where others book a free time, confirmed by email, plus overlap warnings and printing
- Public holidays for over 200 countries, search, undo, a trash, categories, read-only mode and public links
- English, German, French, Spanish, Italian, Dutch, Polish and Portuguese built in, more through your own texts
- Styles isolated in a Shadow DOM, built for WCAG 2.2 AA
- Your page can steer it (`goToDate()`, `setView()`, `openEvent()`) and match it to your design with CSS variables
- Every optional feature can be switched off, and your backend only needs the endpoints of the features that are on

## Quick start

**Any website**, React is bundled:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js"></script>

<calendar-widget style="height: 700px"></calendar-widget>
```

**React 19:**

```bash
npm install @rokoyfa/calendar
```

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar style={{ height: 700 }} />
```

Give the calendar a height, it fills its box. No CSS import is needed.

## Configuring

Options are attributes on the web component and props on the React component:

```html
<calendar-widget locale="de-DE" theme="dark" initial-view="month" style="height: 600px"></calendar-widget>

<calendar-widget storage-mode="remote" feature-auth feature-chat="false" api-base-url="https://api.example.com"></calendar-widget>
```

```tsx
<Calendar
  storageMode="remote"
  apiBaseUrl="https://api.example.com"
  features={{ auth: true, chat: false }}
  views={['week', 'month']}
  onEventCreate={(event) => console.log('created', event)}
/>
```

Or keep them in a JSON or YAML file:

```html
<calendar-widget config="/calendar.config.yaml" style="height: 700px"></calendar-widget>
```

```yaml
storageMode: remote
apiBaseUrl: https://api.example.com
locale: de-DE
views: [week, month]
features:
  auth: true
  chat: false
```

Commented example files with every option: [`demo/calendar.config.yaml`](demo/calendar.config.yaml) and [`demo/calendar.config.jsonc`](demo/calendar.config.jsonc).

## Documentation

| | |
| --- | --- |
| [Developer Guide](DEVELOPER_GUIDE.md) | Embedding, all options and features, the configuration file, languages, sign-in, data adapters, exported types, and what your backend has to provide |
| [`api/openapi.yaml`](api/openapi.yaml) | The REST contract for your own backend (OpenAPI 3.1), also shipped as `@rokoyfa/calendar/openapi.yaml` |
| [`api/caldav.md`](api/caldav.md) | What a backend's CalDAV server has to support, for the `caldav` feature |
| [`schema/calendar-config.schema.json`](schema/calendar-config.schema.json) | JSON Schema for configuration files, also shipped as `@rokoyfa/calendar/config.schema.json` |
| [CHANGELOG.md](CHANGELOG.md) | Changes per version |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Working on the calendar itself: building, the test backend and internals (in German) |

**Demo:** [`demo/cdn.html`](demo/cdn.html) shows local mode with an event log, a dark German month view and a compact widget. Download it and open it in a browser, it loads the published package from jsDelivr.

## License

[MIT](LICENSE) © Rokoyfa
