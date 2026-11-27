# 15. Controlling the calendar from your page

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
| `setView(view)` | Switches to `day`, `week`, `month`, `year`, `agenda` or `tasks` |
| `next()`, `previous()`, `today()` | The same as the buttons in the header |
| `openEvent(eventId, date)` | Goes to the date and opens the event. For a recurring event the date picks the occurrence |
| `createEvent(draft?)` | Opens the dialog for a new event, optionally filled in: `{ title, startDate, start, end, endDate, allDay, location, description }`. Nothing is stored until the user saves |
| `refresh()` | Loads the events again, for example after your page changed data on the backend |

- Every method except `getState()` returns `true` when it was carried out and `false` otherwise.
- A method answers `false` while the calendar itself is not on screen (settings, sign-in, or the configuration still loading), when an argument is invalid, when `setView` asks for a view that is not in `views`, and `createEvent` when the user may not create events.
- `view-change` / `onViewChange` fires once at the start and then whenever the view or the dates change, with the same value as `getState()`.

---

[← Previous](14-read-only-mode-and-public-links.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](16-look-and-feel.md)
