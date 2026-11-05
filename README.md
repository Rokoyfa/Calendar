# Kalender

Online-Kalender als Website, gebaut mit React, TypeScript und Vite.

Ziel ist ein Kalender, der auf zwei Arten nutzbar ist:

- **Ohne Anmeldung:** Termine werden im Browser gespeichert (localStorage).
- **Mit Anmeldung:** Termine werden dauerhaft auf einem Server gespeichert.

Später folgt ein **Team-Modus**, in dem mehrere Mitglieder per E-Mail-Einladung einen gemeinsamen Kalender sehen und Termine anlegen können.

> **Aktueller Stand:** Ohne Anmeldung liegen alle Daten im **localStorage** des Browsers. **Anmeldung, Registrierung und Abmeldung** sind im Frontend fertig und hinter dem Schalter `VITE_FEATURE_AUTH` (siehe [Anmeldung](#anmeldung)). Ein passendes Backend gibt es noch nicht. Der Team-Modus ist noch nicht umgesetzt.

---

## Schnellstart

```bash
npm install
cp .example.env .env
npm run dev
```

Unter Windows (PowerShell) statt `cp`: `Copy-Item .example.env .env`. Ohne `.env` startet die App mit den Standardwerten im localStorage-Modus.

| Befehl            | Beschreibung                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Entwicklungsserver starten                  |
| `npm run build`   | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Produktions-Build lokal ansehen             |
| `npm run lint`    | ESLint ausführen                            |

**Technik:** React 19, React Router 8, TypeScript 6, Vite 8, ESLint. Voraussetzung ist **Node.js 22.22 oder neuer** (verlangt von React Router 8).

---

## Konfiguration (.env)

Die App wird über Umgebungsvariablen eingestellt. Vite liest sie aus diesen Dateien:

| Datei                | Im Git | Zweck                                                         |
| -------------------- | ------ | ------------------------------------------------------------- |
| `.example.env`       | ja     | Vorlage mit allen Variablen und Standardwerten                |
| `.env`               | nein   | Eigene lokale Werte, Kopie der Vorlage                        |
| `.env.[mode]`        | ja     | Optional: Werte für einen Modus, z. B. `.env.production`     |
| `.env.local`, `.env.[mode].local` | nein | Optional: persönliche Überschreibungen, haben Vorrang |

### Variablen

| Variable              | Standard                | Beschreibung |
| --------------------- | ----------------------- | ------------ |
| `VITE_STORAGE_MODE`   | `local`                 | `local` speichert im localStorage, `remote` über die API. Wird ignoriert, wenn `VITE_FEATURE_AUTH=true` ist, dann entscheidet die Anmeldung. |
| `VITE_API_BASE_URL`   | `/api`                  | Adresse der API. Relativ (`/api`) oder absolut (`https://api.example.com`). Wird nur im Modus `remote` genutzt. |
| `VITE_API_TIMEOUT_MS` | `10000`                 | Maximale Wartezeit pro API-Anfrage in Millisekunden |
| `VITE_FEATURE_AUTH`   | `false`                 | Schaltet Anmeldung, Registrierung und Abmeldung ein (siehe [Anmeldung](#anmeldung)). Braucht das Backend mit den `/auth`-Endpunkten. |
| `VITE_FEATURE_TEAMS`  | `false`                 | Schalter für den Team-Modus. Vorbereitet, noch ohne Wirkung. |
| `API_PROXY_TARGET`    | `http://localhost:3000` | Nur Entwicklung: Backend, an das `npm run dev` und `npm run preview` alle Aufrufe unter `VITE_API_BASE_URL` weiterleiten. Greift nur bei relativer API-Adresse. |

### Wichtig

- **Alles mit `VITE_` landet im ausgelieferten JavaScript und ist für jeden lesbar.** Dort niemals Geheimnisse wie API-Schlüssel, Passwörter oder Tokens eintragen. Geheimnisse gehören ausschließlich ins Backend.
- `API_PROXY_TARGET` hat kein `VITE_` und wird nur vom Vite-Server gelesen, nicht vom Browser.
- Werte werden beim Start von `npm run dev` bzw. `npm run build` geprüft. Ein ungültiger Wert, zum Beispiel `VITE_STORAGE_MODE=cloud`, bricht mit einer genauen Fehlermeldung ab. Nach einer Änderung an einer `.env`-Datei den Dev-Server neu starten.
- Variablen werden beim Build fest eingebaut. Für eine andere Umgebung muss neu gebaut werden.
- Alle Variablen werden zentral in `src/config/parseEnv.ts` gelesen und geprüft. Der Rest der App nutzt nur `env` aus `src/config/env.ts`, nie `import.meta.env` direkt. Neue Variablen dort und in `src/env.d.ts` ergänzen und in `.example.env` aufnehmen.

### API lokal anbinden

1. Backend lokal starten, zum Beispiel auf Port 3000
2. In `.env` setzen: `VITE_STORAGE_MODE=remote` und `API_PROXY_TARGET=http://localhost:3000`
3. `npm run dev` neu starten

Der Browser ruft dann `/api/...` auf derselben Adresse wie die App auf, Vite leitet an das Backend weiter. Dadurch sind in der Entwicklung keine CORS-Einstellungen nötig.

Zum Testen ohne echtes Backend gibt es im Nachbarordner `TestBE` ein Test-Backend mit allen `/auth`- und `/events`-Endpunkten (Start mit `npm install` und `npm run dev`, Port 3000). Dort auch `VITE_FEATURE_AUTH=true` setzen.

---

## API-Client

Alle Aufrufe an das Backend laufen über einen gemeinsamen Client aus `src/utils/api.ts`. Direktes `fetch` wird im übrigen Code nicht verwendet.

### Verwendung

Für neue Features gibt es eine fertig konfigurierte Instanz mit Adresse und Timeout aus der `.env`:

```ts
import { apiClient } from '../../../config/api.ts'
import { encodePathSegment } from '../../../utils/api.ts'

const teams = await apiClient.get<Team[]>('/teams', { query: { page: 1, tags: ['a', 'b'] } })
const team = await apiClient.post<Team>('/teams', { name: 'Familie' })
await apiClient.put<Team>(`/teams/${encodePathSegment(id)}`, changes)
await apiClient.patch<Team>(`/teams/${encodePathSegment(id)}`, { name: 'Neu' })
await apiClient.delete(`/teams/${encodePathSegment(id)}`)
```

Eigene Instanzen entstehen mit `createApiClient({ baseUrl, timeoutMs, getAccessToken, onUnauthorized, headers, credentials })`, so macht es auch `RemoteEventRepository`.

### Was der Client übernimmt

- **JSON:** Objekte werden als JSON gesendet, Antworten mit JSON-Content-Type automatisch gelesen. `FormData`, `Blob`, `URLSearchParams` und Strings gehen unverändert raus, zum Beispiel für Datei-Uploads.
- **Query-Parameter:** `query: { a: 1, b: ['x', 'y'] }` wird zu `?a=1&b=x&b=y`, `null` und `undefined` werden weggelassen.
- **Leere Antworten:** `204 No Content` und leere Antworten ergeben `undefined`.
- **Token:** Liefert `getAccessToken` einen Wert, wird `Authorization: Bearer …` gesetzt. Vorbereitet für die Anmeldung.
- **Timeout:** Standard aus `VITE_API_TIMEOUT_MS`, pro Anfrage über `timeoutMs` änderbar.
- **Abbruch:** Ein eigenes `signal` (z. B. `AbortController`) wird zusammen mit dem Timeout berücksichtigt.
- **401:** Ruft `onUnauthorized` auf, gedacht zum Abmelden, wenn der Token abgelaufen ist.

### Fehler

Jeder Fehler ist ein `ApiError` (aus `src/utils/apiError.ts`) mit einer deutschen, anzeigbaren Meldung. Er funktioniert mit `getErrorMessage` und `ErrorMessage` wie jeder andere Fehler.

| `kind`    | `status` | Meldung |
| --------- | -------- | ------- |
| `http`    | 4xx/5xx  | `message` aus der Server-Antwort, sonst eine Standardmeldung je Status, z. B. 401 „Bitte melde dich an.“, 404 „Der Eintrag wurde nicht gefunden.“, 5xx „Auf dem Server ist ein Fehler aufgetreten.“ |
| `timeout` | `null`   | Der Server hat nicht rechtzeitig geantwortet. |
| `network` | `null`   | Der Server ist nicht erreichbar. |
| `aborted` | `null`   | Die Anfrage wurde abgebrochen. |
| `parse`   | `null`   | Die Antwort des Servers konnte nicht gelesen werden. |

Zusätzlich gibt es `error.isUnauthorized`, `error.isNotFound`, `error.isServerError` und `error.body` mit der vollständigen Server-Antwort. Prüfen mit `isApiError(error)`.

Fehlermeldungen vom Backend sollten als JSON in der Form `{ "message": "…" }` kommen, dann werden sie direkt angezeigt.

> Der Typ in `get<T>()` ist eine Zusicherung, keine Prüfung zur Laufzeit. Antwortet das Backend mit einer anderen Struktur, fällt das erst bei der Verwendung auf.

---

## Anmeldung

Eingeschaltet über `VITE_FEATURE_AUTH=true`. Ist der Schalter aus, gibt es keine Konto-Elemente, und alle Konto-Seiten (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`) leiten auf den Kalender um.

### Ablauf

- Der Kalender ist **ohne Anmeldung voll nutzbar**, Termine liegen dann im localStorage. Oben rechts steht **Anmelden**.
- **Seiten:** `/login` und `/register` sind eigene Seiten (React Router). Nach dem Absenden geht es zurück zur vorherigen Seite des Kalenders. Erlaubt sind dabei nur interne Pfade, Weiterleitungen auf fremde Seiten werden ignoriert. Angemeldet führen beide Seiten direkt zum Kalender.
- **Angemeldet** zeigt die Kopfzeile einen runden Button mit dem Anfangsbuchstaben. Er öffnet ein kleines Menü mit Name, E-Mail, **Kalender wechseln**, **Einstellungen** und **Abmelden**. Ein Klick auf einen Eintrag schließt das Menü.
- **Aktueller Kalender:** Unter dem Monatstitel zeigt eine farbige Plakette, welcher Kalender gerade offen ist: Farbpunkt, Name und „Nur für dich“ bzw. „Team · Rolle“. Sie ist nur Anzeige; gewechselt wird über das Profilmenü.
- **Kalender wechseln** öffnet ein großes Fenster mit dem persönlichen Kalender und den Team-Kalendern als Kacheln: oben eine Vorschau des aktuellen Monats in der Kalenderfarbe, darunter Name, Team und die eigene Rolle. Der aktive Kalender ist blau umrandet mit Haken. Auf dem Handy zwei Kacheln nebeneinander. Vorbereitet für den Team-Modus: Bisher gibt es nur „Persönlich“, unter „Teams“ steht ein Hinweis. Die Liste kommt aus `features/calendars` (`CalendarsProvider`, `useCalendars`) und soll später aus `GET /calendars` bzw. der Sicht `user_calendars` gefüllt werden.
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

### Passwort vergessen und E-Mail bestätigen

- **Passwort vergessen:** Link unter dem Passwortfeld der Anmeldung führt zu `/forgot-password`. Nach dem Absenden kommt immer dieselbe Meldung („Falls es ein Konto gibt …“), damit sich nicht herausfinden lässt, welche Adressen registriert sind.
- **Neues Passwort:** Der Link aus der E-Mail führt zu `/reset-password?token=…`. Fehlt der Token oder ist er abgelaufen, bietet die Seite einen neuen Link an.
- **E-Mail bestätigen:** Der Link aus der E-Mail führt zu `/verify-email?token=…`. Die Seite bestätigt automatisch beim Öffnen, auch im React-StrictMode nur einmal je Token.
- **Hinweisleiste:** Solange die E-Mail-Adresse nicht bestätigt ist, zeigt der Kalender oben eine Leiste mit **Erneut senden**.

### Konto in den Einstellungen

Angemeldet zeigt `/settings` zusätzlich:

- **Profil:** Name ändern
- **E-Mail-Adresse:** Status „Bestätigt“ oder „Nicht bestätigt“, Bestätigungslink erneut senden
- **Passwort ändern:** aktuelles Passwort und neues Passwort zweimal. Das neue muss sich vom aktuellen unterscheiden.
- **Konto löschen:** Bestätigung im Fenster mit Passwort, danach zurück zum Kalender (abgemeldet)

### Backend-Vertrag

Das Datenbankschema für das Backend (MySQL 8 / MariaDB) liegt in [`database/`](database/README.md).

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

`User` ist `{ id: string, email: string, name: string, emailVerified: boolean }`. Alle `/events`-Aufrufe gelten für den angemeldeten Nutzer und antworten ohne gültige Sitzung mit `401`.

Ohne eigene `message` vom Server zeigt die App passende Meldungen, z. B. bei `401` am Login „E-Mail-Adresse oder Passwort ist falsch.“, bei `409` an der Registrierung „Für diese E-Mail-Adresse gibt es bereits ein Konto.“ und bei `410` „Der Link ist ungültig oder abgelaufen.“. Liefert der Server `{ "message": "…" }`, wird diese Meldung angezeigt.

**Anforderungen an das Backend:**

- **Cookie:** `HttpOnly`, `Secure` (in Produktion), `SameSite=Lax` oder `Strict`, `Path=/`
- **CSRF:** Ändernde Aufrufe nur mit `Content-Type: application/json` annehmen. Bei Cookie-Anmeldung zusätzlich `SameSite` oder einen CSRF-Token nutzen.
- **Passwörter:** nur gehasht speichern (z. B. Argon2id oder bcrypt). Login-Versuche begrenzen.
- **Andere Domain:** Läuft die API unter einer anderen Domain als die App, braucht sie `Access-Control-Allow-Credentials: true` und eine konkrete `Access-Control-Allow-Origin` (kein `*`). Der API-Client sendet Cookies dafür immer mit (`credentials: 'include'`).

### Hosting

Weil `/login`, `/settings` usw. echte Pfade sind, muss der Webserver für unbekannte Pfade die `index.html` ausliefern (SPA-Fallback). `npm run dev` und `npm run preview` machen das bereits.

---

## Funktionen

### Ansichten

Umschaltbar über **Tag / Woche / Monat / Jahr** in der Kopfzeile. Pfeile und **Heute** springen immer um die Einheit der aktuellen Ansicht.

- **Tag:** ein Tag im Zeitraster von 00:00 bis 23:00 Uhr, Titel z. B. „Samstag, 31. Oktober 2026“
- **Woche:** Montag bis Sonntag im Zeitraster, Titel mit Monat(en) und Kalenderwoche. Ein Klick auf einen Tageskopf öffnet diesen Tag.
- **Monat:** Monatsraster mit bis zu drei Terminen pro Tag, darüber hinaus „+N weitere“. Ein Klick auf die Tageszahl oder „weitere“ öffnet den Tag, ein Klick auf eine freie Stelle legt dort einen Termin um 09:00 an.
- **Jahr:** alle zwölf Monate als kleine Raster, Tage mit Terminen haben einen Punkt. Ein Klick auf einen Tag öffnet die Tagesansicht, ein Klick auf den Monatsnamen die Monatsansicht.
- Heutiger Tag ist hervorgehoben. Eine **Linie zeigt die aktuelle Uhrzeit** über alle Tage der Tages- und Wochenansicht, in der Spalte von heute kräftig rot mit Punkt. Sie erscheint nur, wenn heute im sichtbaren Zeitraum liegt, und rückt jede Minute weiter.
- Mehrtägige und wiederkehrende Termine erscheinen in allen Ansichten

### Handy

- Kopfzeile zweizeilig: Navigation und **+** oben, darunter Titel und Ansichtsumschalter über die volle Breite
- Woche: alle sieben Tage passen ohne seitliches Scrollen auf den Bildschirm. Dafür kompakte Tagesköpfe („Mo 26“), nur Stundenzahlen in der Zeitspalte und kleinere Termine mit Silbentrennung. Ein Tipp auf den Tageskopf öffnet den Tag.
- Monat: statt Terminleisten eine Zahl mit der Anzahl der Termine je Tag
- Jahr: Monate zweispaltig
- Startansicht ist auf dem Handy standardmäßig **Tag**, auf größeren Bildschirmen **Woche**. Beides lässt sich in den Einstellungen ändern. Als Handy gilt eine Breite bis 700 px.

### Termine

- Anlegen per Klick auf eine Stunde im Raster oder über den **+**-Button im Header
- Bearbeiten per Klick auf einen Termin
- Löschen mit Sicherheitsabfrage (Ja / Nein)
- Felder: Titel, Startdatum, Beginn, Enddatum, Ende, Beschreibung, Farbe
- **Mehrtägige Termine:** Ein Termin kann über Mitternacht oder mehrere Tage gehen. Wird das Startdatum geändert, verschiebt sich das Enddatum um dieselbe Anzahl Tage.
- Eingaben werden geprüft, zum Beispiel Pflichttitel, Enddatum nicht vor Startdatum und Ende nach Beginn
- Ein Klick auf 23:00 legt einen Termin bis 00:00 des Folgetags an

### Wiederkehrende Termine

- Wiederholung **täglich, wöchentlich, monatlich oder jährlich**, jeweils mit Intervall, zum Beispiel alle 2 Wochen
- Wöchentlich: beliebige Wochentage auswählbar, zum Beispiel Montag und Mittwoch. Wird das Startdatum geändert und ist nur dessen Wochentag gewählt, wandert der Wochentag mit.
- Monatlich, abgeleitet vom Startdatum, wahlweise:
  - **am selben Tag**, zum Beispiel „am 15.“. Monate ohne diesen Tag werden übersprungen (31. → nur Monate mit 31 Tagen).
  - **am n-ten Wochentag**, zum Beispiel „am zweiten Dienstag“. Beim fünften Wochentag werden Monate ohne fünften übersprungen.
  - **am letzten Wochentag**, zum Beispiel „am letzten Freitag“. Wird nur angeboten, wenn das Startdatum in der letzten Woche des Monats liegt.
- Jährlich am selben Datum, der 29. Februar nur in Schaltjahren
- Ende der Serie: **nie**, **an einem Datum** (letzter möglicher Termin, inklusiv) oder **nach einer Anzahl** von Terminen (1 bis 999). Gezählt werden alle erzeugten Termine, auch später gelöschte oder herausgelöste.
- Unter den Feldern steht eine Zusammenfassung, zum Beispiel „Wöchentlich am Montag und Mittwoch bis 30.11.2026“
- Wiederkehrende Termine tragen im Raster ein Wiederholungssymbol, der Tooltip zeigt die Regel
- **Bearbeiten und Löschen** fragen bei Serien, wofür die Aktion gilt:
  - *Nur dieser Termin:* Das Datum wird in der Serie ausgenommen. Beim Bearbeiten entsteht ein Einzeltermin mit den neuen Werten, der mit der Serie verknüpft bleibt.
  - *Dieser und alle folgenden:* Die Serie endet am Vortag. Beim Bearbeiten beginnt ab diesem Termin eine neue Serie mit den neuen Werten. Bei „Endet nach Anzahl“ übernimmt sie die verbleibende Anzahl. Wird nur angeboten, wenn es vorher noch Termine gibt.
  - *Alle Termine:* Die Änderung gilt für die ganze Serie. Wird der Termin dabei um Tage verschoben, verschiebt sich die ganze Serie mit.
  - Wird die Wiederholungsregel selbst geändert, gibt es nur „Dieser und alle folgenden“ und „Alle Termine“, beim ersten Termin wird ohne Nachfrage die ganze Serie geändert.
- **Herausgelöste Einzeltermine** gehören weiter zur Serie: Sie werden mit „Alle Termine“ bzw. „Dieser und alle folgenden“ gelöscht, und wechseln bei einer Aufteilung zur neuen Serie.
- Wird ein Termin in eine andere Woche verschoben, springt der Kalender nach dem Speichern dorthin

### Darstellung von Terminen

- Position und Höhe entsprechen exakt Uhrzeit und Dauer
- **Überlappende Termine** stehen nebeneinander und teilen sich die Spaltenbreite, zum Beispiel 2 Termine je 50 % und 3 Termine je 33 %. Die Tagesspalten behalten ihre Breite.
- Kurze Termine werden kompakter dargestellt, ab 90 Minuten wird zusätzlich die Uhrzeit angezeigt
- **Mehrtägige Termine** werden pro Tag als eigener Abschnitt im Raster gezeigt: am ersten Tag ab Beginn bis 24:00, dazwischen ganztägig, am letzten Tag ab 00:00 bis zum Ende. An den Übergängen sind die Ecken eckig, damit der Zusammenhang sichtbar bleibt. Die Zeitangabe enthält dann auch die Daten, zum Beispiel `30.10. 10:00 – 03.11. 16:00`.

### Termine und Kalender

Jeder Termin gehört genau zu einem Kalender (`calendarId`). Geladen werden nur die Termine der sichtbaren Kalender (`visibleCalendarIds`):

- **Persönlicher Kalender offen:** die persönlichen Termine plus die Termine aller Team-Kalender, bei denen „Auch im persönlichen Kalender anzeigen“ an ist.
- **Team-Kalender offen:** nur die Termine dieses Team-Kalenders. **Persönliche Termine erscheinen nie in einem Team-Kalender.**

Neue Termine landen immer im gerade offenen Kalender. Beim Bearbeiten bleibt ein Termin in seinem Kalender, auch herausgelöste Termine und fortgesetzte Serien. Beim Abmelden oder Kontowechsel wird die Kalenderauswahl zurückgesetzt, damit nichts versehentlich in einen fremden Kalender geschrieben wird.

### Kalender erstellen

Eigene Seite `/calendars/new` (nur angemeldet, sonst Anmeldung und danach zurück). Erreichbar über die Kachel **Neuer Kalender** in „Kalender wechseln“ und den Button **Kalender erstellen** in den Einstellungen.

Die Erstellung läuft in Schritten, oben zeigt ein `Stepper` den Fortschritt. Erledigte Schritte lassen sich anklicken, um zurückzuspringen. Eingaben bleiben dabei erhalten.

1. **Name:** Name (Pflicht, bis 80 Zeichen) und Beschreibung (optional, bis 500 Zeichen)
2. **Farbe:** gleiche Auswahl wie bei Terminen, mit Vorschau des Kalenders
3. **Mitglieder:** E-Mail und Rolle eingeben, **Hinzufügen** oder Enter. Unter der Auswahl steht, was die Rolle darf. Geprüft wird: gültige Adresse, nicht doppelt, nicht die eigene, höchstens 50. Der Schritt ist optional.
4. **Überprüfen:** Zusammenfassung mit Vorschau, dann **Kalender erstellen**

Danach ist der neue Kalender aktiv und man landet im Kalender. Der Ersteller ist Owner.

Ohne Backend wird der Kalender nur in der Oberfläche angelegt und ist nach dem Neuladen weg. Einladungen werden noch nicht verschickt. Für das Backend fehlt in der Datenbank noch eine Spalte für die Beschreibung, z. B. `teams.description` oder `calendars.description`.

### Einstellungen

Seite `/settings`, erreichbar über **Einstellungen** im Kontomenü (runder Button mit dem Anfangsbuchstaben). Mit `VITE_FEATURE_AUTH=true` nur für Angemeldete: `/settings` leitet sonst zum Kalender um, auch direkt nach dem Löschen des Kontos. Ohne Anmeldefunktion gibt es kein Kontomenü, dann führt ein Zahnrad in der Kopfzeile zu den Einstellungen.

Oben wechseln Tabs zwischen **Kalender**, **Darstellung** (Farbschema, Startansicht, eigene Farben) und **Konto** (nur angemeldet). Der gewählte Tab steht in der Adresse (`/settings?tab=appearance`), bleibt also beim Neuladen erhalten und lässt sich verlinken. Pfeiltasten links/rechts wechseln den Tab.

Die Seite nutzt die volle Breite: links Titel und Erklärung jedes Abschnitts, rechts die Einstellungen. Auf dem Handy untereinander.

- **Kalender:** alle Kalender, auf die man Zugriff hat (persönlich und Teams), mit Farbe, Team und eigener Rolle. Bei Team-Kalendern legt ein Schalter fest, ob ihre Termine **auch im persönlichen Kalender** erscheinen (`showInPersonal`, Standard an). Team-Kalender lassen sich mit Bestätigung **verlassen**, außer man ist Owner. Der persönliche Kalender lässt sich nicht entfernen. Bisher gibt es nur „Persönlich“, die Teams kommen später vom Backend.
- **Farbschema:** Wie System, Hell oder Dunkel. Gesetzt über `data-theme` am `<html>`, die Farben kommen weiter aus `light-dark()`.
- **Startansicht** getrennt für Computer/Tablet und Handy
- **Eigene Farben** ansehen und entfernen. Termine mit dieser Farbe behalten sie.
- Gespeichert in diesem Browser unter `calendar.preferences.v1` (Farben weiter unter `calendar.colors.v1`). Beim ersten Start legt die App beide Einträge mit Standardwerten an: Farbschema `system`, Startansicht Woche bzw. Tag auf dem Handy, keine eigenen Farben. Vorhandene Werte bleiben unverändert. Das Datenbankschema hat dafür schon `user_preferences` und `user_colors`.
- Angemeldet kommen die Konto-Abschnitte dazu, siehe [Konto in den Einstellungen](#konto-in-den-einstellungen).

### Farben

- Vier Standardfarben: Blau, Rot, Grün, Gelb
- Über den grauen **+**-Kreis lassen sich **eigene Farben** hinzufügen, maximal 12
- Eigene Farben werden gespeichert und stehen in jedem Termin wieder zur Auswahl. Entfernen lassen sie sich in den Einstellungen.
- Die Schriftfarbe auf eigenen Farben wird automatisch hell oder dunkel gewählt

### Bedienung

| Aktion                | Tastatur / Maus                    |
| --------------------- | ---------------------------------- |
| Zurück (Tag, Woche, Monat, Jahr) | `←` oder linker Pfeil im Header    |
| Vor (Tag, Woche, Monat, Jahr)    | `→` oder rechter Pfeil im Header   |
| Zu heute                         | **Heute** im Header                |
| Ansicht wechseln                 | Tag / Woche / Monat / Jahr         |
| Fenster schließen                | `Esc` oder Klick neben das Fenster |

Die Pfeiltasten sind deaktiviert, solange ein Eingabefeld oder ein Fenster aktiv ist.

### Design

- Farben und Layout basieren auf dem ursprünglichen Kalender-Design
- **Hell- und Dunkelmodus**, standardmäßig nach Systemeinstellung
- Manuell umschaltbar über `document.documentElement.dataset.theme = 'dark' | 'light'`. Einen Schalter in der Oberfläche gibt es noch nicht.
- Die Farben beider Modi stehen nur einmal in `variables.css` (CSS-Funktion `light-dark()`, unterstützt von allen aktuellen Browsern)
- Auf kleinen Bildschirmen lässt sich das Raster seitlich scrollen

---

## Datenspeicherung

Standardmäßig wird **nur der localStorage** des Browsers verwendet. Die Daten sind daher an Browser und Gerät gebunden und gehen beim Löschen der Browserdaten verloren. Über `VITE_STORAGE_MODE=remote` lässt sich auf die API umstellen (siehe [Konfiguration](#konfiguration-env)), ein passendes Backend gibt es aber noch nicht.

| Schlüssel            | Inhalt                         |
| -------------------- | ------------------------------ |
| `calendar.events.v1` | Alle Termine als JSON-Array    |
| `calendar.colors.v1` | Eigene Farben als Hex-Werte    |

### Datenmodell eines Termins

```ts
type CalendarEvent = {
  id: string
  calendarId: string
  title: string
  startDate: string
  start: string
  endDate: string
  end: string
  description: string
  color: 'blue' | 'red' | 'green' | 'yellow' | `#${string}`
  recurrence: Recurrence | null
  excludedDates: string[]
  seriesId: string | null
  originalDate: string | null
  createdAt: string
  updatedAt: string
}

type Recurrence = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  weekdays: number[]
  monthlyMode: 'dayOfMonth' | 'weekdayOfMonth' | 'lastWeekdayOfMonth'
  until: string | null
  count: number | null
}
```

- `startDate` und `endDate` im Format `JJJJ-MM-TT`, `start` und `end` im Format `HH:MM`
- Das Ende ist exklusiv: `endDate` = Folgetag mit `end` = `00:00` bedeutet „bis Mitternacht“
- Ein wiederkehrender Termin wird **einmal** als Serie gespeichert. `startDate` bis `endDate` beschreibt das erste Vorkommen, die weiteren werden beim Anzeigen berechnet (`utils/recurrence.ts`).
- `weekdays` zählt von `0` = Montag bis `6` = Sonntag und wird nur bei `weekly` ausgewertet. `until` ist das letzte mögliche Startdatum (inklusiv) oder `null`.
- `monthlyMode` wird nur bei `monthly` ausgewertet, Tag bzw. Wochentag und dessen Position ergeben sich aus `startDate`
- `until` und `count` schließen sich aus, beide `null` heißt „endet nie“
- `excludedDates` enthält Startdaten einzelner Vorkommen, die gelöscht oder als Einzeltermin herausgelöst wurden
- Ein herausgelöster Einzeltermin hat `seriesId` (Id der Serie) und `originalDate` (ursprüngliches Startdatum des Vorkommens), sonst sind beide `null`
- Ältere Termine ohne `recurrence` und `excludedDates` werden als einmalige Termine gelesen, ältere Wiederholungen ohne `monthlyMode` und `count` mit `'dayOfMonth'` und `null`
- Ältere Termine mit dem früheren Feld `date` werden beim Lesen automatisch übernommen (`endDate` = `startDate`) und beim nächsten Speichern im neuen Format geschrieben
- `calendarId` ist `'personal'` für den persönlichen Kalender (`PERSONAL_CALENDAR_ID` in `config/calendars.ts`), sonst die ID des Team-Kalenders. Ältere lokale Termine mit `'local'` werden beim Lesen dem persönlichen Kalender zugeordnet.
- `createdAt` und `updatedAt` sind ISO-Zeitstempel, gedacht für spätere Synchronisierung

### Vorbereitung für Server-Speicherung

Der Zugriff auf Daten läuft ausschließlich über die Schnittstellen `EventRepository` und `ColorRepository` im Feature `storage`. Welche Umsetzung genutzt wird, entscheidet der `StorageProvider` in `App.tsx` anhand von `createStorageConfig` aus `src/config/storage.ts`:

- `VITE_STORAGE_MODE=local` → `{ mode: 'local' }`
- `VITE_STORAGE_MODE=remote` → `{ mode: 'remote', baseUrl: VITE_API_BASE_URL, timeoutMs: VITE_API_TIMEOUT_MS }`

Ist die Anmeldung eingeschaltet, entscheidet stattdessen die Sitzung: angemeldet `remote`, abgemeldet `local` (siehe [Anmeldung](#anmeldung)). Antwortet der Server nicht rechtzeitig oder ist er nicht erreichbar, zeigt der Kalender eine verständliche Fehlermeldung.

`RemoteEventRepository` ist dafür bereits angelegt und erwartet eine REST-API mit `GET /events?from=&to=&calendarId=…` (`calendarId` einmal je sichtbarem Kalender, `personal` steht für den eigenen persönlichen Kalender; liefert alle Termine, die den Zeitraum überschneiden, also `startDate <= to` und `endDate >= from`, sowie alle Serien, die im Zeitraum mindestens ein Vorkommen haben; die Serien werden unverändert geliefert und im Browser aufgefächert), `GET /events?seriesId=` (Serie und alle mit ihr verknüpften Einzeltermine), `POST /events` (mit `calendarId` im Body), `PUT /events/:id` (ändert den Kalender nicht) und `DELETE /events/:id`. **Es ist bisher nur gegen einen einfachen Test-Server geprüft (Laden, Anlegen, Timeout), noch nicht gegen ein echtes Backend.** Eigene Farben werden auch im Remote-Modus vorerst lokal gespeichert.

---

## Projektstruktur

```
database/
├─ README.md                   Datenbankschema: Tabellen, Automatik, Diagramm, Abfragen
├─ create_database.sql         Datenbank `kalender` anlegen
└─ migrations/
   ├─ 001_initial_schema.sql   Alle Tabellen und der Rollenkatalog (MySQL 8 / MariaDB)
   ├─ 001_initial_schema.down.sql
   ├─ 002_automation.sql       Trigger und Sichten user_calendars, user_team_permissions
   └─ 002_automation.down.sql
src/
├─ App.tsx                     AuthProvider + StorageProvider (je nach Sitzung) + PreferencesProvider + CalendarsProvider + Router
├─ router.tsx                  Routen: /, /settings, /calendars/new, /login, /register, /forgot-password, /reset-password, /verify-email
├─ pages/
│  ├─ CalendarPage.tsx         Kalender mit Startansicht, Kontomenü (Zahnrad nur ohne Anmeldefunktion), Bestätigungsleiste und Übernahme-Abfrage
│  └─ SettingsPage.tsx         Einstellungen in Tabs: Kalender, Darstellung, Konto
├─ main.tsx                    Einstiegspunkt
├─ env.d.ts                    Typen der Umgebungsvariablen
├─ config/
│  ├─ parseEnv.ts              Umgebungsvariablen lesen und prüfen (auch in vite.config.ts)
│  ├─ env.ts                   Geprüfte Konfiguration für die App
│  ├─ api.ts                   Fertig konfigurierter API-Client
│  ├─ auth.ts                  AuthRepository für die App
│  ├─ calendars.ts             ID des persönlichen Kalenders
│  ├─ routes.ts                Pfade, Token-Parameter und sichere Weiterleitung nach dem Login
│  └─ storage.ts               StorageConfig je nach Konfiguration und Anmeldung
├─ assets/
│  ├─ css/                     Styles, gebündelt über index.css (je Bereich eine Datei, z. B. calendars.css)
│  └─ imgs/
├─ components/                 Featureübergreifende Bausteine
│  ├─ Button.tsx               Button und ButtonLink mit Varianten (primary, secondary, outline, danger, success),
│  │                           volle Breite und Ladezustand (pendingLabel)
│  ├─ Form.tsx                 Formular mit einheitlichem Aufbau (noValidate, formSection)
│  ├─ Modal.tsx                Fenster (<dialog>), per Portal direkt in <body>
│  ├─ FormField.tsx            Beschriftung + Feld + Fehlermeldung (label oder fieldset)
│  ├─ SelectField.tsx          Auswahlfeld aus Optionsliste
│  ├─ NumberField.tsx          Ganzzahl mit Einheit
│  ├─ DateTimeField.tsx        Datum + Uhrzeit in einer Zeile
│  ├─ ChoiceChip.tsx           Runder Auswahl-Chip (Radio oder Checkbox)
│  ├─ IconButton.tsx           Symbol-Schaltfläche
│  ├─ SegmentedControl.tsx     Umschalter mit mehreren Optionen
│  ├─ SegmentedField.tsx       Umschalter mit Beschriftung als Formularfeld
│  ├─ Tabs.tsx                 Tabs mit Inhalt (role=tablist/tabpanel, Pfeiltasten)
│  ├─ Switch.tsx               Ein/Aus-Schalter (Checkbox mit role=switch)
│  ├─ Stepper.tsx              Fortschritt in Schritten, erledigte Schritte anklickbar
│  ├─ TextField.tsx            Textfeld mit Beschriftung und Fehler
│  ├─ PasswordField.tsx        Passwortfeld mit „Anzeigen“
│  ├─ StatusMessage.tsx        Fehler- (role="alert") und Erfolgsmeldung (role="status"), ActionFeedback für beides
│  ├─ PageLayout.tsx           Eigene Seite mit „Zum Kalender“ und Titel, als Karte (Anmeldung) oder volle Breite (Einstellungen)
│  ├─ PageSection.tsx          Abschnitt mit Überschrift und Erklärung links, Inhalt rechts, optional als Gefahrenbereich
│  └─ Icons.tsx                SVG-Symbole
├─ hooks/                      Featureübergreifende Hooks
│  ├─ useArrowKeyNavigation.ts Pfeiltasten links/rechts
│  ├─ useAsyncAction.ts        Asynchrone Aktion mit Ladezustand, Erfolg und Fehlermeldung
│  ├─ useAsyncResource.ts      Daten laden, neu laden, Abbruch bei Wechsel, apply() übernimmt das Ergebnis einer Änderung
│  ├─ useForm.ts               Ganzes Formular: Werte, Prüfung, Vorbereiten, Absenden mit Lade-, Erfolgs- und Fehlerzustand
│  ├─ useFormState.ts          Formularwerte, Fehler je Feld, Prüfung beim Absenden, Zurücksetzen
│  └─ useRequiredContext.ts    Context lesen und Fehler werfen, wenn der Provider fehlt
├─ utils/
│  ├─ api.ts                   API-Client (fetch mit JSON, Query, Token, Timeout, Abbruch)
│  ├─ apiError.ts              ApiError mit deutschen Fehlermeldungen
│  ├─ calendarView.ts          Ansichten Tag, Woche, Monat, Jahr
│  ├─ classNames.ts            CSS-Klassen zusammensetzen
│  ├─ dom.ts                   Klick-Handler ohne Weitergabe an Elternelemente
│  ├─ color.ts                 Hex-Farben, lesbare Schriftfarbe
│  ├─ date.ts                  Datums- und Zeitfunktionen, Prüfung und Formatierung
│  ├─ error.ts                 Fehlermeldungen
│  ├─ event.ts                 Termin-Typen, Farben (Klasse/Style samt weiterer Klassen), Validierung, Vorkommen eines Termins
│  ├─ number.ts                Ganzzahl-Prüfung mit Bereich
│  ├─ object.ts                Felder übernehmen, Wert aus fester Liste prüfen (isOneOf)
│  ├─ preferences.ts           Einstellungen: Typen, Standardwerte, Prüfung, Startansicht
│  ├─ recurrence.ts            Wiederholungsregeln, Berechnung der Vorkommen
│  ├─ series.ts                Serien ausnehmen, aufteilen, ändern
│  └─ validation.ts            Fehler je Feld, gemeinsame Prüfung „gibt es Fehler?“, E-Mail prüfen
└─ features/
   ├─ calendar/                Anzeige: Tag, Woche, Monat, Jahr
   │  │                        constants/views.ts beschreibt jede Ansicht einmal (Zeitraum, Schritt, Titel),
   │  │                        hooks/useCalendarView.ts steuert Ansicht und Datum
   │  ├─ components/
   │  ├─ constants/
   │  ├─ hooks/
   │  ├─ types/
   │  └─ utils/                Aufteilung mehrtägiger Termine, sichtbare Höhe, überlappende Termine,
   │                           gemeinsame Attribute von Terminblock und Termin-Chip
   │                           (components/MiniMonth: kleiner Monat für Jahresansicht und Kalender-Vorschau)
   ├─ events/                  Termine anlegen, bearbeiten, löschen
   │  ├─ components/           EventModal, DeleteEventModal, ColorPicker, RecurrenceFields, RecurrenceScopeModal, ScopeButtons, CustomColorSettings
   │  ├─ constants/            Farben, Bezeichnungen der Bearbeitungsbereiche
   │  ├─ hooks/                useEvents, useCustomColors
   │  ├─ types/
   │  └─ utils/                Serien-Aktionen gegen das Repository, Auswahl der Bereiche
   ├─ storage/                 Datenspeicherung
   │  ├─ components/           LocalImportPrompt: lokale Termine ins Konto übernehmen
   │  ├─ context/              StorageContext, StorageProvider (inkl. version/invalidate zum Neuladen)
   │  ├─ hooks/                useStorage, useEventRepository, useColorRepository, usePreferencesRepository
   │  ├─ repositories/         Local- und Remote-Umsetzungen, LocalPreferencesRepository
   │  ├─ types/
   │  └─ utils/                LocalStorageValue/LocalStorageList (localStorage lesen/schreiben), copyEvents (Termine samt Serien-Verknüpfung kopieren)
   ├─ calendars/               Kalenderauswahl (persönlich und Teams), vorbereitet für den Team-Modus
   │  ├─ components/           CalendarSwitcher (Button und Fenster), ActiveCalendarIndicator (Plakette im Kopf),
   │  │                        CalendarPreview (Monatsvorschau),
   │  │                        CalendarSettings (Liste in den Einstellungen, Verlassen)
   │  │  └─ create/            CreateCalendarPage mit den Schritten Details, Farbe, Mitglieder, Überprüfen
   │  ├─ constants/            Persönlicher Kalender, Bezeichnungen der Rollen
   │  ├─ context/              CalendarsProvider (verfügbare Kalender, aktiver Kalender, verlassen), liegt in App.tsx
   │  ├─ hooks/                useCalendars
   │  ├─ types/
   │  └─ utils/                Regeln: persönlich oder Team (`kind`), wer verlassen darf, welche Kalender gerade sichtbar sind
   │                           (`visibleCalendarIds`: im persönlichen Kalender dieser plus alle Teams mit showInPersonal)
   ├─ preferences/             Einstellungen (Farbschema, Startansicht)
   │  ├─ components/           PreferencesSettings
   │  ├─ context/              PreferencesProvider (lädt, speichert, setzt data-theme)
   │  └─ hooks/                usePreferences
   ├─ authorization/           Anmeldung, Registrierung, Abmeldung, Konto, Passwort, E-Mail
   │  ├─ components/           LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage,
   │  │                        AccountMenu, AuthGate, AuthFields, ContinueLink, ResendVerificationButton,
   │  │                        EmailVerificationBanner
   │  │  └─ account/           AccountSettings mit Profil, E-Mail, Passwort, Konto löschen
   │  ├─ context/              AuthContext, AuthProvider (Sitzung und alle Konto-Aktionen)
   │  ├─ hooks/                useAuth
   │  ├─ repositories/         RemoteAuthRepository (/auth-Endpunkte)
   │  ├─ types/
   │  └─ utils/                Prüfung der Formulare
   └─ teams/                   noch leer
```

### Regeln

- Jedes Feature ist nach `components`, `hooks`, `types`, `utils`, `constants` usw. aufgeteilt.
- Von außen wird ein Feature nur über seine `index.ts` importiert.
- `calendar` zeigt nur an und kennt die Speicherung nicht. `events` enthält die Termin-Logik, `storage` die Persistenz.
- Typen, die zwischen Features geteilt werden, liegen in `utils/`. Props-Typen bleiben bei ihrer Komponente.
- Schaltflächen immer über `Button`/`ButtonLink`, Formulare über `useForm` + `Form`, Meldungen über `ActionFeedback`. Keine eigenen `button`-Klassen oder Lade-Texte von Hand.
- Context-Hooks nutzen `useRequiredContext`.
- Keine Doppelungen: Was an mehr als einer Stelle gebraucht wird, liegt einmal in `components/`, `hooks/` oder `utils/` (featureübergreifend) bzw. im `utils/`-Ordner des Features. Formularfelder werden aus `FormField` und den darauf aufbauenden Feldern zusammengesetzt, Datumswerte nur über `utils/date.ts` geprüft und berechnet, Backend-Aufrufe nur über den API-Client aus `utils/api.ts`.
- Farben für Hell- und Dunkelmodus stehen nur einmal in `variables.css` und nutzen `light-dark()`. Terminfarben werden ausschließlich über `--event-color` und `--event-text` gesetzt, egal ob Standard- oder eigene Farbe.

---

## Bekannte Einschränkungen

- Nur localStorage, keine Synchronisierung zwischen Geräten oder Browsern
- Keine Ganztagstermine und keine eigene Leiste für mehrtägige Termine oberhalb des Rasters
- Serien-Aktionen bestehen aus mehreren einzelnen Speichervorgängen. Bricht einer davon ab, kann eine Serie teilweise geändert sein.
- Eigene Farben lassen sich noch nicht wieder entfernen
- Datums- und Zeitfelder zeigen das Format der Browser- bzw. Systemsprache

## Nächste Schritte

- [x] Anmeldung, Registrierung und Abmeldung im Frontend (`features/authorization`)
- [x] Passwort vergessen / zurücksetzen, E-Mail-Bestätigung (Frontend)
- [x] Einstellungsseite mit Konto: Name, Passwort ändern, Konto löschen (Frontend)
- [x] `.env`-Konfiguration für API-Anbindung, Dev-Proxy und Feature-Schalter
- [x] Datenbankschema für das Backend (`database/`)
- [ ] Backend mit der oben beschriebenen REST-API inkl. `/auth`
- [ ] Server-Speicherung über `RemoteEventRepository` aktivieren
- [ ] `RemoteColorRepository`, damit eigene Farben im Remote-Modus mitwandern
- [ ] Team-Modus mit Einladung per E-Mail (`features/teams`)
- [x] Eigene Farben entfernen
- [x] Schalter für Hell- und Dunkelmodus in der Oberfläche
- [x] Handy startet in der Tagesansicht, Startansicht einstellbar
- [ ] Einstellungen und eigene Farben im Remote-Modus übers Backend speichern (`user_preferences`, `user_colors`)
