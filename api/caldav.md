# CalDAV server

With the feature `caldav` the calendars of a user can be used in other programs, for example Apple Calendar (macOS,
iOS), Thunderbird, DAVx5 (Android) or Evolution. Changes go both ways. This file describes what a backend has to
offer; the JSON part (app passwords, access data) is in `openapi.yaml` under the tag **CalDAV**.

Standards: WebDAV (RFC 4918), CalDAV (RFC 4791), sync-collection (RFC 6578), current-user-principal (RFC 5397),
iCalendar (RFC 5545), service discovery (RFC 6764).

## Sign-in

- HTTP Basic over HTTPS only. User name is the email address, password an **app password** from
  `POST /auth/app-passwords`. The account password is never accepted here, so a two-factor sign-in stays effective.
- Wrong or revoked app passwords answer `401` with `WWW-Authenticate: Basic realm="Calendar"`. Count failures like
  sign-in attempts (5 in 15 minutes per user and address, then `429`).
- `last_used_at` of the app password is updated at most once a minute.
- A new account password (change or reset) revokes all app passwords.
- No cookies, no CORS: the CalDAV paths are not meant for browsers.

## Paths

| Path | Content |
| --- | --- |
| `/.well-known/caldav` | `301` to `/dav/` |
| `/dav/` | Root. `PROPFIND` answers `current-user-principal` |
| `/dav/principals/{userId}/` | Principal with `calendar-home-set`, `calendar-user-address-set` (`mailto:` of the user) and `displayname` |
| `/dav/calendars/{userId}/` | Calendar home. One collection per calendar the user can see |
| `/dav/calendars/{userId}/{calendarId}/` | Calendar collection |
| `/dav/calendars/{userId}/{calendarId}/{resource}` | One event resource (`text/calendar`) |

In the public multi-tenant service the paths start with `/dav/{tenantPublicId}/`; `/.well-known/caldav` on the tenant's
own domain points there. Everything else works the same, the tenant context comes from the path.

## Methods

| Method | Where | Answer |
| --- | --- | --- |
| `OPTIONS` | all | `DAV: 1, 3, calendar-access`, `Allow` |
| `PROPFIND` | all collections and resources, `Depth: 0` or `1` | `207`. Properties: `resourcetype`, `displayname`, `getetag`, `getcontenttype`, `getctag` (CalendarServer), `sync-token`, `supported-calendar-component-set` (`VEVENT`), `current-user-privilege-set`, `calendar-color` (Apple), `calendar-home-set`, `current-user-principal`, `owner`. Unknown properties go into a `404` propstat |
| `REPORT calendar-query` | collection | `207` with the events, optionally filtered by `time-range` |
| `REPORT calendar-multiget` | collection | `207` with the requested resources |
| `REPORT sync-collection` | collection | `207` with changes since the token; deleted resources as `404`. An unknown or too old token answers `403` with `<D:valid-sync-token/>` |
| `GET` | resource | `200` `text/calendar` with `ETag` |
| `PUT` | resource | `201` new or `204` changed, with `ETag`. `If-Match` / `If-None-Match: *` are respected (`412`). `403` without write permission |
| `DELETE` | resource | `204`, moves the event to the trash. `If-Match` like `PUT` |

`MKCALENDAR`, `MOVE`, `COPY` and `ACL` answer `403`: calendars are created in the component. `PROPPATCH` answers `207`
with `403` for every property, so programs that try to store a color or order do not stop with an error.

## Mapping

- **Resource:** a series together with its detached occurrences (`RECURRENCE-ID`) is one resource. The resource name is
  kept as the program sent it (`events.resource_name`); events created in the component get `{id}.ics`.
- **ETag:** `"{version}"` of the series. Every change of the series or one of its occurrences raises it.
- **UID:** `events.uid`. A `PUT` with a `UID` that already exists under another name in the same collection answers `409`
  `uidTaken` (`no-uid-conflict` precondition).
- **Fields:** `SUMMARY`, `LOCATION`, `DESCRIPTION`, `DTSTART`/`DTEND` with `TZID` or as date, `RRULE` (as far as the
  component supports it), `EXDATE`, `CATEGORIES` (matched by name to the calendar's categories, unknown ones are
  ignored), `ATTENDEE` with `PARTSTAT`, `URL` as link, `COLOR`. Unsupported properties are not kept.
- **Reminders:** `VALARM` are the reminders of the signed-in user only. Other users' reminders never leave the server.
- **Permissions:** the role decides as in the component. Without write permission `current-user-privilege-set` only
  contains `read`, and `PUT`/`DELETE` answer `403`.
- **Attachments and chat** stay in the component.

## Sync tokens

Every change of an event writes a row into `calendar_changes` (automatically, by trigger). The token is
`https://calendar.example.com/sync/{calendarId}/{highest change id}`; `getctag` is the same number. Changes older than
90 days are removed; a token below `calendars.sync_floor` is too old and answers `403` `valid-sync-token`, after which
programs load the collection again.
