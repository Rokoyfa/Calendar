# 2. Options

Every option can be given in three ways: as a React prop, as an attribute of the web component, or in a [configuration file](04-configuration-file.md).

## Data

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `storageMode` | `storage-mode` | `local` | `local` keeps events in the visitor's browser, `remote` in your backend. With the `auth` feature the sign-in decides: signed-in users use the backend, guests the browser |
| `apiBaseUrl` | `api-base-url` | `/api` | Base URL of your backend, relative or absolute |
| `apiTimeoutMs` | `api-timeout-ms` | `10000` | Time limit per request in milliseconds |
| `tenant` | `tenant` | – | Tenant of a multi-tenant backend, see [Sign-in and tenants](07-sign-in-and-tenants.md) |
| `getUserToken` | property `getUserToken` | – | Sign-in through your own page, see [Sign-in and tenants](07-sign-in-and-tenants.md) |
| `dataSource` | property `dataSource` | – | Your own data adapter, see [Data adapters](08-data-adapters.md). Replaces the five options above |

## Features and views

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `features` | `feature-*` | see [Features](03-features.md) | Switches for every optional feature |
| `views` | `views` | all six | Views the user can switch between: `day`, `week`, `month`, `year`, `agenda` (a list of the next 30 days), `tasks` (all tasks as a list or board by status, only while the `tasks` feature is on). Attribute: separated by spaces or commas, `views="week month"`. With one view the switch disappears |
| `initialView` | `initial-view` | user's start view | View shown first. Wins over the user's setting |
| `readOnly` | `read-only` | `false` | Shows events without letting anyone create, change, move, delete or import them, see [Read-only mode](14-read-only-mode-and-public-links.md) |

## Appearance

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `locale` | `locale` | browser | Language and region: `en-US`, `de-DE`, `fr-FR`, `pt-BR`, … See [Languages and texts](05-languages-and-texts.md) |
| `messages` | property `messages` | – | Own texts or languages |
| `theme` | `theme` | follows the device | `light` or `dark`. Applies while the user has chosen "system" in the settings |
| `timeZone` | `time-zone` | browser | IANA zone the calendar is shown in, e.g. `Europe/Berlin`. New events start in it. A zone the user picks in the settings wins |
| `holidays` | `holidays` | from `locale` | Region for public holidays: `DE`, `DE-NW`, `AT`, `US-CA`, or `off`. Users can override it in the settings |
| `holidaySource` | `holiday-source` | `library` | `library` computes holidays in the browser, `backend` asks your backend (`GET /holidays`) and falls back to the library |
| `mapUrl` | `map-url` | Google Maps | Map service for locations, with `{query}` for the place: `https://www.openstreetmap.org/search?query={query}`, `https://maps.apple.com/?q={query}` |
| `appearance` | `accent-color`, `font-family`, `radius`, `density` | – | Accent color, font, corner radius and density, see [Look and feel](16-look-and-feel.md) |
| `className`, `style` | `class`, `style` | – | Size and place on your page |

## Navigation

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `routing` | – | `memory` | `memory`: the calendar's pages (settings, sign-in, …) change inside the widget only. `browser`: they get addresses in the address bar, for when the calendar is the whole page. The web component always uses `memory` |
| `basename` | – | – | Path prefix for `routing="browser"` |
| `initialPath` | `initial-path` | `/` | Page the widget opens on, e.g. `/settings` |
| `linkParam` | `link-param` | `calendarPath` | Query parameter of your page that links from e-mails use to open a page of the widget, e.g. `?calendarPath=%2Freset-password%3Ftoken%3D…`. `false` turns it off |

## Configuration and callbacks

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `config` | `config`, property `config` | – | URL of a JSON or YAML file, or an object with options. See [Configuration file](04-configuration-file.md) |
| `onEventCreate`, `onEventUpdate`, `onEventDelete` | events `event-create`, `event-update`, `event-delete` | – | After every stored change, see [Reacting to changes](06-reacting-to-changes.md) |
| `onViewChange` | event `view-change` | – | When the view or the shown dates change, see [Controlling the calendar](15-controlling-the-calendar-from-your-page.md) |
| `ref` | methods on the element | – | Methods such as `goToDate()`, see [Controlling the calendar](15-controlling-the-calendar-from-your-page.md) |

## Which setting wins

Several places can set the same thing. From strongest to weakest:

1. What the user chose in the calendar's settings (language, theme, time zone, holidays, start view). Exception: `initialView` wins over the user's start view.
2. With `tenant`: the tenant settings from the backend, see [Tenants](07-sign-in-and-tenants.md#tenants).
3. Props and attributes.
4. The configuration file.
5. The browser or device (language, time zone, light or dark).
6. The defaults in the tables above.

---

[← Previous](01-embedding.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](03-features.md)
