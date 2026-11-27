# 30. Finding a common time

**Find a common time** in the event dialog (on the tabs General and Attendees, as soon as a timed event has attendees) looks up when everyone is busy and suggests free times.

- **Suggestions.** Up to ten times for the chosen duration (the event's length to start with) in a window of 14 days from the event's day, at most three per day, every half hour between the planning hours of the user's settings (08:00 to 20:00 by default), on weekdays unless **Include weekends** is on. **Earlier** and **Later** move the window. Days blocked for anyone by an all-day event with a fixed category are skipped. Choosing a suggestion sets start and end of the event; nothing is saved until the user saves the event.
- **Whose time counts.** The user's own and that of every attendee the backend answers for. The dialog lists everyone with **Busy times known** or **No information, not taken into account**, so it is clear which suggestions are certain.
- **What others see.** Only busy intervals, merged and without title, place, attendees or any other detail, and only of people who share a team with the user or share their personal calendar with them. Everybody can turn it off under Settings › Connections › **Availability** (`shareFreeBusy`).

What your backend has to enforce for `POST /free-busy`:

- **Who may be looked up.** The signed-in user, members of a team they belong to, and people who share their personal calendar with them (accepted). Nobody else, and nobody who set `shareFreeBusy` to `false`. Answer everyone else exactly like an address without an account (`available: false`, `name: null`, empty lists), so the endpoint never tells whether an address has an account.
- **What counts as busy.** Timed events of the calendars in the person's personal view (their own, team calendars shown there, connected CalDAV calendars) and events they are invited to and have not declined, with series expanded. Pending requests do not count; `excludeEventId` (the event being rescheduled) does not count. All-day events only count through `blockedDates`, and only with a fixed category, like for planning.
- **What you return.** Merged intervals clipped to the range, as UTC instants, nothing else. Never titles, ids, calendars or the number of events.
- **Limits.** At most 20 addresses and 31 days per request, at most 30 requests per minute per user (`429` with `rateLimited`).
- **The setting.** `shareFreeBusy` is a boolean in the preferences, `true` by default.

Turn the feature off with `features: { freeBusy: false }`. If `POST /free-busy` answers `404`, `405` or `501`, the dialog says that the server does not offer it.

---

[← Previous](29-tasks.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](31-app-and-push-notifications.md)
