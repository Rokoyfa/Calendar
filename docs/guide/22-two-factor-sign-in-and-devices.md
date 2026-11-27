# 22. Two-factor sign-in and devices

Accounts with a password can protect their sign-in with a code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password …). The component brings the whole page, so your backend only needs the endpoints.

- **Page.** `/two-factor` of the component, also reachable from **Settings → Security**. Turning it on asks for the password, shows a QR code and the key for typing it in, checks the first code and then shows ten recovery codes once, to copy or download. On the same page users create new recovery codes or turn the sign-in off again (password plus a code or recovery code).
- **Sign-in.** After a correct password the backend answers `202` with a `challenge` instead of a session. The sign-in page then asks for the code, or a recovery code, and calls `POST /auth/login/two-factor`. After 10 minutes or 5 wrong codes the user starts again with the password.
- **Link in the mail.** Let the confirmation mail after registration link to the page, e.g. `https://host.example/calendar/two-factor` with browser routing or `https://host.example/calendar?calendarPath=%2Ftwo-factor` with the link parameter. The test backend does this.
- **Devices.** **Settings → Security** lists all sessions of the user with browser, system, last use and a shortened IP address. Users can sign out one device or all others.
- **Not available** in local mode and with `getUserToken`: then the host signs the user in and protects that sign-in itself. Turn the page off with `features: { twoFactor: false }`.

---

[← Previous](21-accessibility.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](23-subscribed-calendars.md)
