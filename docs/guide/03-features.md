# 3. Features

Everything beyond the core calendar (views, creating, editing, moving and deleting events, colors, all-day events) can be switched off. A feature that is off disappears from the interface and the component makes no calls for it, so your backend does not have to provide it.

```jsx
<Calendar storageMode="remote" features={{ auth: true, chat: false, subscriptions: false }} views={['week', 'month']} />
```

```html
<calendar-widget storage-mode="remote" feature-auth feature-chat="false" feature-subscriptions="false" views="week month"></calendar-widget>
```

Your backend only needs the endpoints of the features that are on, plus a small core (see [Backend](10-backend.md)).

| Feature | Attribute | Default | What it covers | Your backend needs |
| --- | --- | --- | --- | --- |
| `auth` | `feature-auth` | off | Sign-in and accounts | `/auth/me`, `/auth/login`, `/auth/logout`, `/auth/me/password`, `/auth/password-reset*`, `/auth/verify-email*` |
| `teams` | `feature-teams` | on | Team calendars, members, roles, invitations, moving events between calendars | `POST /calendars`, `DELETE /calendars/:id`, `PUT /calendars/:id/display`, `POST /events/:id/move`, `/teams/*`, `/invitations/*` |
| `chat` | `feature-chat` | on | Chat per event in team calendars | Chat endpoints and the WebSocket, see [Event chat](11-event-chat.md) |
| `attendees` | `feature-attendees` | on | Inviting members to events, replies | `POST /events/:id/response`, `POST /events/email-response` |
| `recurrence` | `feature-recurrence` | on | Creating and editing recurring events | – |
| `reminders` | `feature-reminders` | on | Reminders and their notifications | `PUT /events/:id/reminders` for members without edit rights |
| `links` | `feature-links` | on | Website and other links on events | – |
| `mapLinks` | `feature-map-links` | on | Opening a location in a map service | – |
| `holidays` | `feature-holidays` | on | Public holidays and their setting | `GET /holidays` only with `holidaySource="backend"` |
| `search` | `feature-search` | on | Event search | `GET /events/search` |
| `undo` | `feature-undo` | on | Undo after moving or deleting | – |
| `duplicate` | `feature-duplicate` | on | Duplicating events | – |
| `shortcuts` | `feature-shortcuts` | on | Keyboard shortcuts | – |
| `subscriptions` | `feature-subscriptions` | on | Subscription links in the calendar settings | `/calendars/:id/feed`, `/feeds/:token.ics` |
| `importExport` | `feature-import-export` | on | iCalendar import and export | – |
| `emailNotifications` | `feature-email-notifications` | on | E-mail settings of a signed-in user | Sending the e-mails |
| `timeZones` | `feature-time-zones` | on | Time zone per event and in the settings | – |
| `customColors` | `feature-custom-colors` | on | Own event colors | `/colors` |
| `categories` | `feature-categories` | on | Categories per calendar and the filter, see [Categories](13-categories.md) | `/categories`, `/calendars/:id/categories` |
| `attachments` | `feature-attachments` | on | Files on events, see [Attachments](17-attachments.md). Not in local mode | `/events/:id/attachments`, `/attachments/:id` |
| `liveUpdates` | `feature-live-updates` | on | Changes by others, or in other tabs, show up at once, see [Live updates](18-live-updates.md) | WebSocket `/chat/socket` with `event.changed` messages |
| `trash` | `feature-trash` | on | Trash in the calendar settings, see [Trash](19-trash.md) | `GET`/`DELETE /calendars/:id/trash`, `DELETE /calendars/:id/trash/:eventId`, `/events/:id/restore` |
| `dataExport` | `feature-data-export` | on | "Data" tab in the settings to download one's own data, see [Data export](20-data-export.md) | `GET /auth/me/export` |
| `registration` | `feature-registration` | on | Sign-up page and the link to it on the sign-in page | `POST /auth/register` |
| `publicLinks` | `feature-public-links` | on | Public read-only links and the page they open, see [Public links](14-read-only-mode-and-public-links.md) | `/calendars/:id/share`, `/shared/:token` |
| `twoFactor` | `feature-two-factor` | on | Two-factor sign-in for accounts with a password: the page `/two-factor` and a code step after the password, see [Two-factor sign-in](22-two-factor-sign-in-and-devices.md). Not in local mode or with `getUserToken` | `POST /auth/login/two-factor`, `/auth/two-factor*` |
| `externalCalendars` | `feature-external-calendars` | on | Subscribing to calendars of other services, shown read-only, see [Subscribed calendars](23-subscribed-calendars.md). Not in local mode | `/external-calendars*` |
| `history` | `feature-history` | on | "History" tab of events in team calendars, see [Change history](24-change-history.md). Not in local mode | `GET /events/:id/history` |
| `notifications` | `feature-notifications` | on | Bell with notifications, see [Notifications](25-notifications.md). Not in local mode | `/notifications*`, `notification.created` over the WebSocket |
| `caldav` | `feature-caldav` | on | Using the calendars in other programs over CalDAV with app passwords, see [CalDAV](26-caldav.md). Not in local mode | `/auth/app-passwords*`, `GET /caldav`, the CalDAV server from `api/caldav.md` |
| `caldavAccounts` | `feature-caldav-accounts` | on | Connecting accounts of other CalDAV services and editing their calendars, see [CalDAV](26-caldav.md). Not in local mode | `/caldav-accounts*`, `/caldav-calendars*` |
| `overlapWarnings` | `feature-overlap-warnings` | on | A note in the event dialog when the time overlaps other events of the shown calendars | – |
| `print` | `feature-print` | on | An entry in the calendar menu that prints the visible range or saves it as PDF | – |
| `bookingPages` | `feature-booking-pages` | on | Public pages where others book a free time, see [Booking pages](27-booking-pages.md). Not in local mode | `/calendars/:id/booking-pages`, `/booking-pages/*`, `/booking/*`, `/bookings/*` |
| `personalSharing` | `feature-personal-sharing` | on | Showing the personal calendar to invited people, who see private events only as busy time and can request events, see [Sharing the personal calendar](28-sharing-the-personal-calendar.md). Not in local mode | `/personal-sharing*`, `/peer-calendars*`, `/events/:id/request/*` |
| `tasks` | `feature-tasks` | on | Tasks with status, priority, due date, effort and checklist, on their day and in the task view, assignable in team calendars, plannable into free time with the settings tab **Planning**, see [Tasks](29-tasks.md) | `/tasks*`, `task.changed` over the WebSocket |
| `freeBusy` | `feature-free-busy` | on | **Find a common time** in the event dialog: suggests free times from the busy time of the attendees, without any details of their events, see [Finding a common time](30-finding-a-common-time.md). Needs `attendees`. Not in local mode | `POST /free-busy` |
| `push` | `feature-push` | on | Push notifications of the bell on the user's devices, also while the calendar is closed, switched on per device under Settings › Notifications, see [App and push notifications](31-app-and-push-notifications.md). Needs `notifications` and a service worker on the page. Not in local mode | `/push/*` |
| `tips` | `feature-tips` | on | A few short tips on first use: adding events, the event preview, switching calendars, jumping to a date, keyboard shortcuts (swiping on touch screens) and planning tasks. Shown once per user and device, until skipped or finished | – |

Good to know:

- `chat` and `attendees` need `teams`. Without teams they are off, whatever you set.
- With `undo` off, deleting an event asks for confirmation first.
- With `recurrence`, `links` or `reminders` off, existing data is kept when an event is saved. It is only no longer shown or editable.
- With `timeZones` off, the calendar always uses the automatic zone (your `timeZone`, otherwise the browser's).
- With a single entry in `views`, the view switch disappears.
- With `tasks` off, the `tasks` view is dropped from `views` as well.

---

[← Previous](02-options.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](04-configuration-file.md)
