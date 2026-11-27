# 26. CalDAV

**Settings → Connections** collects everything that links the calendar with other services: subscribed calendars ([section 23](23-subscribed-calendars.md)), CalDAV accounts and the access for CalDAV programs. The tab only appears when at least one of them is available.

**Other programs use this calendar** (feature `caldav`). The section shows the server address and the user name (the email address) to enter in Apple Calendar, Thunderbird, DAVx⁵ or Outlook with a CalDAV add-in, and manages app passwords:

- Users create one app password per program (up to 20). It is shown once, with a button to copy it; the list shows creation and last use, and each one can be revoked.
- CalDAV accepts only app passwords, never the account password, so two-factor sign-in stays effective. A new account password revokes all app passwords.
- Every calendar the user can see appears as its own collection. The role decides as in the component: viewers can only read.
- Series and their detached occurrences are one resource, reminders are those of the signed-in user, attachments and chat stay in the component.
- With the feature `tasks` every collection also holds the calendar's tasks as `VTODO`, so they show up in Apple Reminders, Thunderbird, Evolution or Tasks.org (with DAVx⁵). Title, notes, due date and time, status, priority, effort, categories and the repetition go both ways; checklist, assignee, fixed categories and planned time stay in the component and are kept when a program changes the task. Completing a repeating task there creates the next one as in the component.
- Your backend implements the protocol described in `api/caldav.md` (`PROPFIND`, `REPORT` with `calendar-query`, `calendar-multiget` and `sync-collection`, `GET`, `PUT`, `DELETE`, `/.well-known/caldav`).

**This calendar uses other services** (feature `caldavAccounts`). Users connect up to 5 accounts of Nextcloud, iCloud, mailbox.org, Fastmail or any other CalDAV server with server address, user name and password (for iCloud an app-specific password):

- The backend finds the calendars itself, keeps a copy and synchronizes every 15 minutes or when the user asks. The browser never talks to the other server.
- The calendars appear next to the own ones with their name and color; each one can be hidden, renamed and recolored here without changing the other server.
- Events can be edited, moved, repeated, detached and deleted like own events, including undo. Every change goes to the other server at once with `If-Match`; when the event changed there in the meantime, the user sees `eventChanged` and the dialog offers to reload.
- When the component writes an event, it changes only what it knows (title, place, description, times, repetition, exceptions, attendees and their answers, links, reminders, color) and keeps everything else of the original, for example the organizer, categories, attachments or properties of other programs.
- Calendars the other server marks read-only open in a view-only dialog.
- The **Calendar** field of the event dialog lists the own calendars with the right to add events and the writable CalDAV calendars, so new events can go there directly and existing ones can move between all of them. A move between the component's calendars uses `POST /events/{eventId}/move`; a move to or from CalDAV creates the event in the target and then deletes the original (attachments and chat stay in the trash of the original).
- Repetitions the simple fields cannot describe keep their original rule in `recurrence.rule` and additional dates in `recurrence.dates`, so editing the title of such a series in the component does not change its repetition on the other server.
- Credentials are stored encrypted by the backend. Only `https`, no private networks, every redirect checked again (see [Rules for the backend](10-backend.md#rules-for-the-backend)).

---

[← Previous](25-notifications.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](27-booking-pages.md)
