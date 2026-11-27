# 18. Live updates

When someone changes an event in a calendar that is shown, everyone else sees it at once, without reloading.

- **How.** The backend sends an `event.changed` message over the WebSocket that the chat uses too (see [Event chat](11-event-chat.md) for address, sign-in and pings, and [Rules for the backend](10-backend.md#rules-for-the-backend) for the message). The component then reloads the events of the visible range, several messages in a row only once.
- **Open dialog.** If another person changes or deletes the event that is open in the dialog, the dialog says so and offers to reload it. Saving anyway is still protected by `If-Match` (see [Rules for the backend](10-backend.md#rules-for-the-backend)).
- **Connection lost.** The component reconnects with growing pauses and reloads the events once it is back, so nothing is missed. If the very first five attempts fail, for example because your backend has no WebSocket, it stops trying until the calendar is opened again.
- **Local mode.** Without a backend, changes made in another tab of the same browser show up at once.
- **Own adapter.** Implement `events.subscribe(listener)` and call the listener with an `EventChange`. Return a function that ends the subscription. Without `subscribe` there are no live updates.

Without a WebSocket on your backend, turn chat and live updates off: `features: { chat: false, liveUpdates: false }`. The calendar then opens no connection.

---

[← Previous](17-attachments.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](19-trash.md)
