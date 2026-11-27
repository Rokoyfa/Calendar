# 27. Booking pages

Booking pages let people without an account book a free time in a calendar, like an appointment page. A member with `manage_calendars` manages them in the **Booking pages** tab of the calendar settings, for the personal calendar and for team calendars.

- **Settings per page.** Title, description, place, duration (5 to 480 minutes), start times every 5 to 240 minutes, a break between bookings, a minimum notice, how many days ahead people can book (up to 365), an optional limit per day, the time zone and the available times per weekday (up to 21 time ranges, `24:00` as the end of a day). Up to 10 pages per calendar. A page can be switched off without deleting it.
- **Link.** Every page has its own secret link, built like a public link: with `routing: memory` your page with the link parameter (`calendarPath=%2Fbook%2F<token>`), with `routing: browser` `/book/<token>` under your `basename`. **Create new link** turns the old one off; bookings already made stay valid.
- **Free times.** The backend offers only times that fit the weekly times, the notice and the horizon, and that do not overlap any event, open booking or confirmed booking, including the break before and after. For the personal calendar every event the owner sees counts as busy: the personal calendar, team calendars shown in it, and connected CalDAV calendars. For a team calendar only that calendar counts. Events the owner declined are ignored; all-day events block their whole day.
- **The public page** (`/book/:token`) shows title, host name, duration, place and description, and the free times of one week in the visitor's time zone. The visitor enters name, email address and an optional note.
- **Confirmation by email.** A booking first holds the time for 15 minutes and sends an email with a link to `/booking/confirm?token=…`. Only when the visitor presses **Confirm booking** there does the booking count: the backend checks the time again, creates the event in the calendar (title "<page title>: <name>", the visitor as accepted attendee, the note as description), notifies the owner (`bookingCreated`) and sends a second email with a link to `/booking/cancel?token=…`. The confirmation needs a button press, so link scanners in mail programs cannot confirm bookings.
- **Cancelling.** The cancel page shows the booking and cancels it until it starts. The event moves to the trash and the owner gets `bookingCanceled`. If the owner deletes the event, the booking counts as cancelled.
- **Limits.** At most 10 booking requests per hour from one address, 3 open requests per email address and page, 30 open requests per page (`rateLimited`). Codes: `tooManyBookingPages`, `bookingPageNotFound`, `bookingNotFound`, `slotUnavailable`, `bookingExpired`.
- **Your backend** implements the endpoints tagged "Booking pages" in `api/openapi.yaml`. The email links point at your page like the other email links; your host page passes them on to the widget.

Turn the feature off with `features: { bookingPages: false }`. Existing links then show "This booking page does not exist or was turned off".

---

[← Previous](26-caldav.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](28-sharing-the-personal-calendar.md)
