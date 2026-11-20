# Developer Guide

Everything you need to put `@rokoyfa/calendar` on your page: embedding, all options, the configuration file, the types the package exports, and what a backend has to provide. For a first look see the [README](README.md).

**Contents**

1. [Embedding](#1-embedding)
2. [Options](#2-options)
3. [Features](#3-features)
4. [Configuration file](#4-configuration-file)
5. [Languages and texts](#5-languages-and-texts)
6. [Reacting to changes](#6-reacting-to-changes)
7. [Sign-in and tenants](#7-sign-in-and-tenants)
8. [Data adapters](#8-data-adapters)
9. [Exported types](#9-exported-types)
10. [Backend](#10-backend)
11. [Event chat](#11-event-chat)
12. [Calendar subscriptions](#12-calendar-subscriptions)
13. [Categories](#13-categories)
14. [Read-only mode and public links](#14-read-only-mode-and-public-links)
15. [Controlling the calendar from your page](#15-controlling-the-calendar-from-your-page)
16. [Look and feel](#16-look-and-feel)
17. [Attachments](#17-attachments)
18. [Live updates](#18-live-updates)
19. [Trash](#19-trash)
20. [Data export](#20-data-export)
21. [Accessibility](#21-accessibility)
22. [Two-factor sign-in and devices](#22-two-factor-sign-in-and-devices)
23. [Subscribed calendars](#23-subscribed-calendars)
24. [Change history](#24-change-history)
25. [Notifications](#25-notifications)

## 1. Embedding

There are two ways to embed the calendar. Both render the same component and take the same options.

### Web component, for any website

One script, no build step. React is bundled.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js"></script>

<calendar-widget style="height: 700px"></calendar-widget>
```

The script registers `<calendar-widget>`. Options are attributes in kebab-case (`initial-view="month"`). Values that are not text (functions, objects) are set as properties on the element, before or after the script has loaded:

```js
const calendar = document.querySelector('calendar-widget')
calendar.getUserToken = async () => (await fetch('/calendar-token')).text()
calendar.config = { features: { chat: false } }
```

When hosting the script yourself, copy the whole `dist-lib/cdn` folder. Languages other than English, the holiday data, the YAML parser and parts that are not needed at start (event dialog, settings, sign-in pages, shared calendars) are separate files next to `calendar-widget.js` that are loaded on demand.

To register the element under another name, or to control when it is registered, use the npm package:

```js
import { defineCalendarElement, CalendarElement } from '@rokoyfa/calendar'

defineCalendarElement('team-calendar')
console.log(CalendarElement.version)
```

### React component

Needs React 19.

```bash
npm install @rokoyfa/calendar
```

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar style={{ height: 700 }} />
```

### What the host page should know

- **Height.** Give the calendar a height, it fills its box and scrolls inside. Without one it grows with its content.
- **Styles.** The calendar renders into a Shadow DOM. Your CSS does not reach in, its CSS does not leak out, and no stylesheet has to be imported.
- **Responsive.** The layout follows the width of the calendar, not of the window. A narrow calendar on a wide screen shows the phone layout.
- **Several calendars** on one page are independent, each with its own view and dialogs. In local mode they share the browser's storage.
- **Address bar.** By default (`routing: memory`) the calendar never touches the address of your page.

## 2. Options

Every option can be given in three ways: as a React prop, as an attribute of the web component, or in a [configuration file](#4-configuration-file).

### Data

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `storageMode` | `storage-mode` | `local` | `local` keeps events in the visitor's browser, `remote` in your backend. With the `auth` feature the sign-in decides: signed-in users use the backend, guests the browser |
| `apiBaseUrl` | `api-base-url` | `/api` | Base URL of your backend, relative or absolute |
| `apiTimeoutMs` | `api-timeout-ms` | `10000` | Time limit per request in milliseconds |
| `tenant` | `tenant` | – | Tenant of a multi-tenant backend, see [Sign-in and tenants](#7-sign-in-and-tenants) |
| `getUserToken` | property `getUserToken` | – | Sign-in through your own page, see [Sign-in and tenants](#7-sign-in-and-tenants) |
| `dataSource` | property `dataSource` | – | Your own data adapter, see [Data adapters](#8-data-adapters). Replaces the five options above |

### Features and views

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `features` | `feature-*` | see [Features](#3-features) | Switches for every optional feature |
| `views` | `views` | all five | Views the user can switch between: `day`, `week`, `month`, `year`, `agenda` (a list of the next 30 days). Attribute: separated by spaces or commas, `views="week month"`. With one view the switch disappears |
| `initialView` | `initial-view` | user's start view | View shown first. Wins over the user's setting |
| `readOnly` | `read-only` | `false` | Shows events without letting anyone create, change, move, delete or import them, see [Read-only mode](#14-read-only-mode-and-public-links) |

### Appearance

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `locale` | `locale` | browser | Language and region: `en-US`, `de-DE`, `fr-FR`, `pt-BR`, … See [Languages and texts](#5-languages-and-texts) |
| `messages` | property `messages` | – | Own texts or languages |
| `theme` | `theme` | follows the device | `light` or `dark`. Applies while the user has chosen "system" in the settings |
| `timeZone` | `time-zone` | browser | IANA zone the calendar is shown in, e.g. `Europe/Berlin`. New events start in it. A zone the user picks in the settings wins |
| `holidays` | `holidays` | from `locale` | Region for public holidays: `DE`, `DE-NW`, `AT`, `US-CA`, or `off`. Users can override it in the settings |
| `holidaySource` | `holiday-source` | `library` | `library` computes holidays in the browser, `backend` asks your backend (`GET /holidays`) and falls back to the library |
| `mapUrl` | `map-url` | Google Maps | Map service for locations, with `{query}` for the place: `https://www.openstreetmap.org/search?query={query}`, `https://maps.apple.com/?q={query}` |
| `appearance` | `accent-color`, `font-family`, `radius`, `density` | – | Accent color, font, corner radius and density, see [Look and feel](#16-look-and-feel) |
| `className`, `style` | `class`, `style` | – | Size and place on your page |

### Navigation

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `routing` | – | `memory` | `memory`: the calendar's pages (settings, sign-in, …) change inside the widget only. `browser`: they get addresses in the address bar, for when the calendar is the whole page. The web component always uses `memory` |
| `basename` | – | – | Path prefix for `routing="browser"` |
| `initialPath` | `initial-path` | `/` | Page the widget opens on, e.g. `/settings` |
| `linkParam` | `link-param` | `calendarPath` | Query parameter of your page that links from e-mails use to open a page of the widget, e.g. `?calendarPath=%2Freset-password%3Ftoken%3D…`. `false` turns it off |

### Configuration and callbacks

| Prop | Attribute | Default | |
| --- | --- | --- | --- |
| `config` | `config`, property `config` | – | URL of a JSON or YAML file, or an object with options. See [Configuration file](#4-configuration-file) |
| `onEventCreate`, `onEventUpdate`, `onEventDelete` | events `event-create`, `event-update`, `event-delete` | – | After every stored change, see [Reacting to changes](#6-reacting-to-changes) |
| `onViewChange` | event `view-change` | – | When the view or the shown dates change, see [Controlling the calendar](#15-controlling-the-calendar-from-your-page) |
| `ref` | methods on the element | – | Methods such as `goToDate()`, see [Controlling the calendar](#15-controlling-the-calendar-from-your-page) |

### Which setting wins

Several places can set the same thing. From strongest to weakest:

1. What the user chose in the calendar's settings (language, theme, time zone, holidays, start view). Exception: `initialView` wins over the user's start view.
2. Props and attributes.
3. The configuration file.
4. The browser or device (language, time zone, light or dark).
5. The defaults in the tables above.

## 3. Features

Everything beyond the core calendar (views, creating, editing, moving and deleting events, colors, all-day events) can be switched off. A feature that is off disappears from the interface and the component makes no calls for it, so your backend does not have to provide it.

```jsx
<Calendar storageMode="remote" features={{ auth: true, chat: false, subscriptions: false }} views={['week', 'month']} />
```

```html
<calendar-widget storage-mode="remote" feature-auth feature-chat="false" feature-subscriptions="false" views="week month"></calendar-widget>
```

Your backend only needs the endpoints of the features that are on, plus a small core (see [Backend](#10-backend)).

| Feature | Attribute | Default | What it covers | Your backend needs |
| --- | --- | --- | --- | --- |
| `auth` | `feature-auth` | off | Sign-in and accounts | `/auth/me`, `/auth/login`, `/auth/logout`, `/auth/me/password`, `/auth/password-reset*`, `/auth/verify-email*` |
| `teams` | `feature-teams` | on | Team calendars, members, roles, invitations | `POST /calendars`, `DELETE /calendars/:id`, `PUT /calendars/:id/display`, `/teams/*`, `/invitations/*` |
| `chat` | `feature-chat` | on | Chat per event in team calendars | Chat endpoints and the WebSocket, see [Event chat](#11-event-chat) |
| `attendees` | `feature-attendees` | on | Inviting members to events, replies | `POST /events/:id/response`, `POST /events/email-response` |
| `recurrence` | `feature-recurrence` | on | Creating and editing recurring events | – |
| `reminders` | `feature-reminders` | on | Reminders and their notifications | `PUT /events/:id/reminders` for members without edit rights |
| `links` | `feature-links` | on | Website and other links on events | – |
| `mapLinks` | `feature-map-links` | on | Opening a location in a map service | – |
| `holidays` | `feature-holidays` | on | Public holidays and their setting | `GET /holidays` only with `holidaySource="backend"` |
| `search` | `feature-search` | on | Event search | `GET /events/search` |
| `undo` | `feature-undo` | on | Undo after moving or deleting | – |
| `duplicate` | `feature-duplicate` | on | Duplicating events | – |
| `shortcuts` | `feature-shortcuts` | on | Keyboard shortcuts | – |
| `subscriptions` | `feature-subscriptions` | on | Subscription links in the calendar settings | `/calendars/:id/feed`, `/feeds/:token.ics` |
| `importExport` | `feature-import-export` | on | iCalendar import and export | – |
| `emailNotifications` | `feature-email-notifications` | on | E-mail settings of a signed-in user | Sending the e-mails |
| `timeZones` | `feature-time-zones` | on | Time zone per event and in the settings | – |
| `customColors` | `feature-custom-colors` | on | Own event colors | `/colors` |
| `categories` | `feature-categories` | on | Categories per calendar and the filter, see [Categories](#13-categories) | `/categories`, `/calendars/:id/categories` |
| `attachments` | `feature-attachments` | on | Files on events, see [Attachments](#17-attachments). Not in local mode | `/events/:id/attachments`, `/attachments/:id` |
| `liveUpdates` | `feature-live-updates` | on | Changes by others, or in other tabs, show up at once, see [Live updates](#18-live-updates) | WebSocket `/chat/socket` with `event.changed` messages |
| `trash` | `feature-trash` | on | Trash in the calendar settings, see [Trash](#19-trash) | `GET`/`DELETE /calendars/:id/trash`, `DELETE /calendars/:id/trash/:eventId`, `/events/:id/restore` |
| `dataExport` | `feature-data-export` | on | "Data" tab in the settings to download one's own data, see [Data export](#20-data-export) | `GET /auth/me/export` |
| `registration` | `feature-registration` | on | Sign-up page and the link to it on the sign-in page | `POST /auth/register` |
| `publicLinks` | `feature-public-links` | on | Public read-only links and the page they open, see [Public links](#14-read-only-mode-and-public-links) | `/calendars/:id/share`, `/shared/:token` |
| `twoFactor` | `feature-two-factor` | on | Two-factor sign-in for accounts with a password: the page `/two-factor` and a code step after the password, see [Two-factor sign-in](#22-two-factor-sign-in-and-devices). Not in local mode or with `getUserToken` | `POST /auth/login/two-factor`, `/auth/two-factor*` |
| `externalCalendars` | `feature-external-calendars` | on | Subscribing to calendars of other services, shown read-only, see [Subscribed calendars](#23-subscribed-calendars). Not in local mode | `/external-calendars*` |
| `history` | `feature-history` | on | "History" tab of events in team calendars, see [Change history](#24-change-history). Not in local mode | `GET /events/:id/history` |
| `notifications` | `feature-notifications` | on | Bell with notifications, see [Notifications](#25-notifications). Not in local mode | `/notifications*`, `notification.created` over the WebSocket |
| `caldav` | `feature-caldav` | on | Using the calendars in other programs over CalDAV with app passwords, see [CalDAV](#26-caldav). Not in local mode | `/auth/app-passwords*`, `GET /caldav`, the CalDAV server from `api/caldav.md` |
| `caldavAccounts` | `feature-caldav-accounts` | on | Connecting accounts of other CalDAV services and editing their calendars, see [CalDAV](#26-caldav). Not in local mode | `/caldav-accounts*`, `/caldav-calendars*` |

Good to know:

- `chat` and `attendees` need `teams`. Without teams they are off, whatever you set.
- With `undo` off, deleting an event asks for confirmation first.
- With `recurrence`, `links` or `reminders` off, existing data is kept when an event is saved. It is only no longer shown or editable.
- With `timeZones` off, the calendar always uses the automatic zone (your `timeZone`, otherwise the browser's).
- With a single entry in `views`, the view switch disappears.
- The attributes `auth` and `teams` still work as short forms of `feature-auth` and `feature-teams`.

## 4. Configuration file

Instead of props or attributes you can keep the options in a file, or pass them as an object. This keeps the embedding code the same on every page and the settings in one place.

```html
<calendar-widget config="/calendar.config.yaml"></calendar-widget>
```

```tsx
<Calendar config="/calendar.config.json" />
<Calendar config={{ storageMode: 'remote', features: { auth: true, chat: false } }} />
```

```js
document.querySelector('calendar-widget').config = { features: { chat: false } }
```

### Example files

Two complete, commented examples list every option with its default. Copy one and delete what you do not need:

- [`demo/calendar.config.yaml`](demo/calendar.config.yaml)
- [`demo/calendar.config.jsonc`](demo/calendar.config.jsonc), the same as JSON

A short file is enough, everything left out keeps its default:

```yaml
storageMode: remote
apiBaseUrl: https://api.example.com
locale: de-DE
views: [week, month]
features:
  auth: true
  chat: false
  subscriptions: false
```

```jsonc
{
  // comments are allowed
  "storageMode": "remote",
  "apiBaseUrl": "https://api.example.com",
  "locale": "de-DE",
  "views": ["week", "month"],
  "features": { "auth": true, "chat": false, "subscriptions": false }
}
```

### What can be in the file

All options from [Options](#2-options) under their prop names, except those that cannot be written as data: `dataSource`, `getUserToken`, the event callbacks, `className`, `style`, and `config` itself.

| Field | Type | Default |
| --- | --- | --- |
| `storageMode` | `"local"` or `"remote"` | `"local"` |
| `apiBaseUrl` | text | `"/api"` |
| `apiTimeoutMs` | whole number above 0 | `10000` |
| `tenant` | text | – |
| `features` | object of feature names and `true` / `false` | see [Features](#3-features) |
| `views` | list of `day`, `week`, `month`, `year` | all four |
| `initialView` | `day`, `week`, `month` or `year` | user's start view |
| `locale` | text | browser |
| `messages` | object: language → texts | – |
| `theme` | `"light"` or `"dark"` | follows the device |
| `timeZone` | text (IANA zone) | browser |
| `holidays` | text (region or `"off"`) | from `locale` |
| `holidaySource` | `"library"` or `"backend"` | `"library"` |
| `mapUrl` | text with `{query}` | Google Maps |
| `readOnly` | `true` or `false` | `false` |
| `appearance` | object with `accentColor`, `fontFamily`, `radius`, `density` | – |
| `routing` | `"memory"` or `"browser"` | `"memory"` |
| `basename` | text | – |
| `initialPath` | text | `/` |
| `linkParam` | text or `false` | `"calendarPath"` |

### How the file is read

- **Format.** Files ending in `.yaml` or `.yml` are read as YAML, files ending in `.json` or `.jsonc` as JSON. For other addresses the `Content-Type` of the answer decides. JSON files may contain `//` and `/* */` comments.
- **YAML parser.** It is only loaded when a YAML file is used. With the script tag it is a separate file next to `calendar-widget.js`, with the npm package it comes from the `yaml` dependency.
- **Precedence.** Props and attributes win over the file, for features one switch at a time. So one shared file can be adjusted per page: `<calendar-widget config="/calendar.config.yaml" feature-search="false">`.
- **Mistakes in the file.** Unknown or invalid entries are skipped, the rest is used. Every skipped entry is listed as a warning in the browser console, starting with `[calendar]`.
- **File not reachable or not parseable.** The calendar shows a message and does not start. It never falls back to defaults silently, because that could mean storing events in the wrong place.
- **Loading.** The file is fetched once when the calendar starts and again when the `config` address changes. Cache it like any other static file.
- **Texts.** `messages` in a file can override plain texts. Texts that are functions need the `messages` prop or property, see [Languages and texts](#5-languages-and-texts).
- **Security.** The file is public, like everything a browser loads. Never put secrets in it.

### Editor support

A JSON Schema ships with the package as `@rokoyfa/calendar/config.schema.json`. With it, editors complete field names and flag wrong values.

```json
{ "$schema": "https://unpkg.com/@rokoyfa/calendar/schema/calendar-config.schema.json" }
```

```yaml
# yaml-language-server: $schema=https://unpkg.com/@rokoyfa/calendar/schema/calendar-config.schema.json
```

### Checking a configuration yourself

`parseCalendarOptions` is the function the calendar uses. It returns the valid options and a list of problems, useful in a build step or an admin page:

```ts
import { parseCalendarOptions } from '@rokoyfa/calendar'

const { options, issues } = parseCalendarOptions(JSON.parse(text))
if (issues.length > 0) console.warn(issues)
```

## 5. Languages and texts

English, German, French, Spanish, Italian, Dutch, Polish and Portuguese are built in. Which language is used, in this order:

1. The user's choice in the settings.
2. Your `locale`.
3. The browser's languages.
4. `en-US`.

Formats follow the region, not the language: `en-US` starts the week on Sunday and shows `1:00 PM`, `en-GB` starts on Monday and shows `13:00`. A language that is not available falls back to English with the user's region.

**Own texts and languages.** `messages` overrides single texts or adds a language. Missing texts fall back to the built-in language, or to English for a new one. The full list of keys is the `Messages` type.

```js
document.querySelector('calendar-widget').messages = {
  de: { calendar: { newEvent: 'Neuer Eintrag' } },
  sv: { calendar: { today: 'Idag', newEvent: 'Ny händelse' }, views: { weekNumber: (week) => `V. ${week}` } },
}
```

Texts with values in them are functions, like `weekNumber` above. An override of the wrong kind (a text where a function is expected, or the other way round) is ignored.

## 6. Reacting to changes

After every stored change the calendar tells your page.

```tsx
<Calendar
  onEventCreate={(event) => console.log('created', event)}
  onEventUpdate={(event) => console.log('updated', event)}
  onEventDelete={({ id }) => console.log('deleted', id)}
/>
```

```js
const calendar = document.querySelector('calendar-widget')
calendar.addEventListener('event-create', (e) => console.log(e.detail))
calendar.addEventListener('event-update', (e) => console.log(e.detail))
calendar.addEventListener('event-delete', (e) => console.log(e.detail.id))
```

- Create and update carry the stored `CalendarEvent`, delete carries `{ id }`.
- The DOM events bubble and cross the Shadow DOM, so you can listen on a parent element.
- One action on a recurring event can cause several calls. Changing "only this occurrence" updates the series and creates a detached event.
- An undo causes the reverse calls.

## 7. Sign-in and tenants

There are three ways to handle users.

**No sign-in** (default). Everything stays in the visitor's browser. With `storageMode="remote"` all requests go to your backend without the calendar asking anyone to sign in. Who the visitor is, is then up to your backend, for example through a session cookie of your own site or a token from `getAccessToken` (see [Data adapters](#8-data-adapters)).

**The calendar's own accounts.** Turn on the `auth` feature. The calendar then has pages for sign-in, registration, password reset and e-mail confirmation. Guests keep working in the browser, and after signing in they are asked whether to move their local events into the account.

```html
<calendar-widget storage-mode="remote" feature-auth api-base-url="https://api.example.com"></calendar-widget>
```

**Sign-in through your page.** If your visitors are already signed in on your site, pass `getUserToken`. It returns a short-lived token signed by your server, or `null` when nobody is signed in.

```tsx
<Calendar
  tenant="acme"
  apiBaseUrl="https://api.example.com"
  getUserToken={() => fetch('/calendar-token').then((r) => r.text())}
/>
```

- The calendar first asks `GET /auth/me`. On `401` it calls `getUserToken` and exchanges the token at `POST /auth/token` for a session. When the session runs out later, this happens again by itself.
- In this mode there are no sign-in, registration or password pages, no sign-out button and no account tab. The account belongs to your site.
- With `null` the calendar works like for guests, in the browser.

**Tenants.** `tenant` is for a backend that serves several host pages. Every request then carries the header `X-Calendar-Tenant`, and sign-in is always on, whatever the `auth` feature says. With `storageMode="local"` the tenant is ignored and everything stays in the browser. What the backend has to check is described in the OpenAPI file.

- **The tenant id is public.** It only says which tenant a request belongs to and is no secret. The secret is the key your server signs the `getUserToken` tokens with; it never goes into the page.
- **Settings from the backend.** With `tenant` set, the calendar loads `GET /tenant/config` once at start. What the backend sets there wins over the page: built-in defaults, then the settings on the page (attributes, props or config file), then the tenant settings. Whatever the backend leaves out still comes from the page. So a host can change features, look, language and views in an admin dashboard without touching the page. Without `tenant` nothing changes: the page alone decides.
- **What stays with the page.** Where the data goes and how to reach it (`storageMode`, `apiBaseUrl`, `apiTimeoutMs`, `tenant`), the links (`routing`, `basename`, `linkParam`) and `getUserToken` cannot be set by the backend. The `auth` feature is ignored in both places, because a tenant always signs in. If the request fails, the calendar starts with the page settings only.
- **Turning features off for real.** The calendar only hides a feature. Your backend must also refuse it, with `403` and the code `featureDisabled`.
- **No open sign-up.** When users only come through your page, turn `registration` off in the tenant settings. The sign-up page then disappears, and the backend refuses `POST /auth/register`. Otherwise anyone who knows the public tenant id could create accounts in your tenant.

**Signing user tokens** (for the public tenant service; with your own backend you decide what the token looks like). `getUserToken` must return a token that your server signs at that moment, for the user who is signed in on your site. Never build it in the browser and never put the private key into the page.

1. Create a key pair. Use `ES256` (recommended), `EdDSA` or `RS256` with at least 2048 bits. Shared secrets (`HS256`) are not accepted.

   ```bash
   openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt -out calendar-private.pem
   openssl pkey -in calendar-private.pem -pubout -out calendar-public.pem
   ```

2. Register `calendar-public.pem` for your tenant (admin dashboard or the operator of the backend). You get a key id (`kid`). Keys are valid for one year at most; add the next key before the old one runs out and revoke a key right away if it may have leaked.
3. Add an endpoint on your server that signs a fresh token for the current user. It must only answer for signed-in users, only to your own pages, and never be cached.

   ```ts
   import { randomUUID } from 'node:crypto'
   import { readFile } from 'node:fs/promises'
   import { SignJWT, importPKCS8 } from 'jose'

   const privateKey = await importPKCS8(await readFile('calendar-private.pem', 'utf8'), 'ES256')

   export const signCalendarToken = (user: { id: string; email: string; name: string }) =>
     new SignJWT({ email: user.email, name: user.name })
       .setProtectedHeader({ alg: 'ES256', kid: process.env.CALENDAR_KEY_ID! })
       .setIssuer('acme')
       .setAudience('rokoyfa-calendar')
       .setSubject(user.id)
       .setJti(randomUUID())
       .setIssuedAt()
       .setExpirationTime('2m')
       .sign(privateKey)
   ```

4. Pass it on: `getUserToken={() => fetch('/calendar-token', { credentials: 'same-origin' }).then((r) => (r.ok ? r.text() : null))}`.

Every token is accepted once and for at most five minutes, so a token that shows up in a log or a browser history is useless. The full rules are in the OpenAPI file under "Host token sign-in".

The address in `email` is not taken as confirmed. The first time it shows up, and after every change, the user gets a confirmation link. Until then the user can use the calendar but cannot see or accept team invitations.

**Deleting users.** When a user asks you to delete their data, open the host dashboard, go to the users of your tenant and enter the user's email address and name. Within about a minute the account is removed with everything that belongs only to it, but only if a user with this address and name exists in your tenant; teams the user led get the next member as owner. The dashboard shows whether the request is done or no matching user was found. Admins and owners can do this, viewers cannot, and every request is recorded in the audit log. There is no public API for it.

**Keeping your tenant safe.**

- Enter only your own HTTPS origins as allowed origins (`http://localhost` only for development). The backend refuses changes from other origins.
- Turn `registration` off when users only come through your page (see above).
- Serve the page with a Content-Security-Policy and keep third-party scripts to a minimum. A script that runs on your page can call your token endpoint like the calendar does.
- Give admin roles sparingly: viewers see the settings, admins change them, only owners manage keys and admins. Admin accounts sign in with a second factor.

## 8. Data adapters

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
| `restDataSource(options)` | Talks to the [REST API](api/openapi.yaml) |
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

### Your own adapter

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
- Optional methods switch their feature on: `events.search`, `events.respond`, `events.setReminders`, `events.subscribe` (live updates), `events.listTrash` / `restore` / `purge` (trash), `calendars.getFeed` / `createFeed` / `deleteFeed`, `calendars.getShare` / `createShare` / `deleteShare`. Without `search` the calendar searches the last and next year itself.
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

## 9. Exported types

Everything below is exported from `@rokoyfa/calendar`.

### Component and configuration

| Export | Kind | |
| --- | --- | --- |
| `Calendar` | component | The React component |
| `CalendarElement`, `defineCalendarElement`, `DEFAULT_ELEMENT_NAME` | class, function, text | The web component, registering it, and its default name `calendar-widget` |
| `VERSION` | text | Version of the package |
| `CalendarProps` | type | All props of `Calendar` |
| `CalendarOptions` | type | The options that can be written as data, the shape of a configuration file |
| `CalendarConfigSource` | type | `string | CalendarOptions`, the type of `config` |
| `CalendarFeatures`, `CalendarFeature` | types | All feature switches, and the name of one |
| `DEFAULT_FEATURES`, `FEATURE_NAMES` | values | Defaults and names of the features |
| `parseCalendarOptions`, `ParsedOptions` | function, type | Checks a configuration and returns `{ options, issues }` |
| `CalendarView` | type | `'day' | 'week' | 'month' | 'year'` |
| `CalendarRouting`, `StorageMode`, `HolidaySource`, `HostTheme` | types | The values of `routing`, `storageMode`, `holidaySource`, `theme` |
| `EventCallbacks`, `DeletedEvent` | types | The three callbacks, and `{ id }` |
| `CalendarHandle`, `CalendarState`, `NewEventDraft` | types | The methods of `ref` and of the element, the state they report, and the argument of `createEvent()` |
| `CalendarAppearance` | type | The value of `appearance` |
| `Messages`, `PartialMessages`, `MessageOverrides`, `DeepPartial` | types | All texts, a part of them, and the type of `messages` |

```ts
type CalendarOptions = {
  tenant?: string
  storageMode?: 'local' | 'remote'
  apiBaseUrl?: string
  apiTimeoutMs?: number
  features?: Partial<CalendarFeatures>
  views?: readonly CalendarView[]
  routing?: 'memory' | 'browser'
  basename?: string
  initialPath?: string
  linkParam?: string | false
  locale?: string
  messages?: MessageOverrides
  theme?: 'light' | 'dark'
  initialView?: CalendarView
  timeZone?: string
  holidays?: string
  holidaySource?: 'library' | 'backend'
  mapUrl?: string
  readOnly?: boolean
  appearance?: CalendarAppearance
}

type CalendarAppearance = {
  accentColor?: string
  fontFamily?: string
  radius?: number
  density?: 'comfortable' | 'compact'
}

type CalendarProps = CalendarOptions &
  EventCallbacks & {
    config?: string | CalendarOptions
    ref?: Ref<CalendarHandle>
    onViewChange?: (state: CalendarState) => void
    dataSource?: CalendarDataSource
    getUserToken?: UserTokenProvider
    className?: string
    style?: CSSProperties
  }

type CalendarFeatures = {
  auth: boolean
  teams: boolean
  chat: boolean
  attendees: boolean
  recurrence: boolean
  reminders: boolean
  links: boolean
  mapLinks: boolean
  holidays: boolean
  search: boolean
  undo: boolean
  duplicate: boolean
  shortcuts: boolean
  subscriptions: boolean
  importExport: boolean
  emailNotifications: boolean
  timeZones: boolean
  customColors: boolean
  categories: boolean
  publicLinks: boolean
  attachments: boolean
}
```

### Data

| Export | |
| --- | --- |
| `CalendarEvent`, `EventInput`, `EventLink`, `Attendee`, `AttendeeStatus`, `Recurrence`, `HexColor` | Events, see [Data types](#data-types) |
| `CalendarSummary`, `CalendarDraft`, `CalendarChanges`, `TeamChanges`, `TeamMember`, `TeamRole`, `Invitation`, `PendingInvitation`, `TeamInvitation` | Calendars, teams and invitations |
| `User`, `AuthMethod`, `UserTokenProvider` | The signed-in user, `'password' | 'hostToken'`, and the type of `getUserToken` |
| `Preferences` | A user's settings |
| `PublicHoliday` | `{ date, name }` |
| `Category` | `{ id, calendarId, name }` |
| `Attachment` | `{ id, eventId, name, type, size, createdAt, uploadedBy }` |
| `SharedCalendar` | `{ id, name, color, categories }`, what a public link shows of a calendar |
| `ChatMessage`, `ChatKey`, `ChatPage`, `ChatUnread`, `ChatEvent` | Chat, see [Event chat](#11-event-chat) |

### Data adapters

| Export | |
| --- | --- |
| `localDataSource`, `restDataSource`, `tenantDataSource`, `TENANT_HEADER` | The built-in adapters and the name of the tenant header |
| `RestDataSourceOptions`, `TenantDataSourceOptions` | Their options |
| `CalendarDataSource`, `DataRepositories`, `DataSession`, `DataSourceContext` | The adapter interface |
| `EventRepository`, `EventQuery`, `EventSearchQuery` | Events |
| `CalendarRepository` | Calendars, teams, invitations, subscription links |
| `AuthRepository` | Sign-in and account |
| `ColorRepository`, `PreferencesRepository` | Own colors, settings |
| `HolidayRepository`, `HolidayQuery` | Public holidays |
| `ChatRepository` | Chat |
| `CategoryRepository` | Categories |
| `SharedCalendarRepository` | Reading a calendar through a public link |
| `AttachmentRepository` | Files on events |

```ts
interface CalendarDataSource {
  createAuthRepository?: (context: { getLanguage: () => string | null }) => AuthRepository
  connect: (session: { isAuthenticated: boolean }, context: DataSourceContext) => DataRepositories
}

type DataSourceContext = { getLanguage: () => string | null; onUnauthorized: () => void }

type DataRepositories = {
  mode: 'local' | 'remote'
  events: EventRepository
  calendars: CalendarRepository
  colors: ColorRepository
  preferences: PreferencesRepository
  holidays?: HolidayRepository
  chat?: ChatRepository
  categories?: CategoryRepository
  shared?: SharedCalendarRepository
  attachments?: AttachmentRepository
}

interface AttachmentRepository {
  list(eventId: string): Promise<Attachment[]>
  upload(eventId: string, file: File): Promise<Attachment>
  download(attachment: Attachment): Promise<Blob>
  remove(id: string): Promise<void>
}

interface CategoryRepository {
  list(calendarIds: readonly string[]): Promise<Category[]>
  create(calendarId: string, name: string): Promise<Category>
  rename(id: string, name: string): Promise<Category>
  remove(id: string): Promise<void>
}

interface SharedCalendarRepository {
  get(token: string): Promise<SharedCalendar>
  listEvents(token: string, range: { from: string; to: string }): Promise<CalendarEvent[]>
}

interface EventRepository {
  list(query: { from: string; to: string; calendarIds: readonly string[] }): Promise<CalendarEvent[]>
  listSeries(seriesId: string): Promise<CalendarEvent[]>
  create(calendarId: string, input: EventInput): Promise<CalendarEvent>
  update(id: string, input: EventInput, version?: number): Promise<CalendarEvent>
  remove(id: string, version?: number): Promise<void>
  search?(query: { text: string; calendarIds: readonly string[] }): Promise<CalendarEvent[]>
  respond?(id: string, status: AttendeeStatus): Promise<CalendarEvent>
  setReminders?(id: string, reminders: number[]): Promise<CalendarEvent>
  subscribe?(listener: (change: EventChange) => void): () => void
  listTrash?(calendarId: string): Promise<TrashedEvent[]>
  restore?(id: string): Promise<CalendarEvent>
  purge?(calendarId: string, id: string): Promise<void>
  emptyTrash?(calendarId: string): Promise<number>
}

type TrashedEvent = {
  event: CalendarEvent
  deletedAt: string
  deletedBy: string | null
  deletedByName: string | null
  expiresAt: string
  detachedCount: number
}

type EventChange =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'event.changed'; calendarId: string | null; eventId: string | null; version: number | null; changedBy: string | null }

interface ChatRepository {
  list(key: ChatKey, options?: { before?: string }): Promise<ChatPage>
  send(key: ChatKey, text: string): Promise<ChatMessage>
  edit(id: string, text: string): Promise<ChatMessage>
  remove(id: string): Promise<void>
  markRead(key: ChatKey): Promise<void>
  unread(calendarIds: readonly string[]): Promise<ChatUnread[]>
  subscribe(listener: (event: ChatEvent) => void): () => void
}

type ChatKey = { eventId: string; occurrenceDate: string | null }
type ChatMessage = ChatKey & {
  id: string
  calendarId: string
  author: { id: string; name: string } | null
  text: string
  createdAt: string
  editedAt: string | null
}
type ChatPage = { messages: ChatMessage[]; hasMore: boolean }
type ChatUnread = ChatKey & { count: number }
```

`AuthRepository` has an optional `exportData(): Promise<Blob>` for the data export. The other interfaces (`CalendarRepository`, `AuthRepository`, `ColorRepository`, `PreferencesRepository`, `HolidayRepository`) are best read in your editor from the package's type definitions.

## 10. Backend

The full contract is [`api/openapi.yaml`](api/openapi.yaml) (OpenAPI 3.1, also shipped as `@rokoyfa/calendar/openapi.yaml`). The essentials:

**Only what you turned on.** Your own backend needs the core endpoints and the endpoints of the features you switch on in your options or configuration file, nothing else. Every operation in the OpenAPI file carries `x-feature` with the feature it belongs to; the table in [Features](#3-features) lists the same per feature.

| Needed | Endpoints |
| --- | --- |
| Always, as soon as there is a backend (`storageMode="remote"` or `auth`) | `GET`/`POST /events`, `PUT`/`DELETE /events/:id`, `GET /calendars`, `PATCH /calendars/:id`, `GET`/`PATCH /preferences` |
| Per feature that is on | see the column "Your backend needs" in [Features](#3-features) |
| Sign-in through your page (`getUserToken`) | `POST /auth/token`, in a token format of your choice |
| Only for the public tenant service | `GET /tenant/config` and the rules under "Public tenant service" in the OpenAPI file |

Turn a feature off and the component never calls its endpoints: `features: { chat: false, attachments: false, trash: false }` needs neither chat, attachments nor trash on your side.

### Data types

```ts
type CalendarEvent = EventInput & {
  id: string
  calendarId: string
  createdAt: string             // ISO date-time
  updatedAt: string
  version: number               // starts at 1, goes up on every change, read-only
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
}

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
// Preferences also carry emailInvites, emailChanges, emailReminders, emailChat: booleans for the emails below
type Problem = { code: string; message: string }   // every error response
```

The backend stores series as one event. The component expands occurrences itself.

**Reminders are personal.** Store them per user and event, return only the caller's own `reminders`, and keep other members' reminders when someone saves the event. The component shows reminders while it is open (browser notification or a notice in the calendar). Emails or push messages when it is closed are up to your backend.

### When the component calls your backend

| Moment | Requests |
| --- | --- |
| Widget loads | `GET /auth/me` (only with `auth`), then `GET /preferences`, `GET /colors`, `GET /calendars`, `GET /invitations` |
| Visible range changes | `GET /events?from=…&to=…&calendarId=…` with the calendars shown. The range is two days wider than the view to cover time zone shifts. Return every event in the range **and** every series that can occur in it. |
| Create event | `POST /events` with `EventInput` + `calendarId` |
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

Before editing "following" or "all" of a series, the component loads its detached events with `GET /events?seriesId=…`.

### Rules for the backend

- **Security:** the rules under "Public tenant service" in `api/openapi.yaml` (host tokens, sessions, origin checks, `404` for items of others) are binding for the tenant service. For your own backend they are a good checklist, not a requirement.
- **Sessions:** requests use `credentials: 'include'`. Set an `HttpOnly` cookie on sign-in. If the widget runs on another domain: CORS for that origin with `Access-Control-Allow-Credentials: true`, allowed headers `Content-Type`, `Accept`, `Accept-Language`, `Authorization`, `If-Match`, `X-Calendar-Tenant`, and the cookie as `SameSite=None; Secure`. Answer `401` when the session is gone.
- **Errors:** always `{ code, message }`. Known codes such as `invalidCredentials`, `emailTaken`, `forbidden`, `lastOwner` are shown translated, others with `message`.
- **Language:** every request carries `Accept-Language`. Use it, or the stored `locale`, for emails.
- **Emails about events** (your backend sends them, the component only stores the user's choice): an invitation with yes / maybe / no links to `/respond?status=accepted&token=…` when someone is added as attendee (`emailInvites`), a notice when title, time, place or repetition change or the event is cancelled (`emailChanges`), and reminders at the user's own reminder times even while the calendar is closed (`emailReminders`, off by default). Only to verified addresses, never to the person who made the change.
- **Subscriptions:** `GET /feeds/:token.ics` answers without a session with the calendar as iCalendar (RFC 5545), the subscriber's own reminders and the category names as `CATEGORIES` (comma-separated, with `,` and `;` inside a name escaped as `\,` and `\;`). Keep one secret token per user and calendar, a new one replaces the old. Stop serving it when the user leaves the calendar.
- **Version:** this is version 2 of the REST contract (`api/openapi.yaml`, `info.version`). Serve it under a versioned base path such as `/api/v2` and set `apiBaseUrl` / `api-base-url` to it, so a later major version can run next to it.
- **Error codes:** every error is a `Problem` with a `code` from the table in `api/openapi.yaml` (status and meaning per code). The component translates them; for unknown codes it shows `message`.
- **Rate limits:** any endpoint may answer `429` with `Retry-After` (seconds or HTTP date) and the code `rateLimited` or a more specific one. The component shows how long to wait. Cross-origin backends must list `Retry-After` in `Access-Control-Expose-Headers`.
- **Editing at the same time:** every event has a `version` that starts at 1. Raise it on every `PUT`, attendee response and removed category, but not when someone only changes their own reminders. `PUT` and `DELETE /events/:id` send `If-Match: "<version>"` with the version the user saw, but only when your events carry a `version`; without it nothing changes for your backend. If the event has a newer version, answer `412` with `eventChanged` and change nothing. The dialog then offers to save anyway (sent without `If-Match`) or to load the current version. Without `If-Match`, or with `*`, skip the check.
- **Categories:** belong to one calendar, names are unique per calendar without regard to case. Reject an event whose `categoryIds` are not from its calendar, and remove a deleted category from all events.
- **Attachments:** at most 10 MB per file and 20 per event. Store the files outside the database, keep only the file name, and serve them with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` and a sandboxing `Content-Security-Policy`, because uploaded files are untrusted. Delete them together with their event, calendar or team. Never hand them out through public links or subscription feeds.
- **Public links:** one unguessable token per calendar. `GET /shared/:token/events` must leave out everything personal: empty `attendees` and `reminders`, no `createdBy`, and never chat messages. A new link, or stopping the share, must make the old token fail at once.
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

## 11. Event chat

Events in team calendars have a **Chat** tab: every member can read and write, edit and delete their own messages, and owners, admins and managers (`manage_calendars`) can delete any message. Recurring events have one chat per occurrence. A detached occurrence keeps the chat of its original date. The calendar shows unread messages as a red badge on the event and in the tab title, and attendees can get an email about new messages (`emailChat`, on by default, at most one email per chat every few minutes).

Messages go over REST (see the OpenAPI file, tag *Chat*). New, edited and deleted messages arrive live over a WebSocket:

- **Address:** `{apiBaseUrl}/chat/socket` with `ws://` or `wss://`, derived from `apiBaseUrl` (relative addresses use the page's host). With `tenant` the tenant is added as `?tenant=…`, because browsers cannot set headers on WebSockets. `restDataSource` takes another address as `chatSocketUrl`.
- **Sign-in:** the session cookie is sent with the handshake. Check the `Origin` header against the allowed origins and answer `401` without a session.
- **Server → client** (JSON text frames): `{ "type": "message.created" | "message.updated", "message": ChatMessage }` and `{ "type": "message.deleted", "id", "calendarId", "eventId", "occurrenceDate" }`, sent to every connected member of the calendar's team.
- **Client → server:** only `{ "type": "ping" }` every 25 seconds, answer with `{ "type": "pong" }` or ignore it.
- The component reconnects with growing pauses (1 to 30 seconds) and reloads the open chat and the unread counts after reconnecting, so a lost connection only delays messages.

Emails link to the host page with `?calendar=…&event=…&date=…&tab=chat`, which opens the event with the chat.

Without a WebSocket on your backend, turn the feature off: `features: { chat: false }`. The calendar then shows no chat. The same WebSocket also carries [live updates](#18-live-updates); with both off, no connection is opened.

## 12. Calendar subscriptions

With a backend that serves `/calendars/:id/feed` and `/feeds/:token.ics`, every signed-in user can subscribe to a calendar in another calendar app and see its events there, for example on the phone. Users get the link in the calendar settings: **Import & export** tab for team calendars, on the settings page for the personal calendar → **Subscribe** → **Create subscription link**. They can copy the link or open it in their calendar app.

- The subscription is **read-only**. Changes made in the other app do not come back.
- The link is **personal and secret**: it contains the user's own reminders, and anyone who has it can see all events of the calendar. **Create new link** turns the old one off, **End subscription** removes it.
- It stops working when the user leaves the calendar.

### Adding the link in calendar apps

| App | Steps |
| --- | --- |
| **Apple Calendar on Mac** | **Open in calendar app** in the settings, or *File → New Calendar Subscription…*, paste the link, **Subscribe**. Set *Auto-refresh* and choose *iCloud* as location so the calendar also appears on iPhone and iPad. |
| **Apple Calendar on iPhone / iPad** | **Open in calendar app** in the settings, or *Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar* (older iOS: *Settings → Calendar → Accounts*), paste the link as server, **Next**, **Save**. |
| **Google Calendar** | Only in the browser at calendar.google.com: next to *Other calendars* click **+** → **From URL**, paste the link, **Add calendar**. It then also shows in the Google Calendar apps on Android and iPhone. |
| **Outlook.com / Outlook on the web / new Outlook** | *Calendar → Add calendar → Subscribe from web*, paste the link, give it a name, **Import**. |
| **Classic Outlook for Windows** | *Home → Add Calendar → From Internet…* (in some versions *Open Calendar → From Internet*), paste the link, **OK**, confirm with **Yes**. |
| **Thunderbird** | *New Calendar → On the Network*, paste the link, choose the iCalendar (ICS) format. |

Menu names change between app versions. If a path does not match, look for “subscribe”, “from URL” or “from internet”.

### How quickly changes show up

A subscription is not live: the app downloads the whole calendar again at intervals that the app decides. Changes made in this calendar therefore appear with a delay:

| App | Refresh |
| --- | --- |
| Apple Calendar on Mac | Adjustable per subscription, from every 5 minutes to weekly (right-click the calendar → *Get Info* → *Auto-refresh*). *View → Refresh Calendars* (⌘R) refreshes right away. |
| Apple Calendar on iPhone / iPad | Follows *Fetch New Data* (*Settings → Apps → Calendar → Calendar Accounts → Fetch New Data*). Choose *Every 15 Minutes* or *Hourly*. Subscriptions have no push. A subscription added on the Mac with location *iCloud* is refreshed by iCloud. |
| Google Calendar | Google's own schedule, usually several hours, sometimes up to a day. Cannot be changed. |
| Outlook.com / web / new Outlook | Microsoft's own schedule, roughly every 3 hours, sometimes more than 24 hours. Cannot be changed. |
| Classic Outlook for Windows | Follows the update limit in the feed (one hour here) and Outlook's send/receive settings. |

The feed asks clients to reload every hour (`REFRESH-INTERVAL` and `X-PUBLISHED-TTL`), but most apps follow their own settings. For changes that must show up immediately, users should open this calendar directly. Two-way sync with near-instant updates would need a CalDAV server, which this component does not cover.

Without the feed endpoints, turn the feature off: `features: { subscriptions: false }`.

## 13. Categories

Every calendar can have its own categories, for example "Training" and "Match". Events get up to five of them, and a filter in the header shows only the chosen ones.

- **Managing.** Categories are created, renamed and deleted in the calendar's settings, by members with `manage_calendars` and by the owner of a personal calendar. A calendar holds up to 30.
- **Assigning.** The event dialog shows the categories of the event's calendar as chips. Anyone who may edit the event may assign them. Whoever may manage the categories can also create a new one right there with "+ New category"; it is selected at once.
- **Filtering.** The filter button appears as soon as one of the shown calendars has categories. It also offers "Without category". The choice lasts until the page is reloaded.
- **Deleting.** A deleted category disappears from its events.
- **Local mode.** Categories work without a backend, stored in the browser.
- **Export and subscriptions.** Exported `.ics` files carry the category names as `CATEGORIES`, which Google Calendar, Outlook and Apple Calendar understand. Your subscription feed should do the same.
- **Import.** Categories in an imported file are matched to the calendar's categories by name, without regard to case. Missing ones are created if the importing member may manage the calendar and the limit of 30 is not reached, otherwise they are left out. When a known event is imported again from a file without categories, it keeps its own.

Turn the feature off with `features: { categories: false }`.

## 14. Read-only mode and public links

### Read-only mode

`readOnly` turns the calendar into a display. Events can be opened and read, but not created, changed, moved, deleted or imported. Views, search, the category filter and the user's own settings keep working.

```html
<calendar-widget read-only storage-mode="remote" api-base-url="https://api.example.com"></calendar-widget>
```

```tsx
<Calendar readOnly />
```

This is a display option, not a protection. Your backend still has to reject changes it does not allow.

### Public links

A member with `manage_calendars` can create a public link in the calendar's settings. Anyone with the link sees the calendar read-only, without an account.

- **What visitors see.** Title, time, location, description, links and categories of all events. Never attendees, reminders or chat.
- **One link per calendar.** Creating a new one, or stopping the share, turns the old link off at once.
- **Where the link points.** With `routing: memory` it is your own page with the link parameter, for example `https://example.com/team?calendarPath=%2Fshared%2F<token>`. With `routing: browser` it is `/shared/<token>` under your `basename`. If `linkParam` is `false`, the settings show the path instead, for use with `initialPath`.

To show a shared calendar permanently on a page, for example a club's public event list, open the widget on that path. Visitors do not sign in. Use the same data options as on your other pages, so the widget knows your backend (with accounts that is `feature-auth`, otherwise `storage-mode="remote"`):

```html
<calendar-widget feature-auth api-base-url="https://api.example.com" initial-path="/shared/<token>" style="height: 600px"></calendar-widget>
```

In local mode there is no backend to ask, so public links are not available.

Turn the feature off with `features: { publicLinks: false }`. Existing links then show a "not shared" message.

## 15. Controlling the calendar from your page

Your page can move the calendar and react to where it is.

```js
const calendar = document.querySelector('calendar-widget')

calendar.goToDate('2027-03-05')
calendar.setView('month')
calendar.addEventListener('view-change', (e) => console.log(e.detail))
```

```tsx
import { useRef } from 'react'
import { Calendar, type CalendarHandle } from '@rokoyfa/calendar'

function Page() {
  const calendar = useRef<CalendarHandle>(null)
  return (
    <>
      <button onClick={() => calendar.current?.today()}>Today</button>
      <Calendar ref={calendar} onViewChange={(state) => console.log(state)} />
    </>
  )
}
```

| Method | |
| --- | --- |
| `getState()` | `{ view, date, from, to }`: the view, the date it is centred on and the first and last day shown. `null` while the calendar itself is not on screen |
| `goToDate(date)` | Shows the date. Takes `'YYYY-MM-DD'` or a `Date` |
| `setView(view)` | Switches to `day`, `week`, `month` or `year` |
| `next()`, `previous()`, `today()` | The same as the buttons in the header |
| `openEvent(eventId, date)` | Goes to the date and opens the event. For a recurring event the date picks the occurrence |
| `createEvent(draft?)` | Opens the dialog for a new event, optionally filled in: `{ title, startDate, start, end, endDate, allDay, location, description }`. Nothing is stored until the user saves |
| `refresh()` | Loads the events again, for example after your page changed data on the backend |

- Every method except `getState()` returns `true` when it was carried out and `false` otherwise.
- A method answers `false` while the calendar itself is not on screen (settings, sign-in, or the configuration still loading), when an argument is invalid, when `setView` asks for a view that is not in `views`, and `createEvent` when the user may not create events.
- `view-change` / `onViewChange` fires once at the start and then whenever the view or the dates change, with the same value as `getState()`.

## 16. Look and feel

The calendar follows light and dark mode by itself. On top of that you can match it to your page in two ways. Both set the same things, so use whichever is handier.

**From your CSS.** Custom properties set on the element reach into the calendar:

```css
calendar-widget {
  --calendar-accent: #e63946;
  --calendar-on-accent: #ffffff;
  --calendar-font: 'Inter', sans-serif;
  --calendar-radius: 6px;
}
```

With the React component, set them on the element you give a `className` or `style`.

| Property | Default | |
| --- | --- | --- |
| `--calendar-accent` | blue | Buttons, links, the active view, today, selection and focus ring |
| `--calendar-on-accent` | white, dark in dark mode | Text on the accent color. Set it when your accent is light (or dark in dark mode) |
| `--calendar-font` | Segoe UI, sans-serif | Font family. Your page has to load the font |
| `--calendar-radius` | `10px` | Corner radius of dialogs, buttons and fields. `0px` gives square corners |
| `--calendar-bg` | white / near black | Background |
| `--calendar-surface` | white / dark grey | Dialogs and cards |
| `--calendar-text` | near black / light grey | Text |
| `--calendar-heading` | grey | Headings |
| `--calendar-muted` | grey | Secondary text |
| `--calendar-border` | light grey / dark grey | Grid lines and borders |

Colors you set apply in light and dark mode alike. To give each its own value, use `light-dark()` or a media query in your CSS, or fix the mode with `theme`.

**As an option**, which also works in a configuration file:

```html
<calendar-widget accent-color="#e63946" font-family="Inter, sans-serif" radius="6" density="compact"></calendar-widget>
```

```tsx
<Calendar appearance={{ accentColor: '#e63946', fontFamily: 'Inter, sans-serif', radius: 6, density: 'compact' }} />
```

| Field | Attribute | |
| --- | --- | --- |
| `accentColor` | `accent-color` | A CSS color. For a hex color the text color on it is picked for you |
| `fontFamily` | `font-family` | A CSS font family |
| `radius` | `radius` | Corner radius in pixels, 0 to 24 |
| `density` | `density` | `comfortable` (default) or `compact` with smaller text, rows and spacing |

The option wins over the CSS properties. The colors of events are not affected by the accent color, they keep the color the user gave them.

## 17. Attachments

Files can be attached to events, for example an agenda or a flyer.

- **Where.** In the event dialog under "Details", with a button or by dragging files onto the section. Events with attachments show a paperclip.
- **New events.** Files chosen while creating an event are uploaded right after it is saved. If one fails, the event is kept and a message names the files that are missing.
- **Limits.** Up to 20 files per event, each at most 10 MB. Empty and larger files are refused before anything is sent.
- **Who may do what.** Everyone who can see the event can download its files. Uploading and deleting needs the right to edit the event. In read-only mode files can only be downloaded.
- **Series.** A recurring event has one set of attachments for all its occurrences. An occurrence changed on its own gets its own set.
- **Not included.** Attachments are not copied when duplicating an event, and they are not part of `.ics` exports, subscription feeds or public links.
- **Local mode.** Without a backend there are no attachments, because browser storage is too small for files.

Turn the feature off with `features: { attachments: false }`.

## 18. Live updates

When someone changes an event in a calendar that is shown, everyone else sees it at once, without reloading.

- **How.** The backend sends an `event.changed` message over the WebSocket that the chat uses too (see [Event chat](#11-event-chat) for address, sign-in and pings, and [Rules for the backend](#rules-for-the-backend) for the message). The component then reloads the events of the visible range, several messages in a row only once.
- **Open dialog.** If another person changes or deletes the event that is open in the dialog, the dialog says so and offers to reload it. Saving anyway is still protected by `If-Match` (see [Rules for the backend](#rules-for-the-backend)).
- **Connection lost.** The component reconnects with growing pauses and reloads the events once it is back, so nothing is missed. If the very first five attempts fail, for example because your backend has no WebSocket, it stops trying until the calendar is opened again.
- **Local mode.** Without a backend, changes made in another tab of the same browser show up at once.
- **Own adapter.** Implement `events.subscribe(listener)` and call the listener with an `EventChange`. Return a function that ends the subscription. Without `subscribe` there are no live updates.

Without a WebSocket on your backend, turn chat and live updates off: `features: { chat: false, liveUpdates: false }`. The calendar then opens no connection.

## 19. Trash

Deleted events are not gone at once. They stay in the trash of their calendar for 30 days.

- **Where.** In the calendar settings, in the **Trash** tab (team and personal calendars). Each entry shows when and by whom it was deleted and when it will be gone for good. The list shows 20 entries at a time with **Show more**, and from 8 entries on a search by title, place or who deleted it.
- **Restore.** Brings the event back with the same id, so attachments, chat and email links work again. A series comes back with the detached events deleted together with it. A detached event can only come back while its series exists.
- **Delete for good.** Removes the event with attachments and chat at once, after a confirmation.
- **Empty the trash.** Deletes every entry the user may delete for good, after a confirmation that says how many. With only `delete_own_entry`, entries of others stay.
- **Undo.** The undo notice after deleting uses the trash too, so nothing is lost on the way back.
- **Who.** Everyone who may delete an event may restore it or delete it for good: with `delete_any_entry` every event, with `delete_own_entry` their own.
- **Local mode.** Without a backend the trash lives in the browser (`localStorage`) and works the same way.
- **Own adapter.** Implement `events.listTrash`, `events.restore` and `events.purge`, and optionally `events.emptyTrash` for the **Empty trash** button. Without them there is no trash and undo creates a copy of the deleted event. The same happens when `restore` answers `404`, `405` or `501`.

Turn the trash off with `features: { trash: false }`. Undo still restores from the trash when the backend has one.

## 20. Data export

Users can download their own data in the settings, in the **Data** tab, as required by Art. 20 GDPR (right to data portability).

- **Signed in.** The file comes from `GET /auth/me/export` on your backend. What belongs into it is listed in [Rules for the backend](#rules-for-the-backend). With your own `AuthRepository`, implement `exportData()`; without it the tab is not shown to signed-in users.
- **Local mode.** The file contains everything the calendar stores in this browser (`localStorage` keys starting with `calendar.`), with the format `calendar-browser-export`.
- **File.** JSON, named `calendar-export-YYYY-MM-DD.json`.

Turn it off with `features: { dataExport: false }`, for example when your page already offers its own export.

## 21. Accessibility

The calendar aims at WCAG 2.2 AA and is checked with axe-core in light and dark mode.

- **Keyboard.** Every event is a button and can be reached with `Tab`. On an event, `↑` and `↓` move to the previous or next event of the same day, `←` and `→` to the nearest event on the previous or next day with events, `Home` and `End` to the first and last event in view, `Enter` opens it. The other shortcuts are listed in the tooltips of the header buttons.
- **Screen readers.** Each day column and month cell is a group named after its date, with "today" and public holidays. Events are announced with title, time, place, repetition, calendar, the user's own response and the number of attachments. The period title in the header is a live region, so moving to the next week is announced. Dialogs are labelled by their title and move the focus into the dialog.
- **Contrast.** Text and event colors meet 4.5:1 in both themes. In dark mode, text on the built-in event colors and the accent is dark. If you change colors with `--calendar-*` properties, check the contrast of your own colors.
- **Creating events.** In the day and week view, `Tab` reaches the time grid. The arrow keys pick the hour (`↑` / `↓`) and the day (`←` / `→`), `Home` and `End` jump to 0:00 and 23:00, `Enter` or `Space` opens the dialog for that time. Only one slot is a tab stop, so the grid costs a single `Tab`. The **+** button and `N` work as before.
- **Focus.** Closing a dialog returns the focus to where it was, for example to the event or slot that opened it.


## 22. Two-factor sign-in and devices

Accounts with a password can protect their sign-in with a code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password …). The component brings the whole page, so your backend only needs the endpoints.

- **Page.** `/two-factor` of the component, also reachable from **Settings → Security**. Turning it on asks for the password, shows a QR code and the key for typing it in, checks the first code and then shows ten recovery codes once, to copy or download. On the same page users create new recovery codes or turn the sign-in off again (password plus a code or recovery code).
- **Sign-in.** After a correct password the backend answers `202` with a `challenge` instead of a session. The sign-in page then asks for the code, or a recovery code, and calls `POST /auth/login/two-factor`. After 10 minutes or 5 wrong codes the user starts again with the password.
- **Link in the mail.** Let the confirmation mail after registration link to the page, e.g. `https://host.example/calendar/two-factor` with browser routing or `https://host.example/calendar?calendarPath=%2Ftwo-factor` with the link parameter. The test backend does this.
- **Devices.** **Settings → Security** lists all sessions of the user with browser, system, last use and a shortened IP address. Users can sign out one device or all others.
- **Not available** in local mode and with `getUserToken`: then the host signs the user in and protects that sign-in itself. Turn the page off with `features: { twoFactor: false }`.

## 23. Subscribed calendars

Users can show calendars of other services next to their own, for example public or school holidays or a work calendar, by pasting its iCal address (`https://…` or `webcal://…`) in **Settings → Connections**. Up to 10 per user.

- They are read-only: their events open in a view-only dialog with a note where they come from, cannot be moved, and have no chat, attachments, reminders or history. **Duplicate** copies an event into an own calendar.
- Each one can be hidden, renamed and given a color, or unsubscribed again. A failed load is shown in the settings; the calendar keeps showing the last copy.
- The backend loads the files, the browser never contacts the other service. See [Rules for the backend](#rules-for-the-backend) for the protection against SSRF.
- Turn it off with `features: { externalCalendars: false }`.

## 24. Change history

Events in team calendars get a **History** tab: who created, changed, moved, deleted or restored the event and when, with the old and new value of title, place, description, start, end, all day, time zone, color and calendar. Changes to attendees, links, categories and the repetition are named without values. Entries are kept for a year. Turn it off with `features: { history: false }`.

## 25. Notifications

A bell next to the account button shows notifications with a badge for the unread ones: invitations to a team calendar or an event, changes and cancellations of events the user is invited to, replies to the user's events, chat messages and reminders. New ones arrive at once over the WebSocket. A click opens the event (or the invitations in the settings) and marks it as read; **Mark all as read** and removing single notifications are in the list. Read notifications are kept for 30 days, unread ones for 90. Turn it off with `features: { notifications: false }`.

## 26. CalDAV

**Settings → Connections** collects everything that links the calendar with other services: subscribed calendars ([section 23](#23-subscribed-calendars)), CalDAV accounts and the access for CalDAV programs. The tab only appears when at least one of them is available.

**Other programs use this calendar** (feature `caldav`). The section shows the server address and the user name (the email address) to enter in Apple Calendar, Thunderbird, DAVx⁵ or Outlook with a CalDAV add-in, and manages app passwords:

- Users create one app password per program (up to 20). It is shown once, with a button to copy it; the list shows creation and last use, and each one can be revoked.
- CalDAV accepts only app passwords, never the account password, so two-factor sign-in stays effective. A new account password revokes all app passwords.
- Every calendar the user can see appears as its own collection. The role decides as in the component: viewers can only read.
- Series and their detached occurrences are one resource, reminders are those of the signed-in user, attachments and chat stay in the component.
- Your backend implements the protocol described in `api/caldav.md` (`PROPFIND`, `REPORT` with `calendar-query`, `calendar-multiget` and `sync-collection`, `GET`, `PUT`, `DELETE`, `/.well-known/caldav`).

**This calendar uses other services** (feature `caldavAccounts`). Users connect up to 5 accounts of Nextcloud, iCloud, mailbox.org, Fastmail or any other CalDAV server with server address, user name and password (for iCloud an app-specific password):

- The backend finds the calendars itself, keeps a copy and synchronizes every 15 minutes or when the user asks. The browser never talks to the other server.
- The calendars appear next to the own ones with their name and color; each one can be hidden, renamed and recolored here without changing the other server.
- Events can be edited, moved, repeated, detached and deleted like own events, including undo. Every change goes to the other server at once with `If-Match`; when the event changed there in the meantime, the user sees `eventChanged` and the dialog offers to reload.
- When the component writes an event, it changes only what it knows (title, place, description, times, repetition, exceptions, attendees and their answers, links, reminders, color) and keeps everything else of the original, for example the organizer, categories, attachments or properties of other programs.
- Calendars the other server marks read-only open in a view-only dialog.
- The **Calendar** field of the event dialog lists the own calendars with the right to add events and the writable CalDAV calendars, so new events can go there directly and existing ones can move between all of them. A move between the component's calendars uses `POST /events/{eventId}/move`; a move to or from CalDAV creates the event in the target and then deletes the original (attachments and chat stay in the trash of the original).
- Repetitions the simple fields cannot describe keep their original rule in `recurrence.rule` and additional dates in `recurrence.dates`, so editing the title of such a series in the component does not change its repetition on the other server.
- Credentials are stored encrypted by the backend. Only `https`, no private networks, every redirect checked again (see [Rules for the backend](#rules-for-the-backend)).
