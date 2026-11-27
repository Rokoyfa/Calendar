# 31. App and push notifications

**Installing as an app.** The calendar can run as an installable web app (PWA). The page needs a web app manifest and a service worker; the demo app of this repository has both (`public/manifest.webmanifest`, `public/sw.js`, icons in `public/icons`) and registers the service worker in production builds. On your own page:

1. Serve a manifest with `display: "standalone"`, a name and icons of 192 and 512 pixels (one of them `"purpose": "maskable"`), and link it with `<link rel="manifest">`. Add `<link rel="apple-touch-icon">` for iPhone and iPad.
2. Copy `public/sw.js` from the package (`node_modules/@rokoyfa/calendar/public/sw.js`) next to your page, adjust it if your page already has a service worker, and register it: `navigator.serviceWorker.register('/sw.js')`. It keeps the start page and the files under `assets/` for offline starts, never caches API answers or other origins, and shows push notifications.
3. Call `enableInstallPrompt()` (exported by the package) as early as possible, before the calendar renders. The widget then catches the browser's install prompt and shows an **App** section under Settings › Appearance with **Install app** (or, on iPhone and iPad, how to add it to the home screen). Without the call the widget leaves the browser's own install behaviour alone and shows nothing.
4. Call `enablePageSync()` (exported by the package) if the calendar fills the page. The widget then keeps `<meta name="theme-color">` on its own background color, so the title bar of the installed app and the browser bar on phones follow light and dark mode and custom colors, and sets `<html lang>` to the calendar's language, so browsers do not offer to translate the page. Without the call the widget does not touch the page.

**Push notifications.** Under Settings › Notifications each user turns on **On this device**. The browser asks for permission, the widget subscribes with the key from `GET /push/key` and sends the subscription to `POST /push/subscriptions`. From then on every new notification of the bell also arrives as a system notification, also while the calendar is closed; a click opens the matching event, task or invitation. **Off**, signing out and a subscription the push service no longer knows all remove it. The section explains when push is not possible: browsers without push, iPhone and iPad before the calendar is on the home screen (Apple only allows push for installed web apps), pages without a service worker, and notifications blocked in the browser. A subscription of another app on the same page is never touched.

What your backend has to enforce:

- **Keys.** Create one VAPID key pair (P-256) and keep the private key secret, like a password: whoever has it can send push in your name. `GET /push/key` returns the public key as base64url.
- **Subscriptions.** Accept only https endpoints of push services you know (Google, Mozilla, Apple, Microsoft), never addresses in private networks, and keys of the right size (65 and 16 bytes). Bind a subscription to the user and to the session that created it, and delete it when the session ends. Replace an existing subscription with the same endpoint, also when it belonged to someone else (the device changed hands). Keep at most 10 per user.
- **Sending.** For every new notification send `{ "title", "body", "url", "tag" }`, encrypted with `aes128gcm` (RFC 8291) and signed with VAPID (RFC 8292), with a short TTL. Build the text in the user's language from the notification, put no more into it than the bell shows, and keep `url` inside your app. Delete subscriptions that answer `404` or `410`.
- **Feature switch.** Turn push off with `features: { push: false }`. If `GET /push/key` answers `404`, `405` or `501`, turning it on fails with a message and nothing is stored.

---

[← Previous](30-finding-a-common-time.md) · [Contents](../../DEVELOPER_GUIDE.md)
