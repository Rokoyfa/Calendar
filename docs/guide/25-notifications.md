# 25. Notifications

A bell next to the account button shows notifications with a badge for the unread ones: invitations to a team calendar or an event, changes and cancellations of events the user is invited to, replies to the user's events, chat messages, reminders, assigned tasks, tasks due soon that are not fully planned, and events of others that overlap planned time. New ones arrive at once over the WebSocket. A click opens the event (or the invitations in the settings) and marks it as read; **Mark all as read** and removing single notifications are in the list. Read notifications are kept for 30 days, unread ones for 90, and a user keeps at most 500: a new one removes the oldest. Your backend deletes the oldest before it stores a new one, in the same transaction; the action that caused the notification never fails because of the limit. Turn it off with `features: { notifications: false }`.

---

[← Previous](24-change-history.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](26-caldav.md)
