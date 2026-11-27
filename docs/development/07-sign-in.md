# Anmeldung

Eingeschaltet über `VITE_FEATURE_AUTH=true`. Ist der Schalter aus, gibt es keine Konto-Elemente, und alle Konto-Seiten (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) leiten auf den Kalender um.

## Ablauf

- Der Kalender ist **ohne Anmeldung voll nutzbar**, Termine liegen dann im localStorage. Oben rechts steht **Anmelden**.
- **Seiten:** `/login` und `/register` sind eigene Seiten (React Router). Nach dem Absenden geht es zurück zur vorherigen Seite des Kalenders. Erlaubt sind dabei nur interne Pfade, Weiterleitungen auf fremde Seiten werden ignoriert. Angemeldet führen beide Seiten direkt zum Kalender.
- **Angemeldet** zeigt die Kopfzeile einen runden Button mit dem Anfangsbuchstaben. Er öffnet ein kleines Menü mit Name, E-Mail, **Kalender wechseln**, **Einstellungen** und **Abmelden**. Ein Klick auf einen Eintrag schließt das Menü.
- **Aktueller Kalender:** Unter dem Monatstitel zeigt eine farbige Plakette, welcher Kalender gerade offen ist: Farbpunkt, Name und „Nur für dich“ bzw. „Team · Rolle“. Sie ist nur Anzeige; gewechselt wird über das Profilmenü.
- **Schnellwechsel:** Die Plakette mit dem aktiven Kalender über dem Kalender (`ActiveCalendarIndicator`) ist ein Button mit Pfeil, sobald es mehr als einen Kalender gibt oder Teams an sind. Er öffnet ein Popover (`.quickSwitcher`, `placeBelowTriggerStart`) mit den Kalendern nach Persönlich, Teams und Geteilt (Punkt in Kalenderfarbe, Name, Rolle, Haken am aktiven), ab 8 Kalendern mit Suchfeld, darunter **Alle Kalender …** (öffnet das Fenster) und **Neuer Kalender**. Beim Öffnen liegt der Fokus auf dem aktiven Kalender, Pfeiltasten, Pos1 und Ende wandern durch die Liste, Esc schließt. Fenster und Popover teilen sich die Daten über `useCalendarOptions`. Ohne Auswahl bleibt die Plakette reine Anzeige.
- **Kalender wechseln** öffnet ein großes Fenster mit den Tabs **Persönlich**, **Teams** (mit `teams`) und **Geteilt** (sobald Freigaben verfügbar sind), Teams und Geteilt mit Anzahl. Geöffnet wird der Tab des aktiven Kalenders; ist nur „Persönlich“ da, fehlen die Tabs. Die Kalender stehen als Kacheln: oben eine Vorschau des aktuellen Monats in der Kalenderfarbe, darunter Name, Team und die eigene Rolle. Der aktive Kalender ist blau umrandet mit Haken. Auf dem Handy zwei Kacheln nebeneinander. Gibt es offene Einladungen, steht über den Tabs ein Hinweis mit Link zu den Einstellungen. Die Liste kommt aus `features/calendars` (`CalendarsProvider`, `useCalendars`), angemeldet von `GET /calendars`, ohne Anmeldung nur „Persönlich“.
- **Speicher je nach Sitzung:** Angemeldet werden Termine über die API geladen und gespeichert, abgemeldet wieder lokal. Der Wechsel passiert automatisch.
- **Sitzung beim Start:** Die App fragt beim Laden `GET /auth/me` ab und zeigt bis zur Antwort kurz „Lädt …“, damit nicht erst lokale und dann Konto-Termine erscheinen.
- **Abgelaufene Sitzung:** Antwortet die API bei einem Termin-Aufruf mit 401, gilt man als abgemeldet und sieht wieder die lokalen Termine.
- **Lokale Termine übernehmen:** Liegen nach der Anmeldung Termine im localStorage, fragt die App einmal:
  - *In mein Konto übernehmen:* Alle Termine werden über die API angelegt, Serien und herausgelöste Einzeltermine bleiben verknüpft. Danach wird der localStorage geleert.
  - *Nur in diesem Browser behalten:* Die Termine bleiben lokal. Für dieses Konto wird nicht mehr gefragt (gemerkt unter `calendar.localImportDeclined.v1`).
- **Formulare:** Prüfung im Browser:
  - E-Mail-Format
  - Passwort 8 bis 128 Zeichen
  - Wiederholung des Passworts muss übereinstimmen
  - Name höchstens 80 Zeichen

  Die E-Mail wird klein geschrieben und ohne Leerzeichen gesendet. Die Felder für ein neues Passwort (Registrieren, Zurücksetzen, Ändern) kommen wie Name, E-Mail und aktuelles Passwort aus `AuthFields.tsx` (`NameField`, `EmailField`, `CurrentPasswordField`, `NewPasswordFields`). Passwörter lassen sich mit **Anzeigen** sichtbar machen. Die Felder tragen die passenden `autocomplete`-Werte, damit Passwort-Manager sie erkennen.

## Passwort vergessen und E-Mail bestätigen

- **Passwort vergessen:** Link unter dem Passwortfeld der Anmeldung führt zu `/forgot-password`. Nach dem Absenden kommt immer dieselbe Meldung („Falls es ein Konto gibt …“), damit sich nicht herausfinden lässt, welche Adressen registriert sind.
- **Neues Passwort:** Der Link aus der E-Mail führt zu `/reset-password?token=…`. Fehlt der Token oder ist er abgelaufen, bietet die Seite einen neuen Link an.
- **E-Mail bestätigen:** Der Link aus der E-Mail führt zu `/verify-email?token=…`. Die Seite bestätigt automatisch beim Öffnen, auch im React-StrictMode nur einmal je Token.
- **Hinweisleiste:** Solange die E-Mail-Adresse nicht bestätigt ist, zeigt der Kalender oben eine Leiste mit **Erneut senden**.

## Konto in den Einstellungen

Angemeldet zeigt `/settings` zusätzlich:

- **Profil:** Name ändern
- **E-Mail-Adresse:** Status „Bestätigt“ oder „Nicht bestätigt“, Bestätigungslink erneut senden
- **Passwort ändern:** aktuelles Passwort und neues Passwort zweimal. Das neue muss sich vom aktuellen unterscheiden.
- **Konto löschen:** Bestätigung im Fenster mit Passwort, danach zurück zum Kalender (abgemeldet)

Der Tab **Sicherheit** (nur mit Passwort-Anmeldung) zeigt den Stand der Zwei-Faktor-Anmeldung mit Link auf `/two-factor` und die angemeldeten Geräte (`SessionsSection.tsx`): Browser und System aus dem User-Agent, letzte Nutzung, gekürzte IP, einzeln oder alle anderen abmelden. Code: `features/authorization/components/security/`.

## Zwei-Faktor-Anmeldung

- **Seite** `/two-factor` (`TwoFactorPage.tsx`, Schalter `twoFactor`): Passwort bestätigen → QR-Code (Bibliothek `qrcode`, erst auf dieser Seite nachgeladen, im npm-Paket als Abhängigkeit, im CDN-Bundle enthalten) und Schlüssel zum Eintippen → erster Code → zehn Wiederherstellungscodes zum Kopieren oder Herunterladen. Ist sie aktiv: neue Codes erzeugen, ausschalten mit Passwort und Code oder Wiederherstellungscode.
- **Anmeldung:** `POST /auth/login` antwortet mit `202` und `challenge`; die Anmeldeseite zeigt dann `TwoFactorLoginStep` (Code aus der App oder Wiederherstellungscode, `POST /auth/login/two-factor`). Bei `twoFactorExpired` geht es zurück zum Passwort.
- **Mail:** Die Bestätigungsmail nach der Registrierung enthält im TestBE einen zweiten Link auf `/two-factor`.
- Mit `getUserToken` und im lokalen Modus gibt es weder Seite noch Tab.

## Agenda, abonnierte Kalender, Verlauf, Glocke

- **Agenda** (`AgendaView.tsx`): die nächsten 30 Tage als Liste, nur Tage mit Terminen oder Feiertagen, Kürzel `A`, Ansicht `agenda` in `views`, `initialView` und den Einstellungen.
- **Abonnierte Kalender** (`features/external`, Schalter `externalCalendars`): `ExternalCalendarsProvider` lädt die Liste und den Inhalt jedes angezeigten Kalenders (`GET /external-calendars/:id/ics`, alle 15 Minuten neu), `features/external/utils/externalCalendar.ts` macht daraus mit dem iCal-Import schreibgeschützte Termine mit `calendarId` `external:<id>`. Der Kalender mischt sie vor `expandEvents` dazu; sie lassen sich nicht ziehen, nicht bearbeiten und haben weder Chat noch Anhänge, Erinnerungen oder Verlauf. Verwaltung in **Einstellungen → Verbindungen**.
- **CalDAV-Konten** (`features/caldav`, Schalter `caldavAccounts`): `CaldavProvider` lädt die Konten (`/caldav-accounts`) und gibt die Kalender an `CaldavEventRepository` (`features/caldav/repositories`). `withCaldavEvents` legt sich in `CalendarApp` um das Termin-Repository und leitet alles mit `calendarId` `caldav:<id>` dorthin; so funktionieren Bearbeiten, Ziehen, Serien-Umfänge und Rückgängig ohne Sonderwege. Termin-IDs sind `caldav:<kalender>:<objekt>` bzw. `…:<datum>` für herausgelöste Termine. `features/caldav/utils/caldav.ts` liest ein Objekt (`toCaldavEvents`) und schreibt es zurück (`buildCaldavObject`): nur die bekannten Eigenschaften werden ersetzt, alles andere des Originals (Organisator, Kategorien, `X-`-Eigenschaften, Anhänge, fremde Alarme, Parameter der Teilnehmenden) bleibt. Objekte werden 60 Sekunden zwischengespeichert, nach `eventChanged` sofort neu geladen. Schreibgeschützte Kalender öffnen nur zum Ansehen und lassen sich nicht ziehen. `CalendarPage` hängt die angezeigten CalDAV-Kalender an `calendarIds` an.
- **CalDAV-Zugang** (Schalter `caldav`): `CaldavServerSettings` zeigt Serveradresse und Benutzername (`GET /caldav`) und verwaltet App-Passwörter (`/auth/app-passwords`). Das Protokoll selbst steht in `api/caldav.md`.
- **Tab Verbindungen** in `SettingsPage`: abonnierte Kalender, CalDAV-Konten und CalDAV-Zugang; erscheint nur, wenn eins davon verfügbar ist.
- **Verlauf** (`HistoryPanel.tsx`, Schalter `history`): Tab im Termin-Dialog, nur in Team-Kalendern.
- **Glocke** (`features/notifications`, Schalter `notifications`): `NotificationBell` neben dem Konto-Button, Liste im Popover, neue Einträge über `notification.created` auf demselben WebSocket wie Chat und Live-Updates. Ein Klick öffnet den Termin über die Link-Parameter (`calendar`, `event`, `date`, bei Chat `tab=chat`) oder die Einladungen; Termine aus Kalendern ohne Zugriff sind nur Text.

Der Tab **Daten** lädt die eigenen Daten als JSON herunter (DSGVO Art. 20): angemeldet über `GET /auth/me/export`, im lokalen Modus alles, was der Browser unter `calendar.*` speichert. Code: `DataExportSection.tsx`, `features/authorization/utils/dataExport.ts`. Schalter: `dataExport`.

## Backend-Vertrag

Die Anmeldung läuft über ein **HttpOnly-Cookie**, das ausschließlich das Backend setzt und liest. Die App speichert keine Tokens. Alle Pfade liegen unter `VITE_API_BASE_URL`.

| Aufruf | Body | Antwort |
| ------ | ---- | ------- |
| `GET /auth/me` | – | `200` mit `User` oder `401`, wenn nicht angemeldet |
| `POST /auth/register` | `{ name, email, password }` | `201` mit `User` und Sitzungs-Cookie, `409` wenn die E-Mail schon existiert |
| `POST /auth/login` | `{ email, password }` | `200` mit `User` und Sitzungs-Cookie, `401` bei falschen Daten |
| `POST /auth/logout` | – | `204`, Cookie löschen |
| `PATCH /auth/me` | `{ name }` | `200` mit `User` |
| `POST /auth/me/password` | `{ currentPassword, newPassword }` | `204`, `403` bei falschem aktuellem Passwort. Andere Sitzungen beenden. |
| `DELETE /auth/me` | `{ password }` | `204` und Cookie löschen, `403` bei falschem Passwort, `409` wenn einziger Owner eines Teams mit Mitgliedern |
| `POST /auth/password-reset` | `{ email }` | immer `204`, auch für unbekannte Adressen. Schickt einen Link mit Token (1 Stunde gültig). |
| `POST /auth/password-reset/confirm` | `{ token, password }` | `204`, `410` bei ungültigem oder abgelaufenem Token. Alle Sitzungen des Nutzers beenden. |
| `POST /auth/verify-email` | `{ token }` | `204`, `410` bei ungültigem oder abgelaufenem Token. Geht auch ohne Anmeldung. |
| `POST /auth/verify-email/resend` | – | `204`, schickt einen neuen Bestätigungslink |

Die Links in den E-Mails zeigen auf `/reset-password?token=…` und `/verify-email?token=…` der App.

`User` ist `{ id: string, email: string, name: string, emailVerified: boolean }`. Alle `/events`-, `/calendars`-, `/teams`- und `/invitations`-Aufrufe gelten für den angemeldeten Nutzer und antworten ohne gültige Sitzung mit `401`.

**Kalender und Einladungen** (`RemoteCalendarRepository`):

| Aufruf | Body | Antwort |
| ------ | ---- | ------- |
| `GET /calendars` | – | `CalendarSummary[]`, persönlicher Kalender zuerst |
| `POST /calendars` | `{ name, description, color, invitations: [{ email, role }] }` | `201` mit `CalendarSummary` |
| `PUT /calendars/:id/display` | `{ showInPersonal }` | `200` mit `CalendarSummary` |
| `DELETE /teams/:teamId/membership` | – | `204`, Team verlassen. `409` als letzter Owner. |
| `POST /teams/:teamId/transfer-ownership` | `{ userId }` | `200` mit den `CalendarSummary[]` des Teams, nur für Owner |
| `GET /invitations` | – | offene Einladungen an die eigene E-Mail-Adresse |
| `POST /invitations/:id/accept` | – | `200` mit den `CalendarSummary[]` des Teams |
| `POST /invitations/:id/decline` | – | `204` |

**Einstellungen und eigene Farben** (`RemotePreferencesRepository`, `RemoteColorRepository`, nur angemeldet):

| Aufruf | Body | Antwort |
| ------ | ---- | ------- |
| `GET /preferences` | – | `{ theme, defaultView, mobileDefaultView, locale }`, ohne gespeicherte Werte die Standardwerte |
| `PATCH /preferences` | einzelne Felder davon | `200` mit allen Einstellungen |
| `GET /colors` | – | `HexColor[]` in der Reihenfolge des Hinzufügens |
| `POST /colors` | `{ color: '#rrggbb' }` | `200` mit allen Farben. Schon vorhandene Farben werden nicht doppelt angelegt. `409` (`tooManyColors`) ab 12 Farben. |
| `DELETE /colors/:rrggbb` | – | `200` mit den übrigen Farben (Farbe ohne `#` im Pfad) |

`CalendarSummary` ist `{ id, teamId, name, color, kind: 'personal' | 'team', teamName, description, role, showInPersonal, permissions }`. Weitere Endpunkte für Mitglieder, Rollen, weitere Kalender und Team-Verwaltung bietet das Test-Backend schon an (siehe dessen README), die Oberfläche dafür fehlt noch.

**Fehler** kommen als `{ "code": "…", "message": "…" }`. Kennt die App den `code` (z. B. `invalidCredentials`, `emailTaken`, `forbidden`, `lastOwner`, `tooManyColors`, vollständige Liste in `src/utils/appError.ts`), zeigt sie ihre eigene Übersetzung. Sonst zeigt sie die englische `message` des Servers, ohne beides eine Standardmeldung je Status. Eingaben, die schon die App prüft, meldet der Server nur allgemein als `invalidInput`.

**Sprache:** Jede Anfrage trägt `Accept-Language` mit der aktuellen Sprache der App (z. B. `de-DE`). Das Backend schreibt E-Mails in der Sprache aus den gespeicherten Einstellungen des Empfängers, sonst nach `Accept-Language`, sonst Englisch.

**Anforderungen an das Backend:**

- **Cookie:** `HttpOnly`, `Secure` (in Produktion), `SameSite=Lax` oder `Strict`, `Path=/`
- **CSRF:** Ändernde Aufrufe nur mit `Content-Type: application/json` annehmen. Bei Cookie-Anmeldung zusätzlich `SameSite` oder einen CSRF-Token nutzen.
- **Passwörter:** nur gehasht speichern (z. B. Argon2id oder bcrypt). Login-Versuche begrenzen.
- **Andere Domain:** Läuft die API unter einer anderen Domain als die App, braucht sie `Access-Control-Allow-Credentials: true` und eine konkrete `Access-Control-Allow-Origin` (kein `*`). Der API-Client sendet Cookies dafür immer mit (`credentials: 'include'`).

## Hosting

Weil `/login`, `/settings` usw. echte Pfade sind, muss der Webserver für unbekannte Pfade die `index.html` ausliefern (SPA-Fallback). `npm run dev` und `npm run preview` machen das bereits.

---

[← Zurück](06-api-client.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](08-features.md)
