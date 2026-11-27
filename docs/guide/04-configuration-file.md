# 4. Configuration file

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

## Example files

Two complete, commented examples list every option with its default. Copy one and delete what you do not need:

- [`demo/calendar.config.yaml`](../../demo/calendar.config.yaml)
- [`demo/calendar.config.jsonc`](../../demo/calendar.config.jsonc), the same as JSON

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

## What can be in the file

All options from [Options](02-options.md) under their prop names, except those that cannot be written as data: `dataSource`, `getUserToken`, the event callbacks, `className`, `style` and `config` itself. `features` is an object of feature names with `true` or `false`, `messages` an object of language → texts, `appearance` an object with `accentColor`, `fontFamily`, `radius` and `density`.

## How the file is read

- **Format.** Files ending in `.yaml` or `.yml` are read as YAML, files ending in `.json` or `.jsonc` as JSON. For other addresses the `Content-Type` of the answer decides. JSON files may contain `//` and `/* */` comments.
- **YAML parser.** It is only loaded when a YAML file is used. With the script tag it is a separate file next to `calendar-widget.js`, with the npm package it comes from the `yaml` dependency.
- **Precedence.** Props and attributes win over the file, for features one switch at a time. So one shared file can be adjusted per page: `<calendar-widget config="/calendar.config.yaml" feature-search="false">`.
- **Mistakes in the file.** Unknown or invalid entries are skipped, the rest is used. Every skipped entry is listed as a warning in the browser console, starting with `[calendar]`.
- **File not reachable or not parseable.** The calendar shows a message and does not start. It never falls back to defaults silently, because that could mean storing events in the wrong place.
- **Loading.** The file is fetched once when the calendar starts and again when the `config` address changes. Cache it like any other static file.
- **Texts.** `messages` in a file can override plain texts. Texts that are functions need the `messages` prop or property, see [Languages and texts](05-languages-and-texts.md).
- **Security.** The file is public, like everything a browser loads. Never put secrets in it.

## Editor support

A JSON Schema ships with the package as `@rokoyfa/calendar/config.schema.json`. With it, editors complete field names and flag wrong values.

```json
{ "$schema": "https://unpkg.com/@rokoyfa/calendar/schema/calendar-config.schema.json" }
```

```yaml
# yaml-language-server: $schema=https://unpkg.com/@rokoyfa/calendar/schema/calendar-config.schema.json
```

## Checking a configuration yourself

`parseCalendarOptions` is the function the calendar uses. It returns the valid options and a list of problems, useful in a build step or an admin page:

```ts
import { parseCalendarOptions } from '@rokoyfa/calendar'

const { options, issues } = parseCalendarOptions(JSON.parse(text))
if (issues.length > 0) console.warn(issues)
```

---

[← Previous](03-features.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](05-languages-and-texts.md)
