# 7. Sign-in and tenants

There are three ways to handle users.

**No sign-in** (default). Everything stays in the visitor's browser. With `storageMode="remote"` all requests go to your backend without the calendar asking anyone to sign in. Who the visitor is, is then up to your backend, for example through a session cookie of your own site or a token from `getAccessToken` (see [Data adapters](08-data-adapters.md)).

**The calendar's own accounts.** Turn on the `auth` feature. The calendar then has pages for sign-in, registration, password reset and e-mail confirmation. Guests keep working in the browser, and after signing in they are asked whether to move their local events into the account.

```html
<calendar-widget storage-mode="remote" feature-auth api-base-url="https://api.example.com"></calendar-widget>
```

**Sign-in through your page.** If your visitors are already signed in on your site, pass `getUserToken`. It returns a short-lived token signed by your server, or `null` when nobody is signed in.

```tsx
<Calendar
  tenant="acme"
  apiBaseUrl="https://api.example.com"
  getUserToken={() => fetch('/calendar-token').then((r) => r.text())}
/>
```

- The calendar first asks `GET /auth/me`. On `401` it calls `getUserToken` and exchanges the token at `POST /auth/token` for a session. When the session runs out later, this happens again by itself.
- In this mode there are no sign-in, registration or password pages, no sign-out button and no account tab. The account belongs to your site.
- With `null` the calendar works like for guests, in the browser.

## Tenants

`tenant` is for a backend that serves several host pages. Every request then carries the header `X-Calendar-Tenant`, and sign-in is always on, whatever the `auth` feature says. With `storageMode="local"` the tenant is ignored and everything stays in the browser. What the backend has to check is described in the OpenAPI file.

- **The tenant id is public.** It only says which tenant a request belongs to and is no secret. The secret is the key your server signs the `getUserToken` tokens with; it never goes into the page.
- **Settings from the backend.** With `tenant` set, the calendar loads `GET /tenant/config` once at start. What the backend sets there wins over the page: built-in defaults, then the settings on the page (attributes, props or config file), then the tenant settings. Whatever the backend leaves out still comes from the page. So a host can change features, look, language and views in an admin dashboard without touching the page. Without `tenant` nothing changes: the page alone decides.
- **What stays with the page.** Where the data goes and how to reach it (`storageMode`, `apiBaseUrl`, `apiTimeoutMs`, `tenant`), the links (`routing`, `basename`, `linkParam`) and `getUserToken` cannot be set by the backend. The `auth` feature is ignored in both places, because a tenant always signs in. If the request fails, the calendar starts with the page settings only.
- **Turning features off for real.** The calendar only hides a feature. Your backend must also refuse it, with `403` and the code `featureDisabled`.
- **No open sign-up.** When users only come through your page, turn `registration` off in the tenant settings. The sign-up page then disappears, and the backend refuses `POST /auth/register`. Otherwise anyone who knows the public tenant id could create accounts in your tenant.

## Public tenant service

This part only applies when your page uses the public tenant service. With your own backend you decide what the token looks like and how users are deleted.

**Signing user tokens.** `getUserToken` must return a token that your server signs at that moment, for the user who is signed in on your site. Never build it in the browser and never put the private key into the page.

1. Create a key pair. Use `ES256` (recommended), `EdDSA` or `RS256` with at least 2048 bits. Shared secrets (`HS256`) are not accepted.

   ```bash
   openssl ecparam -name prime256v1 -genkey -noout | openssl pkcs8 -topk8 -nocrypt -out calendar-private.pem
   openssl pkey -in calendar-private.pem -pubout -out calendar-public.pem
   ```

2. Register `calendar-public.pem` for your tenant (admin dashboard or the operator of the backend). You get a key id (`kid`). Keys are valid for one year at most; add the next key before the old one runs out and revoke a key right away if it may have leaked.
3. Add an endpoint on your server that signs a fresh token for the current user. It must only answer for signed-in users, only to your own pages, and never be cached.

   ```ts
   import { randomUUID } from 'node:crypto'
   import { readFile } from 'node:fs/promises'
   import { SignJWT, importPKCS8 } from 'jose'

   const privateKey = await importPKCS8(await readFile('calendar-private.pem', 'utf8'), 'ES256')

   export const signCalendarToken = (user: { id: string; email: string; name: string }) =>
     new SignJWT({ email: user.email, name: user.name })
       .setProtectedHeader({ alg: 'ES256', kid: process.env.CALENDAR_KEY_ID! })
       .setIssuer('acme')
       .setAudience('rokoyfa-calendar')
       .setSubject(user.id)
       .setJti(randomUUID())
       .setIssuedAt()
       .setExpirationTime('2m')
       .sign(privateKey)
   ```

4. Pass it on: `getUserToken={() => fetch('/calendar-token', { credentials: 'same-origin' }).then((r) => (r.ok ? r.text() : null))}`.

Every token is accepted once and for at most five minutes, so a token that shows up in a log or a browser history is useless. The full rules are in the OpenAPI file under "Host token sign-in".

The address in `email` is not taken as confirmed. The first time it shows up, and after every change, the user gets a confirmation link. Until then the user can use the calendar but cannot see or accept team invitations.

**Deleting users.** When a user asks you to delete their data, open the host dashboard, go to the users of your tenant and enter the user's email address and name. Within about a minute the account is removed with everything that belongs only to it, but only if a user with this address and name exists in your tenant; teams the user led get the next member as owner. The dashboard shows whether the request is done or no matching user was found. Admins and owners can do this, viewers cannot, and every request is recorded in the audit log. There is no public API for it.

**Keeping your tenant safe.**

- Enter only your own HTTPS origins as allowed origins (`http://localhost` only for development). The backend refuses changes from other origins.
- Turn `registration` off when users only come through your page (see above).
- Serve the page with a Content-Security-Policy and keep third-party scripts to a minimum. A script that runs on your page can call your token endpoint like the calendar does.
- Give admin roles sparingly: viewers see the settings, admins change them, only owners manage keys and admins. Admin accounts sign in with a second factor.

---

[← Previous](06-reacting-to-changes.md) · [Contents](../../DEVELOPER_GUIDE.md) · [Next →](08-data-adapters.md)
