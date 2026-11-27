# 11. Event chat

Events in team calendars have a **Chat** tab: every member can read and write, edit and delete their own messages, and owners, admins and managers (`manage_calendars`) can delete any message. Recurring events have one chat per occurrence. A detached occurrence keeps the chat of its original date. The calendar shows unread messages as a red badge on the event and in the tab title, and attendees can get an email about new messages (`emailChat`, on by default, at most one email per chat every few minutes).

Messages go over REST (see the OpenAPI file, tag *Chat*). New, edited and deleted messages arrive live over a WebSocket:

- **Address:** `{apiBaseUrl}/chat/socket` with `ws://` or `wss://`, derived from `apiBaseUrl` (relative addresses use the page's host). With `tenant` the tenant is added as `?tenant=…`, because browsers cannot set headers on WebSockets. `restDataSource` takes another address as `chatSocketUrl`.
- **Sign-in:** the session cookie is sent with the handshake. Check the `Origin` header against the allowed origins and answer `401` without a session.
- **Server → client** (JSON text frames): `{ "type": "message.created" | "message.updated", "message": ChatMessage }` and `{ "type": "message.deleted", "id", "calendarId", "eventId", "occurrenceDate" }`, sent to every connected member of the calendar's team.
- **Client → server:** only `{ "type": "ping" }` every 25 seconds, answer with `{ "type": "pong" }` or ignore it.
- The component reconnects with growing pauses (1 to 30 seconds) and reloads the open chat and the unread counts after reconnecting, so a lost connection only delays messages.

Emails link to the host page with `?calendar=…&event=…&date=…&tab=chat`, which opens the event with the chat.

Without a WebSocket on your backend, turn the feature off: `features: { chat: false }`. The calendar then shows no chat. The same WebSocket also carries [live updates](18-live-updates.md); with both off, no connection is opened.

---

[← Previous](10-backend.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](12-calendar-subscriptions.md)
