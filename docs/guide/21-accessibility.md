# 21. Accessibility

The calendar aims at WCAG 2.2 AA and is checked with axe-core in light and dark mode.

- **Keyboard.** Every event is a button and can be reached with `Tab`. On an event, `↑` and `↓` move to the previous or next event of the same day, `←` and `→` to the nearest event on the previous or next day with events, `Home` and `End` to the first and last event in view, `Enter` opens its preview, from which **Edit** opens the full dialog. On a time slot, `Enter` opens the quick entry for a new event. The other shortcuts are listed in the tooltips of the header buttons and next to the entries of the calendar menu, and `?` (or **Keyboard shortcuts** in the calendar menu) shows all of them. Popovers (quick entry, event preview, date jump, quick switcher) close with `Esc` and return the focus to where it was.
- **Screen readers.** Each day column and month cell is a group named after its date, with "today" and public holidays. Events are announced with title, time, place, repetition, calendar, the user's own response and the number of attachments. The period title in the header is a live region, so moving to the next week is announced. Dialogs are labelled by their title and move the focus into the dialog.
- **Contrast.** Text and event colors meet 4.5:1 in both themes. In dark mode, text on the built-in event colors and the accent is dark. If you change colors with `--calendar-*` properties, check the contrast of your own colors.
- **Creating events.** In the day and week view, `Tab` reaches the time grid. The arrow keys pick the hour (`↑` / `↓`) and the day (`←` / `→`), `Home` and `End` jump to 0:00 and 23:00, `Enter` or `Space` opens the dialog for that time. Only one slot is a tab stop, so the grid costs a single `Tab`. The **+** button and `N` create an event at the current time.
- **Focus.** Closing a dialog returns the focus to where it was, for example to the event or slot that opened it.

---

[← Previous](20-data-export.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](22-two-factor-sign-in-and-devices.md)
