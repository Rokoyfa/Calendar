# 14. Read-only mode and public links

## Read-only mode

`readOnly` turns the calendar into a display. Events can be opened and read, but not created, changed, moved, deleted or imported. Views, search, the category filter and the user's own settings keep working.

```html
<calendar-widget read-only storage-mode="remote" api-base-url="https://api.example.com"></calendar-widget>
```

```tsx
<Calendar readOnly />
```

This is a display option, not a protection. Your backend still has to reject changes it does not allow.

## Public links

A member with `manage_calendars` can create a public link in the calendar's settings. Anyone with the link sees the calendar read-only, without an account.

- **What visitors see.** Title, time, location, description, links and categories of all events. Never attendees, reminders or chat.
- **One link per calendar.** Creating a new one, or stopping the share, turns the old link off at once.
- **Where the link points.** With `routing: memory` it is your own page with the link parameter, for example `https://example.com/team?calendarPath=%2Fshared%2F<token>`. With `routing: browser` it is `/shared/<token>` under your `basename`. If `linkParam` is `false`, the settings show the path instead, for use with `initialPath`.

To show a shared calendar permanently on a page, for example a club's public event list, open the widget on that path. Visitors do not sign in. Use the same data options as on your other pages, so the widget knows your backend (with accounts that is `feature-auth`, otherwise `storage-mode="remote"`):

```html
<calendar-widget feature-auth api-base-url="https://api.example.com" initial-path="/shared/<token>" style="height: 600px"></calendar-widget>
```

In local mode there is no backend to ask, so public links are not available.

Turn the feature off with `features: { publicLinks: false }`. Existing links then show a "not shared" message.

---

[← Previous](13-categories.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](15-controlling-the-calendar-from-your-page.md)
