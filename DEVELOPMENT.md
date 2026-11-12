# Kalender – Entwicklung

Einbettbarer Kalender (`@rokoyfa/calendar`), gebaut mit React, TypeScript und Vite. Diese Datei beschreibt Aufbau, Konfiguration und Verhalten im Detail. Die öffentliche Dokumentation für Nutzer des Pakets steht auf Englisch in der [README.md](README.md), Änderungen je Version im [CHANGELOG.md](CHANGELOG.md).

- **Ohne Anmeldung:** Termine werden im Browser gespeichert (localStorage).
- **Mit Anmeldung:** Termine, Einstellungen und Farben liegen auf einem Server, der [`api/openapi.yaml`](api/openapi.yaml) umsetzt.
- **Team-Modus:** gemeinsame Kalender mit Rollen und Einladungen per E-Mail.
- **Einbettung:** als React-Komponente oder als `<calendar-widget>` per Script-Tag, auch mit Tenants und Anmeldung über den Gastgeber.

Das Test-Backend (`TestBE`) dient der Entwicklung. Das produktive Backend ist nicht Teil dieses Projekts.

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
| `npm run build:lib` | Bibliothek bauen: npm-Paket nach `dist-lib/npm/`, Script-Datei nach `dist-lib/cdn/` |
| `npm run typecheck` | Nur Typprüfung |
| `npm publish` | Veröffentlichen, prüft vorher Lint und Typen und baut die Bibliothek (siehe [Veröffentlichen](#veröffentlichen)) |

**Technik:** React 19, React Router 8, TypeScript 6, Vite 8, ESLint. Voraussetzung ist **Node.js 22.22 oder neuer** (verlangt von React Router 8).

## Einbetten

> Die öffentliche Dokumentation auf Englisch steht in der [README.md](README.md). Diese Datei beschreibt die Entwicklung im Detail.

Der Kalender ist eine einbettbare Komponente. Diese Website ist selbst nur ein Gastgeber: `src/main.tsx` rendert `<Calendar routing="browser" />` mit den Werten aus der `.env`. Eine Demo-Gastgeberseite mit zwei Widgets und absichtlich störendem CSS liegt unter `/demo/embed.html` (im Dev-Server erreichbar).

**React-Projekte (npm-Paket):**

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar storageMode="remote" apiBaseUrl="https://api.example.com" features={{ auth: true }} style={{ height: 700 }} />
```

**Alle anderen Seiten (Script-Tag):**

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@1/dist-lib/cdn/calendar-widget.js"></script>
<calendar-widget storage-mode="remote" api-base-url="https://api.example.com" auth style="height: 700px"></calendar-widget>
```

| Prop | Attribut | Standard | Bedeutung |
| --- | --- | --- | --- |
| `dataSource` | – | – | Eigener Daten-Adapter, siehe [Daten-Adapter](#daten-adapter). Ohne ihn wählen `storageMode`, `apiBaseUrl` und `features.auth` einen der eingebauten. |
| `tenant` | `tenant` | – | Öffentliche Tenant-ID für ein Backend mit mehreren Gastgebern, siehe [Tenants](#tenants-und-anmeldung-über-den-gastgeber) |
| `getUserToken` | Eigenschaft `getUserToken` | – | Anmeldung über den Gastgeber statt eigener Konten |
| `storageMode` | `storage-mode` | `local` | `local` (Browser) oder `remote` (API). Mit Anmeldung entscheidet die Sitzung. |
| `apiBaseUrl` | `api-base-url` | `/api` | Adresse der REST-API |
| `apiTimeoutMs` | `api-timeout-ms` | `10000` | Zeitlimit je Anfrage |
| `features` | `auth`, `teams` | `auth` aus, `teams` an | Anmeldung und Team-Funktionen. Attribut ohne Wert schaltet an, `="false"` aus. Ohne Teams fehlen Kalender wechseln, Einladungen und Kalender erstellen. |
| `routing` | – | `memory` | `memory`: Ansichten nur intern, die Adresse der Gastgeberseite bleibt unverändert. `browser`: eigene Adressen wie diese Website. |
| `basename` | – | – | Pfad-Präfix bei `routing="browser"` |
| `initialPath` | `initial-path` | `/` | Startansicht bei `memory`, z. B. `/settings` oder `/reset-password?token=…` |
| `linkParam` | `link-param` | `calendarPath` | Name des URL-Parameters, aus dem das Widget bei `memory` seine Startansicht liest, z. B. `?calendarPath=/reset-password?token=…` aus E-Mail-Links. `false` schaltet das ab. |
| `theme` | `theme` | – | `light` oder `dark` als Vorgabe des Gastgebers. Gilt, solange der Nutzer „Automatisch“ eingestellt hat. |
| `initialView` | `initial-view` | Einstellung | Startansicht (`day`, `week`, `month`, `year`), hat Vorrang vor der Einstellung des Nutzers |
| `onEventCreate`, `onEventUpdate`, `onEventDelete` | Ereignisse `event-create`, `event-update`, `event-delete` | – | Nach jeder gespeicherten Änderung, mit dem Termin bzw. `{ id }`. Serien-Änderungen können mehrere auslösen. |
| `locale` | `locale` | Browser | Sprache und Region, z. B. `en-US`, `en-GB`, `de-DE`. Siehe [Sprache und Region](#sprache-und-region). |
| `className`, `style` | `class`, `style` | – | Größe und Platz auf der Gastgeberseite |

### Daten-Adapter

Woher die Daten kommen, entscheidet ein `CalendarDataSource`. Die Komponente ist immer dieselbe, nur der Adapter wechselt.

```tsx
import { Calendar, localDataSource, restDataSource } from 'calendar'

<Calendar dataSource={localDataSource()} />
<Calendar dataSource={restDataSource({ baseUrl: 'https://api.example.com' })} />
<Calendar dataSource={restDataSource({ baseUrl: '/api', auth: false, getAccessToken: () => myToken })} />
```

| Adapter | Verhalten |
| --- | --- |
| `localDataSource()` | Alles im Browser (localStorage), ohne Anmeldung |
| `restDataSource({ baseUrl, timeoutMs?, auth?, headers?, getAccessToken? })` | Spricht die [REST-API](api/openapi.yaml). Mit `auth: true` (Standard) gibt es Anmeldung im Widget. Gäste arbeiten dann im Browser, Angemeldete auf dem Server. Mit `auth: false` immer Server, z. B. wenn der Gastgeber selbst anmeldet und per `getAccessToken` ein Token mitgibt. |

**Eigener Adapter:** Wer eine ganz andere Datenquelle hat, setzt die Schnittstellen selbst um. Alle Typen werden exportiert.

```ts
import type { CalendarDataSource } from 'calendar'

const myDataSource: CalendarDataSource = {
  createAuthRepository: ({ getLanguage }) => myAuth,
  connect: ({ isAuthenticated }, { getLanguage, onUnauthorized }) => ({
    mode: 'remote',
    events: myEvents,
    calendars: myCalendars,
    colors: myColors,
    preferences: myPreferences,
  }),
}
```

- `connect` liefert die Repositories für den aktuellen Zustand und wird bei An- und Abmeldung neu aufgerufen.
- `createAuthRepository` ist optional. Ohne gibt es keine Anmeldung im Widget.
- `mode: 'remote'` zeigt nach der Anmeldung die Abfrage, lokale Termine ins Konto zu übernehmen.
- Fehler mit einem der bekannten Codes (`AppError`, `ApiError` mit `code`) zeigt die Komponente übersetzt an, andere mit ihrer `message`.

Getestet in einem frischen React-Projekt mit strenger Typprüfung: ein Adapter, der Kalender und Einstellungen von `localDataSource()` übernimmt und Termine nur im Speicher hält.

### Tenants und Anmeldung über den Gastgeber

Mit `tenant` spricht das Widget ein Backend an, das mehrere Gastgeber bedient. Jede Anfrage trägt dann den Header `X-Calendar-Tenant`.

```html
<script type="module" src="https://…/calendar-widget.js"></script>
<calendar-widget tenant="acme" api-base-url="https://api.example.com" style="height: 700px"></calendar-widget>
```

**a) Eigene Konten:** ohne weitere Angaben. Registrierung und Anmeldung laufen im Widget wie bisher.

**b) Anmeldung über den Gastgeber:** Der Gastgeber gibt eine Funktion `getUserToken` mit, die ein kurzlebiges, von seinem Server signiertes Token liefert (oder `null`, wenn auf seiner Seite niemand angemeldet ist).

```tsx
<Calendar tenant="acme" apiBaseUrl="https://api.example.com" getUserToken={() => fetch('/calendar-token').then((r) => r.text())} />
```

```js
document.querySelector('calendar-widget').getUserToken = async () => (await fetch('/calendar-token')).text()
```

- Das Widget fragt erst `GET /auth/me`. Bei `401` holt es ein Token und tauscht es an `POST /auth/token` gegen eine Sitzung. Läuft die Sitzung später ab, passiert das automatisch noch einmal.
- In diesem Modus gibt es keine Anmelde-, Registrierungs- und Passwort-Seiten, keinen Abmelden-Button, keinen Konto-Tab und keine Bestätigungsleiste. Das Konto gehört dem Gastgeber.
- Liefert `getUserToken` `null`, arbeitet das Widget wie für Gäste im Browser. Statt des Kontomenüs gibt es dann das Zahnrad für die Einstellungen.
- Die Eigenschaft kann vor oder nach dem Laden der Script-Datei gesetzt werden.
- Als Daten-Adapter: `tenantDataSource({ tenant, baseUrl, getUserToken })`.

Was das Backend dafür tun muss (Tenant prüfen, erlaubte Domains, Token prüfen, Nutzer anlegen), steht in [`api/openapi.yaml`](api/openapi.yaml). Getestet gegen ein simuliertes Backend: Tenant-Header bei allen Aufrufen, Anmeldung per Token, Gastmodus ohne Token und erneute Anmeldung nach abgelaufener Sitzung.

### REST-API (OpenAPI)

Der Vertrag zwischen `restDataSource` und einem Backend liegt als **OpenAPI 3.1** in [`api/openapi.yaml`](api/openapi.yaml): alle Endpunkte mit Anfragen, Antworten, Fehlercodes und Rechten. Das Test-Backend ist die Referenz-Umsetzung. Geprüft wurde, dass das Test-Backend alle beschriebenen Endpunkte außer `POST /auth/token` (Tenants) hat und dass seine Antworten in einem Durchlauf über alle 40 Endpunkte (65 Aufrufe, auch Fehlerfälle) den Schemas entsprechen.

Die Datei lässt sich z. B. mit Swagger UI oder Redocly ansehen und mit Generatoren für Server-Gerüste in anderen Sprachen nutzen.

**Was die Einbettung absichert:**

- **Shadow DOM:** Die Komponente rendert in einen eigenen Shadow Root (`IsolatedRoot`). Stile des Gastgebers wirken nicht hinein, unsere nicht heraus. Die Stile werden als Text gebündelt (`index.css?inline`), es gibt keine separate CSS-Datei.
- **Größe:** Das Widget füllt die Höhe, die der Gastgeber ihm gibt, und scrollt darin. Ohne feste Höhe wächst es mit dem Inhalt.
- **Breakpoints über die Breite des Widgets** (Container Queries) statt über die Fenster­breite. Ein schmales Widget auf einem breiten Bildschirm zeigt die Handy-Darstellung.
- **Alles an die Wurzel gebunden statt an Seite oder Fenster:** Farbschema (`data-theme`), Modals, Kontomenü-Position, Pfeiltasten (nur wenn der Fokus im Widget liegt) und das Aufziehen von Zeiträumen. Die Wurzel kommt aus `RootElementContext`.
- **Mehrere Widgets auf einer Seite** sind unabhängig: eigene Ansicht, eigener Router, eigene Modals.

**Build:** `npm run build:lib` erzeugt zwei Pakete aus derselben Codebasis:

- `dist-lib/npm/`: ES-Modul mit Typdefinitionen. React und React DOM bringt der Gastgeber mit (`peerDependencies`, ab React 19.0), React Router ist eingebaut.
- `dist-lib/cdn/calendar-widget.js`: eine minifizierte Datei mit React, die `<calendar-widget>` selbst registriert (ca. 140 kB gzip).

Getestet mit einer statischen HTML-Seite (nur die Script-Datei) und einem frischen React-19.2-Projekt, das das gepackte npm-Paket installiert, mit strenger Typprüfung.

**Noch offen:** Mehrere Widgets mit `storage-mode="local"` auf derselben Seite teilen sich den Browser-Speicher. E-Mail-Links (Passwort zurücksetzen, E-Mail bestätigen) zeigen auf die Adresse aus der Backend-Konfiguration; bei `routing="memory"` muss der Gastgeber sie per `initialPath` weiterreichen.

### Sprache und Region

Standardsprache ist **Englisch**. Mitgeliefert werden außerdem **Deutsch, Französisch, Spanisch, Italienisch, Niederländisch, Polnisch und Portugiesisch** (brasilianische Schreibweise). Weitere Sprachen oder eigene Begriffe gibt der Gastgeber über `messages` mit (siehe unten). Welche Sprache gilt, entscheidet in dieser Reihenfolge:

1. **Einstellung des Nutzers** unter Einstellungen → Darstellung → Sprache und Region (`Automatisch` und jede mitgelieferte Sprache mit Region, Namen jeweils in der eigenen Sprache über `Intl.DisplayNames`, dazu Sprachen aus `messages`). Gespeichert in den Einstellungen (`locale`, Standard `auto`).
2. **Prop `locale` bzw. Attribut `locale`** des Gastgebers
3. **Browser** (`navigator.languages`)
4. Sonst `en-US`

Eine Sprache, die es nicht gibt, fällt auf Englisch **mit der Region des Nutzers** zurück: `sv-SE` wird `en-SE`, also englische Texte mit Montag als Wochenbeginn und 24-Stunden-Uhr.

**Formate kommen aus der Region, nicht aus der Sprache** (über `Intl`):

| | `en-US` | `en-GB` | `de-DE` |
| --- | --- | --- | --- |
| Erster Wochentag | Sonntag | Montag | Montag |
| Uhrzeit | `1:00 PM` | `13:00` | `13:00` |
| Kurze Stunde (Handy) | `1p` | `13` | `13` |
| Datum | `11/05/26` | `05/11/26` | `05.11.26` |
| Wochennummer | `Wk 45` | `Wk 45` | `KW 45` |
| Zählweise der Wochen | erste Woche enthält den 1. Januar | ISO 8601 | ISO 8601 |

Wochenbeginn und Zählweise liefert `Intl.Locale#getWeekInfo`, wo es fehlt, eine Liste der Länder mit Sonntag als Wochenbeginn. Die Wochenansicht, das Monatsraster, die Mini-Monate und die Wochentage bei wiederkehrenden Terminen folgen dem Wochenbeginn. Gespeichert wird weiter unabhängig davon (Wochentage als 0 = Montag … 6 = Sonntag).

**Aufbau (`src/i18n/`):**

- `messages/en/*.ts` sind die Quelle der Texte, je Bereich eine Datei (`core`, `calendar`, `events`, `calendars`, `auth`, `settings`, `storage`). Der Typ `Messages` wird aus Englisch abgeleitet. Jede andere Sprache (`messages/de/*.ts`, `messages/fr/index.ts` usw.) muss genau dieselben Schlüssel haben, sonst schlägt die Typprüfung fehl. Ein Test vergleicht zusätzlich den Aufbau aller Sprachen mit Englisch.
- Englisch ist fest im Paket, alle anderen Sprachen werden erst bei Bedarf nachgeladen (`loadMessages` in `messages/index.ts`, je Sprache eine eigene Datei von etwa 7 KB gzip, auch im CDN-Build). Bis die Sprache da ist, zeigt das Widget nichts, beim Wechsel in den Einstellungen bleibt bis dahin die alte Sprache stehen.
- **Neue Sprache einbauen:** Ordner `messages/<code>/` mit `index.ts` anlegen (am einfachsten eine bestehende Sprache kopieren), in `BUILT_IN_LANGUAGES` und `BUILT_IN_LOCALES` (`locale.ts`) sowie in den Ladern in `messages/index.ts` eintragen. Grammatik wie Mehrzahl oder Geschlecht steckt in den Funktionen der jeweiligen Sprache (Beispiel Polnisch: `plural`).
- **`messages` des Gastgebers** (Prop bzw. Property am Web Component): `{ [Sprachcode]: Teil-Texte }`. Für eine mitgelieferte Sprache werden einzelne Texte überschrieben, eine neue Sprache (z. B. `sv`) baut auf Englisch auf und ist danach wählbar. Zusammengeführt wird tief (`mergeMessages`), fehlende Texte kommen aus der Basis.
- Texte mit Werten sind Funktionen, z. B. `views.weekNumber(45)` → `Wk 45` bzw. `KW 45`. Abkürzungen und Mehrzahl stehen so je Sprache an einer Stelle.
- `useI18n()` liefert `m` (Texte), `format` (Datum, Uhrzeit, Wochentage, Listen), `weekInfo` und `locale`.
- Fehler tragen einen **Code** statt eines Textes (`AppError`, `ApiError.code`) und werden erst beim Anzeigen übersetzt (`getErrorMessage(error, m)`). Meldungen, die der Server ohne bekannten Code schickt, werden unverändert angezeigt.
- Prüfungen (`validateEventInput`, `validateEmail`, Formular-Validierung) bekommen `m` übergeben.

---

## Veröffentlichen

Das Paket heißt **`@rokoyfa/calendar`** und erscheint öffentlich auf npm unter MIT-Lizenz. Über npm ist die Script-Datei automatisch auch per CDN erreichbar.

**Einmalig:** ein npm-Konto mit dem Namen `rokoyfa` anlegen (oder eine Organisation `rokoyfa`, dann darf der Scope mehreren gehören) und auf dem Rechner `npm login` ausführen.

**Vor dem Veröffentlichen lokal testen:**

```bash
npm run build:lib
npm pack                       # erzeugt rokoyfa-calendar-1.0.0.tgz
```

- In einem anderen Projekt: `npm install ../Calendar/rokoyfa-calendar-1.0.0.tgz`, dann `import { Calendar } from '@rokoyfa/calendar'`.
- Ohne npm: `demo/local.html` über einen beliebigen statischen Server öffnen (z. B. `npx serve .` im Projektordner), sie lädt `dist-lib/cdn/calendar-widget.js`.

**Veröffentlichen:**

1. Version mit `npm version patch|minor|major --no-git-tag-version` erhöhen und `CHANGELOG.md` ergänzen. Ab 1.0 gilt SemVer streng: `1.0.1` für Korrekturen, `1.1.0` für Neues, das bestehende Einbindungen nicht bricht, `2.0.0` für alles, was Props, Attribute, DOM-Events, exportierte Typen, den Daten-Adapter oder den REST-Vertrag inkompatibel ändert.
2. `npm publish`. Vorher laufen automatisch Lint, Typprüfung, Tests und `build:lib`. `publishConfig.access` ist `public`, nötig für gescopete Pakete.
3. Commit taggen, z. B. `git tag v1.0.0 && git push --tags`.

**Danach erreichbar** (CDN nach wenigen Minuten):

| Weg | Adresse |
| --- | --- |
| npm | `npm install @rokoyfa/calendar` |
| jsDelivr | `https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@1/dist-lib/cdn/calendar-widget.js` |
| unpkg | `https://unpkg.com/@rokoyfa/calendar@1/dist-lib/cdn/calendar-widget.js` |

`demo/cdn.html` bindet die veröffentlichte Version über jsDelivr ein und zeigt alle Einbindungsarten (lokal, mit Backend, Ereignisse, Theme). `@1` holt immer die neueste `1.x`, für feste Stände die volle Version angeben (z. B. `@1.0.0`).

**Im Paket** stehen nur `dist-lib/` (npm-Build mit Typen, CDN-Script, Source-Maps), `api/openapi.yaml`, `CHANGELOG.md`, `README.md`, `LICENSE` und `package.json`. Die Version steht zur Laufzeit in `VERSION` (Export) bzw. `customElements.get('calendar-widget').version`.

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
| `VITE_FEATURE_TEAMS`  | `true`                  | Team-Funktionen (Kalender wechseln, erstellen, einladen) |
| `API_PROXY_TARGET`    | `http://localhost:3000` | Nur Entwicklung: Backend, an das `npm run dev` und `npm run preview` alle Aufrufe unter `VITE_API_BASE_URL` weiterleiten. Greift nur bei relativer API-Adresse. |

### Wichtig

- **Alles mit `VITE_` landet im ausgelieferten JavaScript und ist für jeden lesbar.** Dort niemals Geheimnisse wie API-Schlüssel, Passwörter oder Tokens eintragen. Geheimnisse gehören ausschließlich ins Backend.
- `API_PROXY_TARGET` hat kein `VITE_` und wird nur vom Vite-Server gelesen, nicht vom Browser.
- Werte werden beim Start von `npm run dev` bzw. `npm run build` geprüft. Ein ungültiger Wert, zum Beispiel `VITE_STORAGE_MODE=cloud`, bricht mit einer genauen Fehlermeldung ab. Nach einer Änderung an einer `.env`-Datei den Dev-Server neu starten.
- Variablen werden beim Build fest eingebaut. Für eine andere Umgebung muss neu gebaut werden.
- Die `.env` gilt nur für diese Website. Sie wird in `src/config/parseEnv.ts` gelesen und geprüft, `src/main.tsx` reicht die Werte als Props an `<Calendar>` weiter. Die Komponente selbst liest nie `import.meta.env`, sondern nur ihre Props. Neue Variablen dort und in `src/env.d.ts` ergänzen und in `.example.env` aufnehmen.

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

Instanzen entstehen je Widget aus den Props (Adresse und Timeout), nie als globale Instanz, weil mehrere Widgets auf einer Seite verschiedene APIs nutzen können:

```ts
import { createApiClient, encodePathSegment } from '../../../utils/api.ts'

const apiClient = createApiClient({ baseUrl: config.apiBaseUrl, timeoutMs: config.apiTimeoutMs })

const teams = await apiClient.get<Team[]>('/teams', { query: { page: 1, tags: ['a', 'b'] } })
const team = await apiClient.post<Team>('/teams', { name: 'Familie' })
await apiClient.put<Team>(`/teams/${encodePathSegment(id)}`, changes)
await apiClient.patch<Team>(`/teams/${encodePathSegment(id)}`, { name: 'Neu' })
await apiClient.delete(`/teams/${encodePathSegment(id)}`)
```

Weitere Optionen: `createApiClient({ baseUrl, timeoutMs, getAccessToken, onUnauthorized, headers, credentials })`, so macht es auch `RemoteEventRepository`.

### Was der Client übernimmt

- **JSON:** Objekte werden als JSON gesendet, Antworten mit JSON-Content-Type automatisch gelesen. `FormData`, `Blob`, `URLSearchParams` und Strings gehen unverändert raus, zum Beispiel für Datei-Uploads.
- **Query-Parameter:** `query: { a: 1, b: ['x', 'y'] }` wird zu `?a=1&b=x&b=y`, `null` und `undefined` werden weggelassen.
- **Leere Antworten:** `204 No Content` und leere Antworten ergeben `undefined`.
- **Token:** Liefert `getAccessToken` einen Wert, wird `Authorization: Bearer …` gesetzt. Vorbereitet für die Anmeldung.
- **Timeout:** Standard aus `VITE_API_TIMEOUT_MS`, pro Anfrage über `timeoutMs` änderbar.
- **Abbruch:** Ein eigenes `signal` (z. B. `AbortController`) wird zusammen mit dem Timeout berücksichtigt.
- **401:** Ruft `onUnauthorized` auf, gedacht zum Abmelden, wenn der Token abgelaufen ist.

### Fehler

Jeder Fehler ist ein `ApiError` (aus `src/utils/apiError.ts`). Angezeigt wird er über `getErrorMessage(error, m)` in der Sprache des Nutzers: bekannte Fälle über `code` (z. B. `invalidCredentials`, `emailTaken`), sonst die `message` des Servers, sonst eine Standardmeldung je Status oder Art.

| `kind`    | `status` | Meldung |
| --------- | -------- | ------- |
| `http`    | 4xx/5xx  | `message` aus der Server-Antwort, sonst eine Standardmeldung je Status, z. B. 401 „Please sign in.“ / „Bitte melde dich an.“ |
| `timeout` | `null`   | Zeitlimit überschritten |
| `network` | `null`   | Server nicht erreichbar |
| `aborted` | `null`   | Anfrage abgebrochen |
| `parse`   | `null`   | Antwort nicht lesbar |

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
- **Kalender wechseln** öffnet ein großes Fenster mit dem persönlichen Kalender und den Team-Kalendern als Kacheln: oben eine Vorschau des aktuellen Monats in der Kalenderfarbe, darunter Name, Team und die eigene Rolle. Der aktive Kalender ist blau umrandet mit Haken. Auf dem Handy zwei Kacheln nebeneinander. Gibt es offene Einladungen, steht darüber ein Hinweis mit Link zu den Einstellungen. Die Liste kommt aus `features/calendars` (`CalendarsProvider`, `useCalendars`), angemeldet von `GET /calendars`, ohne Anmeldung nur „Persönlich“.
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
| `PUT /calendars/:id/settings` | `{ showInPersonal }` | `200` mit `CalendarSummary` |
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

### Termin-Dialog

Der Dialog ist in Tabs aufgeteilt (`components/Tabs.tsx`), damit er kompakt bleibt:

- **Allgemein:** Titel, Ganztägig, Beginn, Ende, Zeitzone, Erinnerung, Farbe
- **Wiederholung:** Wiederholungsregel
- **Teilnehmer:** nur in Teamkalendern mit Mitgliedern, mit Anzahl im Tab
- **Details:** Ort, Webseite & Links, Beschreibung

Beim Speichern mit Fehlern springt der Dialog zum ersten Tab mit Fehlern, sofern der aktuelle keine hat. Tabs mit Fehlern tragen einen roten Punkt. Welches Feld zu welchem Tab gehört, steht in `TAB_FIELDS` in `EventModal.tsx`.

### Ort, Links, Erinnerungen, Teilnehmer

- **Links** (`links`, bis zu 10, je `url` bis 2000 und `label` bis 100 Zeichen): im Tab „Details“. Adressen ohne Schema bekommen `https://` vorangestellt, erlaubt sind nur `http` und `https` (`isWebUrl` in `utils/event.ts`). Gespeicherte oder importierte Links mit anderem Schema werden beim Einlesen verworfen, damit nie ein `javascript:`-Link angezeigt wird. Gültige Links lassen sich direkt aus dem Dialog in einem neuen Tab öffnen. Im Raster stehen sie mit Weltkugel unter dem Ort, sobald der Termin hoch genug ist (ab 2,5 Stunden ein Link, je weitere halbe Stunde einer mehr, was nicht passt als „+N“ hinter dem letzten). Ein Klick öffnet den Link in einem neuen Tab, nicht den Termin. Damit Links im Termin klickbar sein dürfen, ist der Block ein `div`, über dem ein unsichtbarer Button (`.eventOpen`) die ganze Fläche zum Öffnen abdeckt. Ziehen startet nicht auf einem Link. In der schmalen Wochenansicht am Handy sind die Links ausgeblendet, im Tooltip stehen sie immer. Im iCalendar wird der erste Link als `URL`, alle weiteren als `ATTACH` geschrieben, die Bezeichnung als Parameter `LABEL`.
- **Ort** (`location`, bis 200 Zeichen): im Tab „Details“. Im Raster ab 90 Minuten in eigener Zeile, darunter hinter dem Titel, in der Monatsansicht hinter dem Titel, im Tooltip und in der Suche.
- **Erinnerung** (`reminders`, Minuten vor Beginn, bis zu 5, im Dialog wird eine eingestellt): Auswahl von „Zum Beginn“ bis „1 Woche vorher“, Texte über `format.duration` (Intl, je Sprache richtig gebeugt). Erinnerungen sind persönlich: das Test-Backend speichert sie je Nutzer (`remindersByUser`) und liefert nur die eigenen. Solange das Widget offen ist, lädt `features/reminders/useReminders.ts` alle fünf Minuten die nächsten vier Wochen aller Kalender und plant die fälligen Erinnerungen. Gezeigt wird eine Browser-Benachrichtigung (Erlaubnis wird beim Wählen einer Erinnerung angefragt) oder sonst ein Hinweis unten rechts. Bereits gezeigte Erinnerungen merkt sich der Browser zwei Tage lang, damit mehrere Tabs nicht doppelt erinnern. E-Mails bei geschlossenem Kalender sind Sache des Backends.
- **Teilnehmer** (`attendees`, nur in Teamkalendern): im Dialog aus den Mitgliedern des Kalenders hinzufügen und entfernen, „Alle einladen“ fügt alle noch nicht eingeladenen Mitglieder auf einmal hinzu. Wer selbst Teilnehmer ist, antwortet mit Ja, Vielleicht oder Nein (`POST /events/:id/response`, sofort gespeichert, auch mit Leserechten). Unbeantwortete Termine sind schraffiert, abgesagte durchgestrichen.

### Suche

Die Lupe im Kopf öffnet die Suche über Titel, Ort, Beschreibung und Links der angezeigten Kalender (ab 2 Zeichen, 250 ms Verzögerung). Treffer stehen nach dem nächsten Vorkommen sortiert, vergangene danach. Ein Klick springt zum Datum und öffnet den Termin. Das Backend sucht über `GET /events/search`. Adapter ohne `search` werden über das letzte und nächste Jahr aus `GET /events` durchsucht (`features/calendar/utils/search.ts`).

### Import und Export (iCalendar)

In den Kalender-Einstellungen (Tab „Import & Export“, beim persönlichen Kalender als Abschnitt). Export lädt alle Termine des Kalenders als `.ics`, Import braucht das Recht zum Anlegen. `utils/ical.ts` schreibt und liest iCalendar: Ganztägig, Zeitzonen (`TZID`, UTC), Serien (`RRULE` mit FREQ, INTERVAL, BYDAY, UNTIL, COUNT), Ausnahmen (`EXDATE`, abgelöste Termine über `RECURRENCE-ID`), Ort, Beschreibung, Erinnerungen (`VALARM`) und Teilnehmer. Nicht unterstützte Regeln werden als einzelner Termin übernommen. Beim Import werden Termine mit bekannter `uid` aktualisiert (Farbe bleibt), neue angelegt, ungültige übersprungen (`features/events/utils/icalExchange.ts`).

### Zuletzt gewählter Kalender

Der aktive Kalender wird je Nutzer im Browser gespeichert (`calendar.activeCalendar.v1.<userId>`) und nach dem Neuladen wiederhergestellt. Bis die Kalender geladen sind, werden keine Termine des persönlichen Kalenders angezeigt. Gibt es den Kalender nicht mehr, gilt wieder der persönliche.

### Termine verschieben

- Termin **mindestens 1 Sekunde gedrückt halten** (Maus oder Finger), dann ziehen. Kürzeres Drücken oder Bewegen vorher verschiebt nichts, ein normaler Klick öffnet den Dialog.
- Tag- und Wochenansicht: in 15-Minuten-Schritten, auch auf andere Tage. Der untere Rand eines Termins ändert das Ende. Am Rand scrollt das Raster mit.
- Monatsansicht und Ganztags-Zeile: tageweise.
- Serien fragen nach dem Loslassen „nur dieser / dieser und folgende / alle“. Bei „folgende“ und „alle“ wandert der Wochentag wöchentlicher Serien mit.
- Escape bricht ab. Ohne Recht zum Anlegen ist Verschieben aus.
- Umsetzung: `features/calendar/hooks/useEventDrag.ts` (was gezogen wird), `utils/eventDrag.ts` (Rechnen, getestet). Gedrückt halten, Maus und Touch, Mitscrollen am Rand, Escape und das Unterdrücken des Klicks danach stecken in `hooks/usePressDrag.ts`, das auch das Aufziehen eines Zeitraums nutzt.

### Darstellung von Terminen

- Position und Höhe entsprechen exakt Uhrzeit und Dauer
- **Überlappende Termine** stehen nebeneinander und teilen sich die Spaltenbreite, zum Beispiel 2 Termine je 50 % und 3 Termine je 33 %. Die Tagesspalten behalten ihre Breite.
- Kurze Termine werden kompakter dargestellt, ab 90 Minuten wird zusätzlich die Uhrzeit angezeigt
- **Mehrtägige Termine** werden pro Tag als eigener Abschnitt im Raster gezeigt: am ersten Tag ab Beginn bis 24:00, dazwischen ganztägig, am letzten Tag ab 00:00 bis zum Ende. An den Übergängen sind die Ecken eckig, damit der Zusammenhang sichtbar bleibt. Die Zeitangabe enthält dann auch die Daten, zum Beispiel `30.10. 10:00 – 03.11. 16:00`.

### Zeitraum aufziehen

In der Tages- und Wochenansicht lässt sich ein Zeitraum direkt im Raster auswählen. Danach öffnet sich „Neuer Termin“ mit Startdatum, Beginn, Enddatum und Ende schon ausgefüllt.

- **Maus:** auf eine Stunde drücken und ziehen, auch über mehrere Tage und rückwärts. Ein einfacher Klick legt wie bisher eine Stunde an.
- **Handy:** kurz gedrückt halten (ca. 0,35 s, leichte Vibration, wo das Gerät es kann), dann mit dem Finger ziehen. Ein normales Wischen scrollt weiter, Antippen legt eine Stunde an.
- **Ganze Stunden, die Kachel unter Maus oder Finger zählt mit:** von der 12-Uhr-Kachel am 6.11. bis zur 18-Uhr-Kachel am 8.11. ergibt 6.11. 12:00 bis 8.11. 19:00. Wer bis 18:00 will, zieht bis zur 17-Uhr-Kachel.
- Während des Ziehens ist der Bereich blau hinterlegt, in der ersten Spalte steht der Zeitraum. Am oberen und unteren Rand scrollt das Raster mit.
- Ohne Recht zum Anlegen (Betrachter) ist die Auswahl aus.

Die Logik steckt in `useSlotSelection` und `utils/slotSelection.ts`, die Gesten selbst in `usePressDrag` (Maus über Pointer-Events sofort, Touch über Touch-Events nach langem Drücken, damit das Scrollen erst dann gesperrt wird). Den Termin baut `createEventInputForSlots` aus erster und letzter Stunde.

### Termine und Kalender

Jeder Termin gehört genau zu einem Kalender (`calendarId`). Geladen werden nur die Termine der sichtbaren Kalender (`visibleCalendarIds`):

- **Persönlicher Kalender offen:** die persönlichen Termine plus die Termine aller Team-Kalender, bei denen „Auch im persönlichen Kalender anzeigen“ an ist.
- **Team-Kalender offen:** nur die Termine dieses Team-Kalenders. **Persönliche Termine erscheinen nie in einem Team-Kalender.**

**Herkunft im persönlichen Kalender:** Termine aus Team-Kalendern tragen dort ein kleines Team-Symbol vor dem Titel (Woche, Tag und Monat). Ab zwei Stunden Länge steht der Name des Kalenders zusätzlich im Termin, darunter reicht der Platz nicht. Der Tooltip nennt immer „Aus dem Kalender „…““, und der Bearbeiten-Dialog zeigt oben: „Aus dem Kalender „…“. Änderungen sehen alle Mitglieder.“ Im Team-Kalender selbst entfällt das, dort zeigt die Plakette den Kalender. Umgesetzt über `eventSources`, eine Zuordnung Kalender-ID → Name und Farbe, die `CalendarPage` an `Calendar` gibt.

**Rechte:** Jeder Kalender bringt die Berechtigungen der eigenen Rolle mit (`permissions`, siehe `Permission` in `api/openapi.yaml`). Fehlt `create_entry` (Betrachter), verschwindet der Plus-Button und ein Klick ins Raster legt nichts an. Bearbeiten und Löschen prüft der Server; ohne Recht erscheint im Dialog „Dazu fehlt dir die Berechtigung.“

Neue Termine landen immer im gerade offenen Kalender. Beim Bearbeiten bleibt ein Termin in seinem Kalender, auch herausgelöste Termine und fortgesetzte Serien. Beim Abmelden oder Kontowechsel wird die Kalenderauswahl zurückgesetzt, damit nichts versehentlich in einen fremden Kalender geschrieben wird.

### Kalender-Einstellungen

Eigene Seite `/calendars/:calendarId/settings` je Kalender (nur angemeldet), erreichbar über das Zahnrad in Einstellungen › Kalender. Oben führt „Zu den Einstellungen“ zurück. Bei Team-Kalendern teilen Tabs die Seite in **Allgemein** (mit Anzeige), **Mitglieder**, **Einladungen** (nur mit `invite_members`) und **Gefahrenbereich**. Mitglieder und Einladungen zeigen die Anzahl im Tab. Der Tab steht wie in den Einstellungen in der Adresse (`?tab=members`), bleibt beim Neuladen erhalten und lässt sich verlinken; das übernimmt der gemeinsame Hook `useTabParam`. Jeder Bereich zeigt nur, was die eigene Rolle darf (`permissions` des Kalenders):

| Bereich | Inhalt | Ändern dürfen |
| ------- | ------ | ------------- |
| **Allgemein** | Name, Beschreibung (nur Team), Farbe mit Vorschau | Name und Farbe mit `manage_calendars`, Beschreibung mit `manage_team`. Ohne Recht sind die Felder gesperrt. Mit `manage_team` ändert der Name auch den Teamnamen. |
| **Anzeige** | „Termine auch im persönlichen Kalender anzeigen“ | jeder für sich |
| **Mitglieder** | Name, E-Mail, Rolle; Rolle wechseln und Entfernen mit Bestätigung | `manage_members`, nur bei Rollen unterhalb der eigenen. Owner dürfen alles, auch andere zu Owner machen. |
| **Einladungen** | einladen mit E-Mail und Rolle, offene Einladungen mit Ablaufdatum, zurückziehen | `invite_members`, nur Rollen unterhalb der eigenen. Mitglieder, doppelte Einladungen und die eigene Adresse werden abgefangen. |
| **Gefahrenbereich** | Leitung übertragen, Kalender verlassen, Team löschen (mit Bestätigung, nach Verlassen oder Löschen zurück zu den Einstellungen) | Übertragen nur Owner, Verlassen jeder außer dem letzten Owner, Löschen nur mit `delete_team` (Owner) |

**Leitung übertragen:** Ein Fenster listet alle Mitglieder außer dir und bestehenden Owners, oben mit Suche nach Name oder E-Mail. Nach Auswahl und „Bestätigen“ folgt eine zweite Rückfrage, die den neuen Owner nennt und sagt, was sich ändert. Erst „Endgültig übertragen“ ruft `POST /teams/:teamId/transfer-ownership` auf: Das Mitglied wird Owner, du wirst Administrator, beides in einem Schritt. Danach verschwinden „Leitung übertragen“ und „Team löschen“, Verlassen ist möglich.

Der persönliche Kalender hat keine Tabs, nur **Allgemein** (Name und Farbe) und einen Hinweis, dass er sich nicht teilen oder löschen lässt. Ohne Zugriff (z. B. nach dem Entfernen) zeigt die Seite „Diesen Kalender gibt es nicht, oder du hast keinen Zugriff mehr.“

Die Seite liegt in `features/calendars/components/settings/`, Mitglieder und Einladungen lädt `useTeam`. Bestätigungen laufen über den allgemeinen `ConfirmModal` aus `components/`, den jetzt auch „Kalender verlassen“ in der Liste nutzt.

### Kalender erstellen

Eigene Seite `/calendars/new` (nur angemeldet, sonst Anmeldung und danach zurück). Erreichbar über die Kachel **Neuer Kalender** in „Kalender wechseln“ und den Button **Kalender erstellen** in den Einstellungen.

Die Erstellung läuft in Schritten, oben zeigt ein `Stepper` den Fortschritt. Erledigte Schritte lassen sich anklicken, um zurückzuspringen. Eingaben bleiben dabei erhalten.

1. **Name:** Name (Pflicht, bis 80 Zeichen) und Beschreibung (optional, bis 500 Zeichen)
2. **Farbe:** gleiche Auswahl wie bei Terminen, mit Vorschau des Kalenders
3. **Mitglieder:** E-Mail und Rolle eingeben, **Hinzufügen** oder Enter. Unter der Auswahl steht, was die Rolle darf. Geprüft wird: gültige Adresse, nicht doppelt, nicht die eigene, höchstens 50. Der Schritt ist optional.
4. **Überprüfen:** Zusammenfassung mit Vorschau, dann **Kalender erstellen**

Danach ist der neue Kalender aktiv und man landet im Kalender. Der Ersteller ist Owner.

Angelegt wird über `POST /calendars` mit Name, Beschreibung, Farbe und Einladungen. Der Server macht dich zum Owner und verschickt die Einladungen per E-Mail.

### Einstellungen

Seite `/settings`, erreichbar über **Einstellungen** im Kontomenü (runder Button mit dem Anfangsbuchstaben). Mit `VITE_FEATURE_AUTH=true` nur für Angemeldete: `/settings` leitet sonst zum Kalender um, auch direkt nach dem Löschen des Kontos. Ohne Anmeldefunktion gibt es kein Kontomenü, dann führt ein Zahnrad in der Kopfzeile zu den Einstellungen.

Oben wechseln Tabs zwischen **Kalender**, **Einladungen** (nur mit bestätigter E-Mail und Team-Funktionen, Anzahl offener Einladungen im Tab), **Darstellung** (Sprache und Region, Farbschema, Startansicht, eigene Farben) und **Konto** (nur angemeldet). Der gewählte Tab steht in der Adresse (`/settings?tab=appearance`), bleibt also beim Neuladen erhalten und lässt sich verlinken. Pfeiltasten links/rechts wechseln den Tab.

Die Seite nutzt die volle Breite: links Titel und Erklärung jedes Abschnitts, rechts die Einstellungen. Auf dem Handy untereinander.

- **Kalender:** alle Kalender, auf die man Zugriff hat (persönlich und Teams), mit Farbe, Team und eigener Rolle. Bei Team-Kalendern legt ein Schalter fest, ob ihre Termine **auch im persönlichen Kalender** erscheinen (`showInPersonal`, Standard an). Team-Kalender lassen sich mit Bestätigung **verlassen**, außer man ist Owner. Der persönliche Kalender lässt sich nicht entfernen. Schalter und Verlassen werden sofort auf dem Server gespeichert.
- **Zahnrad an der Kachel** führt zur Einstellungsseite des Kalenders (siehe [Kalender-Einstellungen](#kalender-einstellungen)). Es erscheint beim persönlichen Kalender immer und bei Team-Kalendern nur mit einer Rolle, die dort etwas verwalten darf (Owner, Administrator, Verwalter).
- **Einladungen:** Offene Einladungen an die eigene E-Mail-Adresse stehen oben mit Team, Beschreibung, Rolle, Absender und Ablaufdatum. **Annehmen** nimmt den Kalender sofort in die Liste und in „Kalender wechseln“ auf, **Ablehnen** entfernt die Einladung.
- **Sprache und Region:** Automatisch (Browser bzw. Vorgabe des Gastgebers) oder eine der mitgelieferten Sprachen mit Region. Wirkt sofort, siehe [Sprache und Region](#sprache-und-region).
- **Farbschema:** Wie System, Hell oder Dunkel. Gesetzt über `data-theme` am `<html>`, die Farben kommen weiter aus `light-dark()`.
- **Startansicht** getrennt für Computer/Tablet und Handy
- **Eigene Farben** ansehen und entfernen. Termine mit dieser Farbe behalten sie.
- Gespeichert in diesem Browser unter `calendar.preferences.v1` (Farben weiter unter `calendar.colors.v1`). Beim ersten Start legt die App beide Einträge mit Standardwerten an: Farbschema `system`, Startansicht Woche bzw. Tag auf dem Handy, Sprache `auto`, keine eigenen Farben. Vorhandene Werte bleiben unverändert. **Angemeldet** liegen Einstellungen und Farben auf dem Server (`/preferences`, `/colors`) und gelten auf jedem Gerät.
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

Die Pfeiltasten wirken, wenn der Fokus im Kalender liegt oder nirgends (z. B. direkt nach dem Laden oder nach dem Schließen eines Fensters). Sind mehrere Kalender auf der Seite, reagiert der zuletzt benutzte, anfangs der erste. Solange ein Eingabefeld, ein Fenster oder ein Element der Host-Seite den Fokus hat, sind sie aus (`hooks/useArrowKeyNavigation.ts`).

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
  uid: string
  title: string
  location: string
  links: EventLink[]
  startDate: string
  start: string
  endDate: string
  end: string
  allDay: boolean
  timeZone: string | null
  description: string
  color: 'blue' | 'red' | 'green' | 'yellow' | `#${string}`
  recurrence: Recurrence | null
  excludedDates: string[]
  seriesId: string | null
  originalDate: string | null
  reminders: number[]
  attendees: Attendee[]
  createdAt: string
  updatedAt: string
}

type EventLink = { url: string; label: string }

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
- **Ganztägig** (`allDay: true`): `start` und `end` sind `00:00`, `endDate` zählt mit (inklusiv), `timeZone` ist immer `null`. Angezeigt in der Zeile „Ganztägig“ über dem Raster, mehrtägige als durchgehender Balken (`features/calendar/utils/allDay.ts`).
- **Zeitzone** (`timeZone`): IANA-Name wie `Europe/Berlin`, in dem `start` und `end` gemeint sind. `null` heißt „überall dieselbe Ortszeit“. Neue Termine bekommen die Anzeige-Zeitzone vorausgewählt. Sie kommt aus der Einstellung „Zeitzone“ unter Darstellung (`preferences.timeZone`), bei „Automatisch (empfohlen)“ aus dem Prop `timeZone` des Hosts und sonst aus dem System (`context/TimeZoneContext.ts`, `useViewerTimeZone`). Die Reihenfolge ist dieselbe wie bei der Sprache: eigene Wahl vor Host vor System. Beim Anzeigen werden Vorkommen in der Zone des Termins berechnet und dann in die Anzeige-Zone umgerechnet (`expandEvents`, `utils/timeZone.ts`), dabei kann sich das Datum verschieben, bei extremen Zonen um bis zu zwei Tage (`ZONE_SHIFT_DAYS`, um so viel wird auch der Ladebereich erweitert). Die Suche zeigt Treffer ebenfalls in der Anzeige-Zone und springt zum umgerechneten Tag. `source` am Vorkommen hält die Zeiten in der Zone des Termins, `occurrenceDate` das Datum in der Serie. Bearbeitet wird in der Zone des Termins, der Dialog zeigt die Zeit in der eigenen Zone darunter.
- Ältere Termine ohne `allDay` und `timeZone` werden als zeitgebundene Termine ohne Zeitzone gelesen
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

Der Zugriff auf Daten läuft ausschließlich über die Schnittstellen `EventRepository` und `ColorRepository` im Feature `storage`. Welche Umsetzung genutzt wird, entscheidet der `StorageProvider` in `lib/CalendarApp.tsx` anhand von `createStorageConfig` aus `src/config/storage.ts`:

- `VITE_STORAGE_MODE=local` → `{ mode: 'local' }`
- `VITE_STORAGE_MODE=remote` → `{ mode: 'remote', baseUrl: VITE_API_BASE_URL, timeoutMs: VITE_API_TIMEOUT_MS }`

Ist die Anmeldung eingeschaltet, entscheidet stattdessen die Sitzung: angemeldet `remote`, abgemeldet `local` (siehe [Anmeldung](#anmeldung)). Antwortet der Server nicht rechtzeitig oder ist er nicht erreichbar, zeigt der Kalender eine verständliche Fehlermeldung.

`RemoteEventRepository` ist dafür bereits angelegt und erwartet eine REST-API mit `GET /events?from=&to=&calendarId=…` (`calendarId` einmal je sichtbarem Kalender, `personal` steht für den eigenen persönlichen Kalender; liefert alle Termine, die den Zeitraum überschneiden, also `startDate <= to` und `endDate >= from`, sowie alle Serien, die im Zeitraum mindestens ein Vorkommen haben; die Serien werden unverändert geliefert und im Browser aufgefächert), `GET /events?seriesId=` (Serie und alle mit ihr verknüpften Einzeltermine), `POST /events` (mit `calendarId` im Body), `PUT /events/:id` (ändert den Kalender nicht) und `DELETE /events/:id`. **Es ist bisher nur gegen einen einfachen Test-Server geprüft (Laden, Anlegen, Timeout), noch nicht gegen ein echtes Backend.** Eigene Farben werden auch im Remote-Modus vorerst lokal gespeichert.

---

## Projektstruktur

```
README.md                      Öffentliche Dokumentation (Englisch), Startseite auf npm und GitHub
DEVELOPMENT.md                 Diese Datei: Entwicklung im Detail (Deutsch)
CHANGELOG.md                   Änderungen je Version
LICENSE                        MIT
api/openapi.yaml               REST-Vertrag (OpenAPI 3.1) für restDataSource und eigene Backends
demo/embed.html                Demo-Gastgeberseite: zwei Widgets, störendes CSS (Dev-Server)
demo/local.html                Testseite für den lokalen Build (dist-lib/cdn), über einen statischen Server
demo/cdn.html                  Testseite für die veröffentlichte Version über jsDelivr
scripts/packageVersion.ts      Version aus package.json für den Build (VERSION)
scripts/collect-types.mjs      Öffentliche Typdefinitionen für das npm-Paket einsammeln
vite.lib.config.ts             Library-Build (npm und Script-Datei)
tsconfig.lib.json              Typdefinitionen der Bibliothek erzeugen
src/
├─ data/                       Daten-Adapter: CalendarDataSource, localDataSource, restDataSource, tenantDataSource
├─ lib/                        Öffentliche Bibliothek
│  ├─ index.ts                 Öffentliche Exporte: Calendar, defineCalendarElement, Daten-Adapter, Typen
│  ├─ CalendarWidget.tsx       <Calendar>: Props → Konfiguration, IsolatedRoot + CalendarApp
│  ├─ CalendarApp.tsx          AuthProvider + Repositories aus dataSource.connect (je nach Sitzung) + Provider + Router je Instanz
│  ├─ IsolatedRoot.tsx         Shadow Root mit gebündelten Stilen, stellt die Wurzel per RootElementContext bereit
│  ├─ element.tsx              <calendar-widget> (Custom Element, Attribute → Props)
│  ├─ element-auto.ts          Einstieg der Script-Datei: registriert <calendar-widget>
│  ├─ eventCallbacks.ts        onEventCreate/Update/Delete um das EventRepository legen
│  ├─ linkParam.ts             Startansicht aus dem URL-Parameter (calendarPath) lesen
│  ├─ version.ts               VERSION
│  ├─ config.ts                CalendarProps
│  └─ defaults.ts              CalendarConfig und Standardwerte (auch für vite.config.ts)
├─ i18n/                       Sprache und Region
│  ├─ messages/                en/ und de/ je Bereich, fr, es, it, nl, pl, pt je eine Datei; Englisch definiert den Typ, index.ts lädt nach und führt zusammen
│  ├─ I18nProvider.tsx         Wählt die Sprache (Nutzer > Gastgeber > Browser > en-US), setzt lang an der Wurzel
│  ├─ useI18n.ts               m, format, weekInfo, locale
│  ├─ format.ts                Datum, Uhrzeit, Wochentage und Listen je Locale (Intl)
│  ├─ weekInfo.ts              Erster Wochentag und Zählweise der Wochen
│  ├─ locale.ts                Unterstützte Sprachen, Auswahl und Rückfall
│  └─ errorMessage.ts          Fehler-Codes in Text übersetzen
├─ context/
│  ├─ HostContext.ts           Vorgaben des Gastgebers: teams, theme, initialView, timeZone
│  ├─ TimeZoneContext.ts       Anzeige-Zeitzone: Einstellung, sonst Host, sonst System
│  └─ RootElementContext.ts    Wurzel-Element des Widgets (Theme, Modals, Tasten, Breakpoints)
├─ router.tsx                  Routen und createCalendarRouter (memory oder browser): /, /settings, /calendars/new, /login, …
├─ pages/
│  ├─ CalendarPage.tsx         Kalender mit Startansicht, Kontomenü (Zahnrad nur ohne Anmeldefunktion), Bestätigungsleiste und Übernahme-Abfrage
│  └─ SettingsPage.tsx         Einstellungen in Tabs: Kalender, Einladungen, Darstellung, Konto
├─ main.tsx                    Einstieg der Website: <Calendar routing="browser" /> mit Werten aus der .env
├─ env.d.ts                    Typen der Umgebungsvariablen
├─ config/
│  ├─ parseEnv.ts              Umgebungsvariablen lesen und prüfen (auch in vite.config.ts)
│  ├─ env.ts                   Geprüfte .env-Werte für die Website (nur main.tsx)
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
│  ├─ useFormState.ts          Formularwerte, Fehler je Feld, `bind(name)` für value/error/onChange, Prüfung beim Absenden, Zurücksetzen
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
│  ├─ ical.ts                  iCalendar (.ics) schreiben und lesen
│  ├─ notifications.ts         Erlaubnis für Browser-Benachrichtigungen
│  ├─ reminders.ts             fällige Erinnerungen aus Terminen berechnen
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
   │  ├─ components/           EventModal, DeleteEventModal, ColorPicker, RecurrenceFields, RecurrenceScopeModal, ScopeButtons, CustomColorSettings,
   │  │                        TimeZoneField, ReminderField, AttendeesField, LinksField
   │  ├─ constants/            Farben, Bezeichnungen der Bearbeitungsbereiche
   │  ├─ hooks/                useEvents, useCustomColors
   │  ├─ types/
   │  └─ utils/                Serien-Aktionen gegen das Repository, Auswahl der Bereiche, iCalendar-Import (icalExchange)
   ├─ reminders/               Erinnerungen planen und anzeigen, solange das Widget offen ist (useReminders, ReminderNotices)
   ├─ storage/                 Datenspeicherung
   │  ├─ components/           LocalImportPrompt: lokale Termine ins Konto übernehmen
   │  ├─ context/              StorageContext, StorageProvider (inkl. version/invalidate zum Neuladen)
   │  ├─ hooks/                useStorage, useColorRepository, usePreferencesRepository
   │  ├─ repositories/         Local- und Remote-Umsetzungen für Termine, Einstellungen und Farben; createRepositories wählt je nach Modus
   │  ├─ types/
   │  └─ utils/                LocalStorageValue/LocalStorageList (localStorage lesen/schreiben), copyEvents (Termine samt Serien-Verknüpfung kopieren), createRemoteApi
   ├─ calendars/               Kalenderauswahl (persönlich und Teams), vorbereitet für den Team-Modus
   │  ├─ components/           CalendarSwitcher (Button und Fenster), ActiveCalendarIndicator (Plakette im Kopf),
   │  │                        CalendarPreview (Monatsvorschau), InvitationList (offene Einladungen),
   │  │  ├─ settings/          CalendarSettingsPage mit Allgemein, Mitglieder, Einladungen, Import & Export, Gefahrenbereich
   │  │                        CalendarSettings (Liste in den Einstellungen, Verlassen)
   │  │  └─ create/            CreateCalendarPage mit den Schritten Details, Farbe, Mitglieder, Überprüfen
   │  ├─ constants/            Persönlicher Kalender, Rangfolge der Rollen (Bezeichnungen in i18n)
   │  ├─ context/              CalendarsProvider (lädt Kalender und Einladungen, aktiver Kalender, verlassen), liegt in App.tsx
   │  ├─ repositories/         LocalCalendarRepository (nur „Persönlich“), RemoteCalendarRepository (API)
   │  ├─ hooks/                useCalendars, useTeam (Mitglieder und Einladungen eines Teams)
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
- Serien-Aktionen bestehen aus mehreren einzelnen Speichervorgängen. Bricht einer davon ab, kann eine Serie teilweise geändert sein.
- Eigene Farben lassen sich noch nicht wieder entfernen
- Datums- und Zeitfelder (`<input type="date">`, `type="time"`) zeigen das Format der Browser- bzw. Systemsprache, nicht die gewählte Sprache
- Meldungen zu ungültigen Eingaben (`invalidInput`), die erst der Server erkennt, kommen auf Englisch
- Beim ersten Anmelden werden Einstellungen und Farben aus dem Browser nicht ins Konto übernommen, das Konto startet mit den Standardwerten

## Nächste Schritte

- [x] Anmeldung, Registrierung und Abmeldung im Frontend (`features/authorization`)
- [x] Passwort vergessen / zurücksetzen, E-Mail-Bestätigung (Frontend)
- [x] Einstellungsseite mit Konto: Name, Passwort ändern, Konto löschen (Frontend)
- [x] `.env`-Konfiguration für API-Anbindung, Dev-Proxy und Feature-Schalter
- [ ] Backend mit der oben beschriebenen REST-API inkl. `/auth`
- [ ] Server-Speicherung über `RemoteEventRepository` aktivieren
- [x] `RemoteColorRepository`, damit eigene Farben im Remote-Modus mitwandern
- [x] Team-Modus mit Einladung per E-Mail (`features/calendars`)
- [x] Eigene Farben entfernen
- [x] Schalter für Hell- und Dunkelmodus in der Oberfläche
- [x] Handy startet in der Tagesansicht, Startansicht einstellbar
- [x] Phase 1: einbettbare Bibliothek (`<Calendar>`, `<calendar-widget>`, Shadow DOM, Library-Build)
- [x] Phase 2: Daten-Adapter `CalendarDataSource` und OpenAPI-Vertrag
- [x] Phase 3 und 4 im Frontend: `tenant`, `tenantDataSource`, Anmeldung über den Gastgeber (`getUserToken`), Vertrag in `api/openapi.yaml`
- [ ] Backend für Tenants (Tenant-Trennung, erlaubte Domains, Rate-Limits, Token-Prüfung)
- [x] Einstellungen und eigene Farben im Remote-Modus übers Backend speichern
- [x] Fehlercodes vom Backend, E-Mails in der Sprache des Empfängers
