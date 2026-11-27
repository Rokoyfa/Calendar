# 6. Reacting to changes

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

---

[← Previous](05-languages-and-texts.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](07-sign-in-and-tenants.md)
