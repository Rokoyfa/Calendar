# 12. Calendar subscriptions

With a backend that serves `/calendars/:id/feed` and `/feeds/:token.ics`, every signed-in user can subscribe to a calendar in another calendar app and see its events there, for example on the phone. Users get the link in the calendar settings: **Import & export** tab → **Subscribe** → **Create subscription link**. They can copy the link or open it in their calendar app.

- The subscription is **read-only**. Changes made in the other app do not come back.
- The link is **personal and secret**: it contains the user's own reminders, and anyone who has it can see all events of the calendar. **Create new link** turns the old one off, **End subscription** removes it.
- It stops working when the user leaves the calendar.

## Adding the link in calendar apps

| App | Steps |
| --- | --- |
| **Apple Calendar on Mac** | **Open in calendar app** in the settings, or *File → New Calendar Subscription…*, paste the link, **Subscribe**. Set *Auto-refresh* and choose *iCloud* as location so the calendar also appears on iPhone and iPad. |
| **Apple Calendar on iPhone / iPad** | **Open in calendar app** in the settings, or *Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar* (older iOS: *Settings → Calendar → Accounts*), paste the link as server, **Next**, **Save**. |
| **Google Calendar** | Only in the browser at calendar.google.com: next to *Other calendars* click **+** → **From URL**, paste the link, **Add calendar**. It then also shows in the Google Calendar apps on Android and iPhone. |
| **Outlook.com / Outlook on the web / new Outlook** | *Calendar → Add calendar → Subscribe from web*, paste the link, give it a name, **Import**. |
| **Classic Outlook for Windows** | *Home → Add Calendar → From Internet…* (in some versions *Open Calendar → From Internet*), paste the link, **OK**, confirm with **Yes**. |
| **Thunderbird** | *New Calendar → On the Network*, paste the link, choose the iCalendar (ICS) format. |

Menu names change between app versions. If a path does not match, look for “subscribe”, “from URL” or “from internet”.

## How quickly changes show up

A subscription is not live: the app downloads the whole calendar again at intervals that the app decides. Changes made in this calendar therefore appear with a delay:

| App | Refresh |
| --- | --- |
| Apple Calendar on Mac | Adjustable per subscription, from every 5 minutes to weekly (right-click the calendar → *Get Info* → *Auto-refresh*). *View → Refresh Calendars* (⌘R) refreshes right away. |
| Apple Calendar on iPhone / iPad | Follows *Fetch New Data* (*Settings → Apps → Calendar → Calendar Accounts → Fetch New Data*). Choose *Every 15 Minutes* or *Hourly*. Subscriptions have no push. A subscription added on the Mac with location *iCloud* is refreshed by iCloud. |
| Google Calendar | Google's own schedule, usually several hours, sometimes up to a day. Cannot be changed. |
| Outlook.com / web / new Outlook | Microsoft's own schedule, roughly every 3 hours, sometimes more than 24 hours. Cannot be changed. |
| Classic Outlook for Windows | Follows the update limit in the feed (one hour here) and Outlook's send/receive settings. |

The feed asks clients to reload every hour (`REFRESH-INTERVAL` and `X-PUBLISHED-TTL`), but most apps follow their own settings. For changes that must show up immediately, users should open this calendar directly, or connect the app over [CalDAV](26-caldav.md), which syncs both ways.

Without the feed endpoints, turn the feature off: `features: { subscriptions: false }`.

---

[← Previous](11-event-chat.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](13-categories.md)
