# 1. Embedding

There are two ways to embed the calendar. Both render the same component and take the same options.

## Web component, for any website

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

## React component

Needs React 19.

```bash
npm install @rokoyfa/calendar
```

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar style={{ height: 700 }} />
```

## What the host page should know

- **Height.** Give the calendar a height, it fills its box and scrolls inside. Without one it grows with its content.
- **Styles.** The calendar renders into a Shadow DOM. Your CSS does not reach in, its CSS does not leak out, and no stylesheet has to be imported.
- **Responsive.** The layout follows the width of the calendar, not of the window. A narrow calendar on a wide screen shows the phone layout.
- **Several calendars** on one page are independent, each with its own view and dialogs. In local mode they share the browser's storage.
- **Address bar.** By default (`routing: memory`) the calendar never touches the address of your page.

---

[Contents](../../DEVELOPER_GUIDE.md) · [Next →](02-options.md)
