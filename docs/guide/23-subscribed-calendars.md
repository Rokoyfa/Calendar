# 23. Subscribed calendars

Users can show calendars of other services next to their own, for example public or school holidays or a work calendar, by pasting its iCal address (`https://…` or `webcal://…`) in **Settings → Connections**. Up to 10 per user.

- They are read-only: their events open in a view-only dialog with a note where they come from, cannot be moved, and have no chat, attachments, reminders or history. **Duplicate** copies an event into an own calendar.
- Each one can be hidden, renamed and given a color, or unsubscribed again. A failed load is shown in the settings; the calendar keeps showing the last copy.
- The backend loads the files, the browser never contacts the other service. See [Rules for the backend](10-backend.md#rules-for-the-backend) for the protection against SSRF.
- Turn it off with `features: { externalCalendars: false }`.

---

[← Previous](22-two-factor-sign-in-and-devices.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](24-change-history.md)
