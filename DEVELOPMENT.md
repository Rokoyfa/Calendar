# Kalender – Entwicklung

Einbettbarer Kalender (`@rokoyfa/calendar`), gebaut mit React, TypeScript und Vite. Diese Datei beschreibt Aufbau, Konfiguration und Verhalten im Detail. Die öffentliche Dokumentation für Nutzer des Pakets steht auf Englisch in der [README.md](README.md) (Überblick) und im [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) (Einbindung, Konfiguration, Typen, Backend), Änderungen je Version im [CHANGELOG.md](CHANGELOG.md).

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
| `npm run typecheck` | Nur Typprüfung (App und Browser-Tests) |
| `npm test` | Unit-Tests (Vitest) |
| `npm run test:e2e` | Browser-Tests (Playwright) gegen das TestBE, siehe [Browser-Tests](#browser-tests) |
| `npm publish` | Veröffentlichen, prüft vorher Lint und Typen und baut die Bibliothek (siehe [Veröffentlichen](#veröffentlichen)) |

**Technik:** React 19, React Router 8, TypeScript 6, Vite 8, ESLint. Voraussetzung ist **Node.js 22.22 oder neuer** (verlangt von React Router 8).

## Einbetten

> Die öffentliche Dokumentation auf Englisch steht im [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md). Diese Datei beschreibt die Entwicklung im Detail.

Der Kalender ist eine einbettbare Komponente. Diese Website ist selbst nur ein Gastgeber: `src/main.tsx` rendert `<Calendar routing="browser" />` mit den Werten aus der `.env`. Eine Demo-Gastgeberseite mit zwei Widgets und absichtlich störendem CSS liegt unter `/demo/embed.html` (im Dev-Server erreichbar).

**React-Projekte (npm-Paket):**

```tsx
import { Calendar } from '@rokoyfa/calendar'

<Calendar storageMode="remote" apiBaseUrl="https://api.example.com" features={{ auth: true }} style={{ height: 700 }} />
```

**Alle anderen Seiten (Script-Tag):**

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js"></script>
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

**Einstellungen pro Tenant:** Mit `tenant` lädt der Kalender beim Start einmal `GET /tenant/config` (`useTenantConfig`, `lib/tenantConfig.ts`) und legt das über die Einstellungen der Seite: Standardwerte → Attribute/Props/Config-Datei → Tenant (`applyTenantConfig`). Was das Backend nicht setzt, kommt weiter von der Seite. Nicht vom Backend setzbar sind `tenant`, `storageMode`, `apiBaseUrl`, `routing` und das Feature `auth`; mit Tenant ist die Anmeldung immer an. Mit `storageMode="local"` wird `tenant` ignoriert. Schlägt die Anfrage fehl, startet der Kalender mit den Einstellungen der Seite. Der Schalter `registration` blendet die Registrierung aus (Link auf der Anmeldeseite, `/register` leitet zur Anmeldung). Das Backend muss abgeschaltete Features zusätzlich mit `403` `featureDisabled` ablehnen. Im TestBE kommt die Tenant-Konfiguration aus `tenant-config.json` (Vorlage: `tenant-config.example.json`).

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
- Liefert `getUserToken` `null`, arbeitet das Widget wie für Gäste im Browser. Statt des Kontomenüs stehen die Einstellungen dann im Kalendermenü.
- Die Eigenschaft kann vor oder nach dem Laden der Script-Datei gesetzt werden.
- Als Daten-Adapter: `tenantDataSource({ tenant, baseUrl, getUserToken })`.

Was der öffentliche Tenant-Dienst dafür tun muss, steht in [`api/openapi.yaml`](api/openapi.yaml) unter „Public tenant service“ (für Selbst-Hoster nur Empfehlungen): Host-Token prüfen (nur `ES256`/`EdDSA`/`RS256`, `kid`, `iss` = Tenant, `aud: rokoyfa-calendar`, höchstens 5 Minuten gültig, jedes `jti` nur einmal), Sitzung an den Tenant binden, `Origin` bei jeder Änderung prüfen, fremde Daten mit `404` beantworten. Wie ein Gastgeber seine Tokens signiert, steht im DEVELOPER_GUIDE unter „Signing user tokens“. Nutzer löscht der Gastgeber im Host-Dashboard (E-Mail und Name), nicht über die API. Die E-Mail aus dem Host-Token gilt nicht als bestätigt; Einladungen gibt es erst nach Bestätigung (`emailNotVerified`). Getestet gegen ein simuliertes Backend: Tenant-Header bei allen Aufrufen, Anmeldung per Token, Gastmodus ohne Token und erneute Anmeldung nach abgelaufener Sitzung.

### REST-API (OpenAPI)

Der Vertrag zwischen `restDataSource` und einem Backend liegt als **OpenAPI 3.1** in [`api/openapi.yaml`](api/openapi.yaml): alle Endpunkte mit Anfragen, Antworten, Fehlercodes und Rechten. Jede Operation trägt `x-feature` (`core`, ein Feature-Name, `getUserToken` oder `tenant`); ein eigenes Backend braucht nur `core` und die Endpunkte der eingeschalteten Features. Das Test-Backend ist die Referenz-Umsetzung. Geprüft wurde, dass das Test-Backend alle beschriebenen Endpunkte außer `POST /auth/token` (Tenants) und `GET /holidays` (nur für `holidaySource="backend"`) hat und dass seine Antworten den Schemas entsprechen: zuerst in einem Durchlauf über die 40 Endpunkte von 1.x (65 Aufrufe, auch Fehlerfälle), dann für Zwei-Faktor-Anmeldung, Geräte, abonnierte Kalender, Verlauf und Benachrichtigungen (44 Aufrufe über 29 Operationen).

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

- `messages/en/*.ts` sind die Quelle der Texte, je Bereich eine Datei (`core`, `calendar`, `events`, `calendars`, `auth`, `settings`, `storage`, `security`, `inbox`, `external`, `caldav`). Der Typ `Messages` wird aus Englisch abgeleitet. Jede andere Sprache hat dieselben Dateien (`messages/de/*.ts`, `messages/fr/*.ts` usw., Grammatik-Hilfen wie die polnische Mehrzahl in `grammar.ts`) und muss genau dieselben Schlüssel haben, sonst schlägt die Typprüfung fehl. Ein Test vergleicht zusätzlich den Aufbau aller Sprachen mit Englisch.
- Alle Sprachen, auch Englisch, werden erst bei Bedarf nachgeladen (`loadMessages` in `messages/index.ts`, je Sprache eine eigene Datei von etwa 7–12 KB gzip, auch im CDN-Build). Englisch dient weiter als Grundlage für eigene Sprachen über `messages`. Bis die Sprache da ist, zeigt das Widget nichts, beim Wechsel in den Einstellungen bleibt bis dahin die alte Sprache stehen.
- **Neue Sprache einbauen:** Ordner `messages/<code>/` mit `index.ts` anlegen (am einfachsten eine bestehende Sprache kopieren), in `BUILT_IN_LANGUAGES` und `BUILT_IN_LOCALES` (`locale.ts`) sowie in den Ladern in `messages/index.ts` eintragen. Grammatik wie Mehrzahl oder Geschlecht steckt in den Funktionen der jeweiligen Sprache (Beispiel Polnisch: `plural`).
- **`messages` des Gastgebers** (Prop bzw. Property am Web Component): `{ [Sprachcode]: Teil-Texte }`. Für eine mitgelieferte Sprache werden einzelne Texte überschrieben, eine neue Sprache (z. B. `sv`) baut auf Englisch auf und ist danach wählbar. Zusammengeführt wird tief (`mergeMessages`), fehlende Texte kommen aus der Basis.
- Texte mit Werten sind Funktionen, z. B. `views.weekNumber(45)` → `Wk 45` bzw. `KW 45`. Abkürzungen und Mehrzahl stehen so je Sprache an einer Stelle.
- `useI18n()` liefert `m` (Texte), `format` (Datum, Uhrzeit, Wochentage, Listen), `weekInfo` und `locale`.
- Fehler tragen einen **Code** statt eines Textes (`AppError`, `ApiError.code`) und werden erst beim Anzeigen übersetzt (`getErrorMessage(error, m)`). Meldungen, die der Server ohne bekannten Code schickt, werden unverändert angezeigt.
- Prüfungen (`validateEventInput`, `validateEmail`, Formular-Validierung) bekommen `m` übergeben.

---

## Browser-Tests

Die Browser-Tests in `e2e/` spielen die wichtigsten Abläufe in Chromium durch: Anmelden und lokaler Modus, Termin anlegen, ändern, löschen und rückgängig machen, einzelnen Termin einer Serie ändern, Live-Updates und Konfliktschutz mit zwei Nutzern, Anhänge, Papierkorb, Datenexport und Tastaturbedienung.

`e2e/features.spec.ts` prüft die Feature-Schalter: Für jeden Schalter mit sichtbarer Oberfläche steht in `PROBES`, woran man ihn erkennt (Menüeintrag, Tab, Feld, Überschrift). Die Tests öffnen dafür die Seite `e2e/harness/features.html`, die das Widget mit den Schaltern aus der URL startet (`?features=auth,search` schaltet nur diese beiden ein, `?features=all` alle, `&path=/settings` öffnet eine Seite). Pro Schalter wird geprüft, dass er allein seine Bedienelemente zeigt und dass sie ohne ihn fehlen; außerdem, dass Termine mit allen Zusatzfunktionen aus weiter angelegt werden können. Neue Schalter mit eigener Oberfläche bekommen dort einen Eintrag.

**Einmalig:**

```bash
npm install
npx playwright install chromium
cd ../TestBE && npm install
```

**Starten:** `npm run test:e2e`. Playwright startet dafür selbst ein TestBE (Port 3998) und den Entwicklungsserver (Port 5198), jeweils mit eigenen, leeren Daten in einem temporären Ordner. Laufende Server auf 3999 und 5173 stören nicht, `data.json` des TestBE bleibt unberührt.

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `E2E_BACKEND_DIR` | `../TestBE` | Ordner des TestBE |
| `E2E_API_PORT` / `E2E_APP_PORT` | `3998` / `5198` | Ports der beiden Server |
| `E2E_DEBUG` | – | Zeigt auch die Ausgaben des Entwicklungsservers |

**Mit einem eigenen Backend:** `E2E_BACKEND_DIR` auf dessen Ordner setzen. Playwright startet dort `npx tsx src/server.ts`; wird das Backend anders gestartet, den Befehl unter `webServer` in `playwright.config.ts` anpassen. Das Backend muss `PORT`, `APP_URL`, `DATA_FILE` und `ATTACHMENTS_DIR` aus der Umgebung lesen. Außerdem lesen die Tests die Bestätigungs-E-Mails über `GET /api/dev/mails` aus. Diesen Endpunkt gibt es nur im TestBE, er gehört nicht zur API in `api/openapi.yaml`. Ein eigenes Backend braucht für die Tests also einen solchen Entwicklungs-Endpunkt (Antwort: Liste von `{ to, subject, link }`) oder muss neue Konten in der Testumgebung direkt als bestätigt anlegen.

Schlägt ein Test fehl, liegt unter `test-results/` ein Trace, den `npx playwright show-trace <Datei>` Schritt für Schritt abspielt. Jeder Test legt eigene Nutzer mit zufälliger E-Mail an, die Tests laufen deshalb unabhängig voneinander und parallel.

## Veröffentlichen

Das Paket heißt **`@rokoyfa/calendar`** und erscheint öffentlich auf npm unter MIT-Lizenz. Über npm ist die Script-Datei automatisch auch per CDN erreichbar.

**Einmalig:** ein npm-Konto mit dem Namen `rokoyfa` anlegen (oder eine Organisation `rokoyfa`, dann darf der Scope mehreren gehören) und auf dem Rechner `npm login` ausführen.

**Vor dem Veröffentlichen lokal testen:**

```bash
npm run build:lib
npm pack                       # erzeugt rokoyfa-calendar-2.2.0.tgz
```

- In einem anderen Projekt: `npm install ../Calendar/rokoyfa-calendar-2.2.0.tgz`, dann `import { Calendar } from '@rokoyfa/calendar'`.
- Ohne npm: `demo/local.html` über einen beliebigen statischen Server öffnen (z. B. `npx serve .` im Projektordner), sie lädt `dist-lib/cdn/calendar-widget.js`.

**Veröffentlichen:**

1. Version mit `npm version patch|minor|major --no-git-tag-version` erhöhen und `CHANGELOG.md` ergänzen. Ab 1.0 gilt SemVer streng: `1.0.1` für Korrekturen, `1.1.0` für Neues, das bestehende Einbindungen nicht bricht, `2.0.0` für alles, was Props, Attribute, DOM-Events, exportierte Typen, den Daten-Adapter oder den REST-Vertrag inkompatibel ändert.
2. `npm publish`. Vorher laufen automatisch Lint, Typprüfung, Tests und `build:lib`. `publishConfig.access` ist `public`, nötig für gescopete Pakete.
3. Commit taggen, z. B. `git tag v2.2.0 && git push --tags`.

**Danach erreichbar** (CDN nach wenigen Minuten):

| Weg | Adresse |
| --- | --- |
| npm | `npm install @rokoyfa/calendar` |
| jsDelivr | `https://cdn.jsdelivr.net/npm/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js` |
| unpkg | `https://unpkg.com/@rokoyfa/calendar@2/dist-lib/cdn/calendar-widget.js` |

`demo/cdn.html` bindet die veröffentlichte Version über jsDelivr ein und zeigt alle Einbindungsarten (lokal, mit Backend, Ereignisse, Theme). `@2` holt immer die neueste `2.x`, für feste Stände die volle Version angeben (z. B. `@2.2.0`).

**Im Paket** stehen nur `dist-lib/` (npm-Build mit Typen, CDN-Script, Source-Maps), `api/openapi.yaml`, `schema/`, die beiden Beispiel-Konfigurationen aus `demo/`, `DEVELOPER_GUIDE.md`, `CHANGELOG.md`, `README.md`, `LICENSE` und `package.json`. Die Version steht zur Laufzeit in `VERSION` (Export) bzw. `customElements.get('calendar-widget').version`.

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
| `VITE_FEATURE_…`      | wie im Developer Guide  | Jede Zusatzfunktion hat einen Schalter, der Name folgt dem Feature: `chat` → `VITE_FEATURE_CHAT`, `mapLinks` → `VITE_FEATURE_MAP_LINKS`, `emailNotifications` → `VITE_FEATURE_EMAIL_NOTIFICATIONS`. Liste und Standardwerte stehen im Developer Guide unter „Features“. |
| `VITE_CONFIG_URL`     | –                       | Adresse einer Konfigurationsdatei (JSON oder YAML), z. B. `/calendar.config.yaml` aus dem Ordner `public`. Ist sie gesetzt, kommt die gesamte Konfiguration aus der Datei, die übrigen `VITE_`-Variablen werden von der App nicht mehr genutzt. Der Entwicklungs-Proxy richtet sich weiter nach `VITE_API_BASE_URL`. |
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

Der Tab **Sicherheit** (nur mit Passwort-Anmeldung) zeigt den Stand der Zwei-Faktor-Anmeldung mit Link auf `/two-factor` und die angemeldeten Geräte (`SessionsSection.tsx`): Browser und System aus dem User-Agent, letzte Nutzung, gekürzte IP, einzeln oder alle anderen abmelden. Code: `features/authorization/components/security/`.

### Zwei-Faktor-Anmeldung

- **Seite** `/two-factor` (`TwoFactorPage.tsx`, Schalter `twoFactor`): Passwort bestätigen → QR-Code (Bibliothek `qrcode`, erst auf dieser Seite nachgeladen, im npm-Paket als Abhängigkeit, im CDN-Bundle enthalten) und Schlüssel zum Eintippen → erster Code → zehn Wiederherstellungscodes zum Kopieren oder Herunterladen. Ist sie aktiv: neue Codes erzeugen, ausschalten mit Passwort und Code oder Wiederherstellungscode.
- **Anmeldung:** `POST /auth/login` antwortet mit `202` und `challenge`; die Anmeldeseite zeigt dann `TwoFactorLoginStep` (Code aus der App oder Wiederherstellungscode, `POST /auth/login/two-factor`). Bei `twoFactorExpired` geht es zurück zum Passwort.
- **Mail:** Die Bestätigungsmail nach der Registrierung enthält im TestBE einen zweiten Link auf `/two-factor`.
- Mit `getUserToken` und im lokalen Modus gibt es weder Seite noch Tab.

### Agenda, abonnierte Kalender, Verlauf, Glocke

- **Agenda** (`AgendaView.tsx`): die nächsten 30 Tage als Liste, nur Tage mit Terminen oder Feiertagen, Kürzel `A`, Ansicht `agenda` in `views`, `initialView` und den Einstellungen.
- **Abonnierte Kalender** (`features/external`, Schalter `externalCalendars`): `ExternalCalendarsProvider` lädt die Liste und den Inhalt jedes angezeigten Kalenders (`GET /external-calendars/:id/ics`, alle 15 Minuten neu), `utils/externalCalendar.ts` macht daraus mit dem iCal-Import schreibgeschützte Termine mit `calendarId` `external:<id>`. Der Kalender mischt sie vor `expandEvents` dazu; sie lassen sich nicht ziehen, nicht bearbeiten und haben weder Chat noch Anhänge, Erinnerungen oder Verlauf. Verwaltung in **Einstellungen → Verbindungen**.
- **CalDAV-Konten** (`features/caldav`, Schalter `caldavAccounts`): `CaldavProvider` lädt die Konten (`/caldav-accounts`) und gibt die Kalender an `CaldavEventRepository` (`features/storage/repositories`). `withCaldavEvents` legt sich in `CalendarApp` um das Termin-Repository und leitet alles mit `calendarId` `caldav:<id>` dorthin; so funktionieren Bearbeiten, Ziehen, Serien-Umfänge und Rückgängig ohne Sonderwege. Termin-IDs sind `caldav:<kalender>:<objekt>` bzw. `…:<datum>` für herausgelöste Termine. `utils/caldav.ts` liest ein Objekt (`toCaldavEvents`) und schreibt es zurück (`buildCaldavObject`): nur die bekannten Eigenschaften werden ersetzt, alles andere des Originals (Organisator, Kategorien, `X-`-Eigenschaften, Anhänge, fremde Alarme, Parameter der Teilnehmenden) bleibt. Objekte werden 60 Sekunden zwischengespeichert, nach `eventChanged` sofort neu geladen. Schreibgeschützte Kalender öffnen nur zum Ansehen und lassen sich nicht ziehen. `CalendarPage` hängt die angezeigten CalDAV-Kalender an `calendarIds` an.
- **CalDAV-Zugang** (Schalter `caldav`): `CaldavServerSettings` zeigt Serveradresse und Benutzername (`GET /caldav`) und verwaltet App-Passwörter (`/auth/app-passwords`). Das Protokoll selbst steht in `api/caldav.md`.
- **Tab Verbindungen** in `SettingsPage`: abonnierte Kalender, CalDAV-Konten und CalDAV-Zugang; erscheint nur, wenn eins davon verfügbar ist.
- **Verlauf** (`HistoryPanel.tsx`, Schalter `history`): Tab im Termin-Dialog, nur in Team-Kalendern.
- **Glocke** (`features/notifications`, Schalter `notifications`): `NotificationBell` neben dem Konto-Button, Liste im Popover, neue Einträge über `notification.created` auf demselben WebSocket wie Chat und Live-Updates. Ein Klick öffnet den Termin über die Link-Parameter (`calendar`, `event`, `date`, bei Chat `tab=chat`) oder die Einladungen; Termine aus Kalendern ohne Zugriff sind nur Text.

Der Tab **Daten** lädt die eigenen Daten als JSON herunter (DSGVO Art. 20): angemeldet über `GET /auth/me/export`, im lokalen Modus alles, was der Browser unter `calendar.*` speichert. Code: `DataExportSection.tsx`, `utils/dataExport.ts`. Schalter: `dataExport`.

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

### Hosting

Weil `/login`, `/settings` usw. echte Pfade sind, muss der Webserver für unbekannte Pfade die `index.html` ausliefern (SPA-Fallback). `npm run dev` und `npm run preview` machen das bereits.

---

## Funktionen

### Ansichten

Umschaltbar über **Tag / Woche / Monat / Jahr / Agenda / Aufgaben** in der Kopfzeile. Pfeile und **Heute** springen immer um die Einheit der aktuellen Ansicht; in der Aufgabenansicht gibt es sie nicht (`isFixed` in `VIEW_DEFINITIONS`).

- **Tag:** ein Tag im Zeitraster von 00:00 bis 23:00 Uhr, Titel z. B. „Samstag, 31. Oktober 2026“
- **Woche:** Montag bis Sonntag im Zeitraster, Titel mit Monat(en) und Kalenderwoche. Ein Klick auf einen Tageskopf öffnet diesen Tag.
- **Monat:** Monatsraster mit bis zu drei Terminen pro Tag, darüber hinaus „+N weitere“. Ein Klick auf die Tageszahl oder „weitere“ öffnet den Tag, ein Klick auf eine freie Stelle legt dort einen Termin um 09:00 an.
- **Jahr:** alle zwölf Monate als kleine Raster, Tage mit Terminen haben einen Punkt. Ein Klick auf einen Tag öffnet die Tagesansicht, ein Klick auf den Monatsnamen die Monatsansicht.
- Heutiger Tag ist hervorgehoben. Eine **Linie zeigt die aktuelle Uhrzeit** über alle Tage der Tages- und Wochenansicht, in der Spalte von heute kräftig rot mit Punkt. Sie erscheint nur, wenn heute im sichtbaren Zeitraum liegt, und rückt jede Minute weiter.
- Mehrtägige und wiederkehrende Termine erscheinen in allen Ansichten
- **Aufgaben:** alle Aufgaben der angezeigten Kalender nach Status, als Liste untereinander oder als Board nebeneinander, mit **Erstellen** oben rechts

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
- **Gleichzeitiges Bearbeiten:** Jeder Termin hat eine `version`, die bei jeder Änderung steigt. Beim Speichern und Löschen schickt der Kalender die Version mit, die beim Öffnen des Dialogs galt (`If-Match`). Hat inzwischen jemand anderes den Termin geändert, antwortet der Server mit `412` und `eventChanged`. Der Dialog zeigt dann „Trotzdem speichern“ (ohne Prüfung) und „Verwerfen und neu laden“. Auch Rückgängig überschreibt keine fremden Änderungen. Lokal prüft `LocalEventRepository` dasselbe.
- **Live-Updates:** Ändert jemand einen Termin in einem angezeigten Kalender, schickt der Server `event.changed` über den WebSocket. `useLiveEvents` lädt dann die Termine neu (mehrere Meldungen kurz hintereinander nur einmal) und nach einem Verbindungsabbruch einmal zum Nachholen. Ist der geänderte oder gelöschte Termin gerade im Dialog offen, zeigt der Dialog einen Hinweis mit „Neu laden“. Eigene Änderungen (`changedBy` = eigene ID) lösen keinen Hinweis aus. Im lokalen Modus hört `LocalEventRepository` auf das `storage`-Ereignis anderer Tabs. Schalter: `liveUpdates`.
- **Papierkorb:** Löschen verschiebt Termine in den Papierkorb ihres Kalenders (`DELETE /events/:id`, lokal unter `calendar.events.v1.trash`). In den Kalender-Einstellungen gibt es dafür den Tab „Papierkorb“ (Team und persönlich) mit „Wiederherstellen“ und „Endgültig löschen“. Die Liste zeigt 20 Einträge, mehr über „Weitere anzeigen“, ab 8 Einträgen gibt es eine Suche (Titel, Ort, wer gelöscht hat). Die Einstellungen des persönlichen Kalenders haben dafür jetzt auch Tabs: Allgemein, Import & Export, Papierkorb. „Papierkorb leeren“ löscht nach einer Rückfrage alle Einträge, die man löschen darf (`DELETE /calendars/:id/trash`). „Wiederherstellen“ ist in der Akzentfarbe umrandet, „Endgültig löschen“ und „Papierkorb leeren“ rot (`button--dangerOutline`). Nach 30 Tagen ist ein Termin endgültig weg. Rückgängig nach dem Löschen nutzt `restore`, dadurch bleiben ID, Anhänge und Chat erhalten. Eine herausgelöste Ausnahme lässt sich nur wiederherstellen, solange ihre Serie existiert (`seriesDeleted`). Code: `TrashSection.tsx`, `utils/trash.ts`. Schalter: `trash`.

### Wiederkehrende Termine

- Wiederholung **täglich, wöchentlich, monatlich oder jährlich**, jeweils mit Intervall, zum Beispiel alle 2 Wochen
- Wöchentlich: beliebige Wochentage auswählbar, zum Beispiel Montag und Mittwoch. Wird das Startdatum geändert und ist nur dessen Wochentag gewählt, wandert der Wochentag mit.
- Monatlich, abgeleitet vom Startdatum, wahlweise:
  - **am selben Tag**, zum Beispiel „am 15.“. Monate ohne diesen Tag werden übersprungen (31. → nur Monate mit 31 Tagen).
  - **am n-ten Wochentag**, zum Beispiel „am zweiten Dienstag“. Beim fünften Wochentag werden Monate ohne fünften übersprungen.
  - **am letzten Wochentag**, zum Beispiel „am letzten Freitag“. Wird nur angeboten, wenn das Startdatum in der letzten Woche des Monats liegt.
- Jährlich am selben Datum, der 29. Februar nur in Schaltjahren
- **Regeln aus anderen Programmen** (Import, CalDAV), die sich so nicht beschreiben lassen, etwa „letzter Werktag im Monat“ (`BYSETPOS`), „am 1. und 15.“ oder „jedes Jahr am 4. Donnerstag im November“: `recurrence.rule` hält die RRULE ohne `UNTIL`/`COUNT` (das Ende steht in `until`/`count`), `utils/rrule.ts` berechnet die Vorkommen nach RFC 5545 (`FREQ` bis `YEARLY`, `INTERVAL`, `BYDAY` mit Ordnungszahl, `BYMONTHDAY` auch negativ, `BYMONTH`, `BYYEARDAY`, `BYWEEKNO`, `BYSETPOS`, `WKST`; der Start zählt immer als erster Termin). Die übrigen Felder sind dann nur eine Annäherung. Der Dialog zeigt **Eigene Regel** mit Hinweis und behält sie, solange keine andere Wiederholung gewählt wird. `recurrence.dates` hält zusätzliche Tage (`RDATE`), höchstens 100, nicht an `until`/`count` gebunden. Beim Aufteilen einer Serie wandern die Tage ab dem Teilungsdatum mit.
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

- **Allgemein:** Titel, Ganztägig, Beginn, Ende, Zeitzone, Erinnerung
- **Darstellung:** Farbe und Kategorien (mit „+ Neue Kategorie“)
- **Wiederholung:** Wiederholungsregel
- **Teilnehmer:** nur in Teamkalendern mit Mitgliedern, mit Anzahl im Tab
- **Details:** Ort, Webseite & Links, Beschreibung

Beim Speichern mit Fehlern springt der Dialog zum ersten Tab mit Fehlern, sofern der aktuelle keine hat. Tabs mit Fehlern tragen einen roten Punkt. Welches Feld zu welchem Tab gehört, steht in `TAB_FIELDS` in `EventModal.tsx`.

### Ort, Links, Erinnerungen, Teilnehmer

- **Links** (`links`, bis zu 10, je `url` bis 2000 und `label` bis 100 Zeichen): im Tab „Details“. Adressen ohne Schema bekommen `https://` vorangestellt, erlaubt sind nur `http` und `https` (`isWebUrl` in `utils/event.ts`). Gespeicherte oder importierte Links mit anderem Schema werden beim Einlesen verworfen, damit nie ein `javascript:`-Link angezeigt wird. Gültige Links lassen sich direkt aus dem Dialog in einem neuen Tab öffnen. Im Raster stehen sie mit Weltkugel unter dem Ort, sobald der Termin hoch genug ist (ab 2,5 Stunden ein Link, je weitere halbe Stunde einer mehr, was nicht passt als „+N“ hinter dem letzten). Ein Klick öffnet den Link in einem neuen Tab, nicht den Termin. Damit Links im Termin klickbar sein dürfen, ist der Block ein `div`, über dem ein unsichtbarer Button (`.eventOpen`) die ganze Fläche zum Öffnen abdeckt. Ziehen startet nicht auf einem Link. In der schmalen Wochenansicht am Handy sind die Links ausgeblendet, im Tooltip stehen sie immer. Im iCalendar wird der erste Link als `URL`, alle weiteren als `ATTACH` geschrieben, die Bezeichnung als Parameter `LABEL`.
- **Ort** (`location`, bis 200 Zeichen): im Tab „Details“. Der Ort lässt sich im Dialog (Stecknadel neben dem Feld), im Termin im Raster und auf der Antwortseite in einer Karte öffnen, standardmäßig Google Maps. Der Host stellt mit `map-url` einen anderen Dienst ein (`{query}` wird durch den Ort ersetzt, `utils/location.ts`). Ist der Ort selbst eine Webadresse, z. B. ein Videocall-Link, öffnet der Link direkt diese Adresse. Im Raster ab 90 Minuten in eigener Zeile, darunter hinter dem Titel, in der Monatsansicht hinter dem Titel, im Tooltip und in der Suche.
- **Erinnerung** (`reminders`, Minuten vor Beginn, bis zu 5, im Dialog wird eine eingestellt): Auswahl von „Zum Beginn“ bis „1 Woche vorher“, Texte über `format.duration` (Intl, je Sprache richtig gebeugt). Erinnerungen sind persönlich: das Test-Backend speichert sie je Nutzer (`remindersByUser`) und liefert nur die eigenen. Solange das Widget offen ist, lädt `features/reminders/useReminders.ts` alle fünf Minuten die nächsten vier Wochen aller Kalender und plant die fälligen Erinnerungen. Gezeigt wird eine Browser-Benachrichtigung (Erlaubnis wird beim Wählen einer Erinnerung angefragt) oder sonst ein Hinweis unten rechts. Bereits gezeigte Erinnerungen merkt sich der Browser zwei Tage lang, damit mehrere Tabs nicht doppelt erinnern. E-Mails bei geschlossenem Kalender sind Sache des Backends. Ändert man im Dialog nur die Erinnerung, speichert der Kalender sie über `PUT /events/:id/reminders` (`setReminders`), ohne Rückfrage zur Serie. So können auch Mitglieder ohne Bearbeitungsrecht sich an fremde Termine erinnern lassen, und es gehen keine Änderungs-E-Mails raus.
- **Teilnehmer** (`attendees`, nur in Teamkalendern): im Dialog aus den Mitgliedern des Kalenders hinzufügen und entfernen, „Alle einladen“ fügt alle noch nicht eingeladenen Mitglieder auf einmal hinzu. Wer selbst Teilnehmer ist, antwortet mit Ja, Vielleicht oder Nein (`POST /events/:id/response`, sofort gespeichert, auch mit Leserechten). Unbeantwortete Termine sind schraffiert, abgesagte durchgestrichen.

### Suche

**Suchen** im Kalendermenü (oder `/`) öffnet die Suche über Titel, Ort, Beschreibung und Links der angezeigten Kalender (ab 2 Zeichen, 250 ms Verzögerung). Treffer stehen nach dem nächsten Vorkommen sortiert, vergangene danach. Ein Klick springt zum Datum und öffnet den Termin. Das Backend sucht über `GET /events/search`. Adapter ohne `search` werden über das letzte und nächste Jahr aus `GET /events` durchsucht (`features/calendar/utils/search.ts`).

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

Der persönliche Kalender hat die Tabs **Allgemein** (Name und Farbe, Hinweis, dass er sich nicht teilen oder löschen lässt), **Buchungsseiten**, **Import & Export** und **Papierkorb**. Ohne Zugriff (z. B. nach dem Entfernen) zeigt die Seite „Diesen Kalender gibt es nicht, oder du hast keinen Zugriff mehr.“

Die Seite liegt in `features/calendars/components/settings/`, Mitglieder und Einladungen lädt `useTeam`. Bestätigungen laufen über den allgemeinen `ConfirmModal` aus `components/` zusammen mit `useConfirm`, auch „Kalender verlassen“ in der Liste und der Papierkorb. Die Tabs „Buchungsseiten“, „Austausch“ und „Papierkorb“ beschreibt `useCommonTabs` einmal für persönliche und Team-Kalender; bedingte Tabs stehen mit `bedingung && { … }` in der Liste, `compact` entfernt die leeren.

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

Seite `/settings`, erreichbar über **Einstellungen** im Kontomenü (runder Button mit dem Anfangsbuchstaben). Mit `VITE_FEATURE_AUTH=true` nur für Angemeldete: `/settings` leitet sonst zum Kalender um, auch direkt nach dem Löschen des Kontos. Ohne Anmeldefunktion gibt es kein Kontomenü, dann stehen die Einstellungen im Kalendermenü (☰ links in der Kopfzeile).

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
| Zu heute                         | `T` oder **Heute** im Header       |
| Ansicht wechseln                 | `D` / `W` / `M` / `Y` (auch `J`) / `A` / `K` oder Tag / Woche / Monat / Jahr / Agenda / Aufgaben |
| Neuer Termin (in der Aufgabenansicht: neue Aufgabe) | `N` oder **+** im Header |
| Suche                            | `/` oder **Suchen** im Kalendermenü |
| Letzte Aktion rückgängig         | `Strg+Z` / `⌘Z`, solange der Hinweis sichtbar ist |
| Fenster schließen                | `Esc` oder Klick neben das Fenster |
| Termin per Tastatur anlegen      | Mit `Tab` ins Raster der Tages- oder Wochenansicht, mit den Pfeiltasten die Uhrzeit wählen (`↑` / `↓` eine Stunde, `←` / `→` ein Tag, `Pos1` / `Ende` 0 bzw. 23 Uhr), `Enter` öffnet den Dialog |
| Zwischen Terminen wechseln       | Auf einem Termin: `↑` / `↓` im selben Tag, `←` / `→` zum nächsten Tag mit Terminen, `Pos1` / `Ende` zum ersten / letzten Termin |

Die Kürzel wirken, wenn der Fokus im Kalender liegt oder nirgends (z. B. direkt nach dem Laden oder nach dem Schließen eines Fensters). Sind mehrere Kalender auf der Seite, reagiert der zuletzt benutzte, anfangs der erste. Solange ein Eingabefeld, ein Fenster oder ein Element der Host-Seite den Fokus hat, sind sie aus. So bleibt z. B. `Strg+Z` in Eingabefeldern das normale Rückgängig des Browsers (`hooks/useKeyboardShortcuts.ts`, die Tasten stehen in `Calendar.tsx`, die Ansichtstasten in `VIEW_SHORTCUTS`). Die Tooltips der Buttons im Header und die Einträge im Kalendermenü nennen die Taste.

**Barrierefreiheit:** Die Pfeiltasten auf einem Termin übernimmt `useEventNavigation` (vor den globalen Kürzeln, deshalb blättert `←` / `→` dort nicht den Zeitraum). Tage und Monatszellen sind Gruppen mit Datum, „heute“ und Feiertag als Namen (`getDayLabel`), Termine haben einen vollständigen Namen (`getEventLabel`, bei Chips sichtbarer Text plus versteckte Details). Der Titel im Header ist eine Live-Region. Gedämpfter Text ist `#616161` (hell), im Dunkelmodus steht dunkler Text auf Eventfarben und Akzent. Geprüft mit axe-core in allen Ansichten, im Dialog, im Kalendermenü und in den Einstellungen, hell und dunkel.

### Feiertage

- Gesetzliche Feiertage (nur arbeitsfreie, `type: 'public'`) stehen in Tag- und Wochenansicht in der Ganztägig-Zeile, im Monat unter der Tageszahl und im Jahr als rote Tageszahl mit Name im Tooltip. Das Datum selbst ist rot.
- **Quelle:** die Bibliothek `date-holidays` (Regeln für über 200 Länder und deren Regionen, von der Community gepflegt, Daten unter CC BY-SA 4.0). Sie wird erst geladen, wenn Feiertage angezeigt werden (`features/holidays/utils/holidayLibrary.ts`, eigener Chunk). Gesetzesänderungen kommen mit einem Update des Pakets, gepflegt wird hier nichts.
- **Backend als Quelle:** Mit `holiday-source="backend"` fragt die Komponente `GET /holidays?from&to&region&lang`. Schlägt das fehl, nimmt sie die Bibliothek. Eigene Adapter können ein `holidays`-Repository mitgeben.
- **Welche Region:** Einstellung „Feiertage“ unter Darstellung (`preferences.holidays`: `auto`, `off` oder z. B. `DE-NW`) vor Host-Attribut `holidays` vor dem Land aus der Sprache (`de-DE` → `DE`, `fr` → `FR`, `utils/holidays.ts`). In den Einstellungen wählt man Land und optional Bundesland bzw. Region. Ländernamen kommen aus `Intl.DisplayNames`, weil die Bibliothek nicht alle übersetzt.

### Kalender-Abo

In den Kalender-Einstellungen (Tab „Import & Export“, beim persönlichen Kalender als Abschnitt) erstellt man einen geheimen Abo-Link, den Google Kalender, Outlook oder Apple Kalender abonnieren (`SubscribeSection.tsx`). Der Link ist je Nutzer und Kalender, enthält die eigenen Erinnerungen und lässt sich kopieren, als `webcal://` öffnen, neu erzeugen (der alte wird ungültig) oder beenden. Der Abschnitt erscheint nur, wenn das Repository `getFeed`, `createFeed` und `deleteFeed` hat und das Backend `GET /calendars/:id/feed` kennt, im lokalen Modus also nicht. Wie man den Link in Apple Kalender, Google Kalender, Outlook und Thunderbird einbindet und wie schnell die Apps Änderungen holen, steht im Developer Guide unter „Calendar subscriptions“.

### E-Mails zu Terminen

Verschickt werden sie vom Backend, der Kalender speichert nur die Wahl des Nutzers: neuer Tab **Benachrichtigungen** in den Einstellungen (nur angemeldet) mit `emailInvites`, `emailChanges` und `emailReminders`. Einladungs-E-Mails enthalten Links „Ja“, „Vielleicht“, „Nein“ auf `/respond?status=…&token=…`. Die Seite `pages/RespondPage.tsx` speichert die Antwort aus dem Link ohne Anmeldung (`POST /events/email-response`, über das Auth-Repository, weil das auch ohne Sitzung erreichbar ist), zeigt Titel, Zeit in der eigenen Zeitzone und Ort und lässt die Antwort ändern. Was das Test-Backend dafür tut, steht in dessen README.

### Chat zu Terminen

- Nur in Teamkalendern und nur angemeldet. Termine haben im Dialog einen Tab **Chat**, im Raster zeigt eine rote Plakette die ungelesenen Nachrichten.
- **Ein Chat pro Termin**, bei Serien pro Vorkommen. Der Schlüssel ist `{ eventId, occurrenceDate }` (`utils/chat.ts`, `getChatKey`): Einzeltermine `occurrenceDate: null`, Serien das Datum des Vorkommens, herausgelöste Termine die ID ihrer Serie und ihr ursprüngliches Datum, damit der Verlauf beim Verschieben eines einzelnen Termins erhalten bleibt.
- **Rechte:** alle Mitglieder lesen und schreiben, eigene Nachrichten bearbeiten und löschen, mit `manage_calendars` (Owner, Admin, Manager) alle löschen.
- **Live:** Chat und Live-Updates teilen sich eine WebSocket-Verbindung (`LiveSocket` in `features/storage/utils/liveSocket.ts`, Pfad `/chat/socket`). Sie besteht, solange etwas zuhört, schickt alle 25 Sekunden ein Ping und verbindet sich nach Abbrüchen mit wachsender Pause neu. Nach dem Neuverbinden lädt der offene Chat nach und die Zähler werden neu geholt. Senden, Bearbeiten und Löschen laufen über REST.
- **Ungelesen:** `useChatUnread` lädt die Zähler der sichtbaren Teamkalender, zählt neue Nachrichten anderer live hoch und setzt einen Chat auf null, solange er offen ist. Gelesen wird erst, wenn der Tab „Chat“ wirklich angezeigt wird.
- **E-Mail-Link:** `?calendar=…&event=…&date=…&tab=chat` wählt den Kalender, springt zum Datum und öffnet den Termin im Chat-Tab (`CalendarPage`, `openEvent` in `Calendar`). Beim Schließen verschwinden die Parameter aus der Adresse.
- Code: `features/chat/` (ChatPanel, ChatProvider, UnreadBadge, Hooks), Repository in `features/storage/repositories/RemoteChatRepository.ts`. Die Vite-Weiterleitung für `/api` reicht WebSockets mit durch (`ws: true`).

### Kategorien

- Kategorien gehören zu einem Kalender (`utils/category.ts`, höchstens 30 pro Kalender, Namen ohne Groß-/Kleinschreibung eindeutig). Termine tragen bis zu 5 davon in `categoryIds`.
- Feste Kategorien (`BUILTIN_CATEGORIES`: `work`, `leisure`, `household`, `family`, `health`, `sport`, `learning`) hat jeder Kalender, beliebig viele pro Termin und Aufgabe in `builtinCategories`, getrennt von `categoryIds` und ohne Grenze von 5. `CategoryField` zeigt sie zuerst (Texte unter `events.categories.builtin`), `CategoryFilterModal` ebenso (Filter-Id `builtin:<name>`, `builtinFilterId`, `matchesCategoryFilter`). Beim Verschieben bleiben sie. Der Planer zählt einen Termin als Arbeit, sobald `work` dabei ist (`isWorkCategorized`).
- Verwaltung in den Kalender-Einstellungen (`CategoriesSection`), Zuordnung im Termin-Dialog (`CategoryField`, dort auch „+ Neue Kategorie“). Verwalten darf, wer `manage_calendars` hat, und im persönlichen Kalender immer der Besitzer (`canManageCategories` in `permissions.ts`, weil der lokale persönliche Kalender kein `manage_calendars` hat), Filter über das Kalendermenü (`CategoryFilterModal`). Der Filter lebt nur im Zustand von `Calendar` und kennt zusätzlich „Ohne Kategorie“. Unbekannte Ids (gelöschte Kategorien) zählen als „ohne“.
- Export und Import: `toICalendar` schreibt die Namen als `CATEGORIES`, `parseICalendar` liefert sie als `categoryNames`. Beim Import ordnet `createCategoryResolver` (`features/events/utils/icalExchange.ts`) sie über den Namen zu und legt fehlende an, wenn man den Kalender verwalten darf. Hat die Datei keine Kategorien, behält ein bekannter Termin seine.
- Speicherung über `CategoryRepository` (lokal `LocalCategoryRepository`, sonst `RemoteCategoryRepository`). Fehlt das Repository im Daten-Adapter, gibt es die Funktion nicht.

### Anhänge

- Modell und Prüfungen in `utils/attachment.ts` (höchstens 20 Dateien pro Termin, je 10 MB, Name ohne Pfad und Steuerzeichen). Speicherung über `AttachmentRepository`, nur mit Backend (`RemoteAttachmentRepository`: Upload als `multipart/form-data`, Download als Blob über den API-Client mit `responseType: 'blob'`, damit auch Bearer-Token funktionieren).
- `AttachmentsField` (`features/attachments`) steht im Tab „Details“ des Termin-Dialogs, außerhalb des gesperrten `fieldset`, damit der Download auch im Nur-Lesen-Modus geht. Beim Anlegen sammelt das Feld die Dateien, `Calendar.handleSave` lädt sie nach dem Speichern hoch und meldet fehlgeschlagene über `actionError`.
- Hochladen und Löschen nur mit Bearbeitungsrecht (`canEditEntry` in `permissions.ts`, dafür liefert `parseCalendarEvent` jetzt `createdBy`). Termine tragen `attachmentCount` für die Büroklammer in `EventTitle`.

### Nur-Lesen-Modus und öffentliche Links

- `readOnly` (Option des Gastgebers) landet im `HostContext`. `Calendar` setzt damit `canCreate` auf `false`, der Termin-Dialog zeigt seine Felder in einem deaktivierten `fieldset` und nur noch „Schließen“, der Import ist ausgeblendet.
- Öffentlicher Link: `ShareSection` in den Kalender-Einstellungen holt ein Token (`getShare`, `createShare`, `deleteShare` am `CalendarRepository`) und baut daraus mit `buildSharedLink` die Adresse, je nach Routing über den Link-Parameter der Gastgeberseite oder als `/shared/:token`.
- Die Seite `/shared/:token` (`SharedCalendarPage`) braucht keine Anmeldung. Sie lädt den Kalender über `SharedCalendarRepository` und setzt einen eigenen `StorageProvider` mit nur lesenden Repositories um die normale `Calendar`-Komponente.

### Überschneidungen, Drucken, Buchungsseiten

- **Überschneidungen** (Schalter `overlapWarnings`): `OverlapNotice` im Termin-Dialog prüft 400 ms nach der letzten Eingabe über `Calendar.checkOverlaps`, ob der Zeitraum andere Termine der angezeigten Kalender schneidet (`findOverlaps` in `utils/overlap.ts`, Vergleich als Zeitpunkte in der Zeitzone des Betrachters). Ganztägige Termine, der Termin selbst und abgelehnte Einladungen zählen nicht. Gezeigt werden höchstens drei, dahinter „+N“. Nur ein Hinweis, Speichern bleibt möglich; nicht im Nur-Lesen-Modus und nicht bei CalDAV-Terminen.
- **Kalendermenü:** Der Button ☰ links in der Kopfzeile öffnet eine Leiste von links (`CalendarMenu`, `Modal` mit `placement="start"`) mit **Suchen**, **Nach Kategorie filtern** (nur mit Kategorien, Markierung „aktiv“ und Punkt am Button, solange ein Filter wirkt), **Drucken** und ohne Kontomenü **Einstellungen**. Seiten geben weitere Einträge über die Prop `menuItems` von `Calendar` mit (Aktion oder Link). Ein Eintrag schließt die Leiste, der Fokus geht danach zurück auf ☰. In der Kopfzeile bleiben Blättern, Heute, Titel, Ansichten, **+**, Glocke und Kontomenü. Ohne Einträge gibt es keinen ☰.
- **Drucken** (Schalter `print`): Eintrag im Kalendermenü. `buildPrintDocument` (`features/calendar/utils/print.ts`) baut aus dem sichtbaren Zeitraum ein eigenes HTML-Dokument (Liste je Tag, im Monat ein Raster mit Feiertagen, alle Texte maskiert), `printDocument` druckt es in einem unsichtbaren `iframe` und räumt danach auf. Speichern als PDF geht über den Druckdialog des Browsers.
- **Buchungsseiten** (Schalter `bookingPages`, nur mit Backend): Tab „Buchungsseiten“ in den Kalender-Einstellungen (persönlich und Team, mit `manage_calendars`), Code in `features/bookings/`. `BookingPageForm` mit `BookingHoursField` (Zeiten je Wochentag, Ende `00:00` = `24:00`), Liste über `ManagedListSection`, Link wie beim öffentlichen Link über `buildHostLink` (`utils/hostLink.ts`). Öffentliche Seiten ohne Anmeldung: `/book/:token` (`pages/BookingPage.tsx`, freie Zeiten einer Woche in der Zeitzone des Besuchers, dann Name, E-Mail, Notiz), `/booking/confirm?token=` und `/booking/cancel?token=` (`pages/BookingLinkPage.tsx`). Bestätigen und Absagen laufen erst auf Knopfdruck, damit Link-Scanner in Mailprogrammen nichts auslösen. `RemoteBookingRepository` steckt in `restDataSource`, auch für Gäste. Regeln für freie Zeiten und Grenzen stehen im DEVELOPER_GUIDE (Abschnitt 27) und in `api/openapi.yaml`.
- **Gemeinsame Bausteine:** Wiederkehrende Oberflächenteile liegen in `src/components`: `DecisionButtons` (Annehmen/Ablehnen mit Ladezustand und Fehler), `EditToggle` (Bearbeiten-Knopf, der in ein Formular umschaltet, mit optionalen weiteren Aktionen und Entfernen), `RemoveButton`/`CloseButton` (×-Knöpfe), `EmailTextField` (E-Mail-Feld mit Längengrenze) und `ConfirmModal` mit `tone="neutral"` und `details` für Bestätigungen, die nichts löschen. Zeitstempel formatiert `format.longDateOf`/`format.fullDayOf`, die Verwaltungsfelder neuer Termine (`request`, `version`, `createdAt` …) setzt `newEventMeta()` aus `utils/event.ts`. Listen ohne Aufzählungszeichen bekommen ihren Reset gesammelt in `base.css`.
- **Kalender-Links im Menü:** `CalendarPage` hängt an das Burger-Menü eine Gruppe „Kalender: <Name>“ mit Links in die Einstellungen des aktiven Kalenders. Welche Tabs es gibt, entscheidet `useCalendarSettingsTabs` (`features/calendars/hooks`); dieselbe Funktion nutzt auch `CalendarSettingsPage`, damit Menü und Tabs nie auseinanderlaufen. `CalendarMenuItem.group` fasst aufeinanderfolgende Einträge unter einer Überschrift zusammen.
- **Persönlichen Kalender freigeben** (Schalter `personalSharing`, nur mit Backend und Anmeldung): Besitzerseite im Tab „Freigabe“ des persönlichen Kalenders (`features/peers/components/SharingSection.tsx`, Einschalten nur nach Bestätigung, Einladen per E-Mail, Liste mit Entfernen). Empfängerseite: `PeerCalendarsProvider` lädt `/peer-calendars` und gibt die angenommenen Kalender an `PeerEventRepository` (`features/storage/repositories`); `withPeerEvents` legt sich in `CalendarApp` um das Termin-Repository und leitet `calendarId` `peer:<freigabe>` und Termin-IDs `peer:<freigabe>:<termin>` an die Freigabe-Endpunkte (Anfragen anlegen, ändern, zurückziehen). Verschieben, Wiederherstellen, Antworten und Erinnerungen sind dort gesperrt, die Suche lässt Peer-Kalender weg. Peer-Kalender stehen auch im `CalendarSwitcher` unter „Geteilt mit dir“ (der Wechsler erscheint dafür auch ohne `teams`, den Teams-Abschnitt dann nicht). Gewählt wird `peer:<freigabe>` über `selectCalendar` gespeichert (`activeId` im Kontext, `activeCalendar` bleibt dabei der persönliche); `CalendarPage` erkennt den Peer-Kalender daran und zeigt nur ihn (`calendarIds`, `targetCalendarId` und Kalenderfeld auf die Anfrage), ohne Aufgaben und Kalendermenü-Einträge, mit `ActiveCalendarIndicator shared`. Verschwindet die Freigabe, fällt die Ansicht auf den persönlichen Kalender zurück. Sonst hängt `CalendarPage` die angezeigten Peer-Kalender nur in der Ansicht des persönlichen Kalenders an `calendarIds` an und bietet im Kalenderfeld „Anfrage an …“; ist das gewählt, zeigt `EventModal` die Anfrage-Variante (`requestTo`: nur Titel, Zeit, Ort, Notiz). Bearbeitbar sind nur eigene offene Anfragen, zurückziehen geht immer. Belegt-Blöcke kommen ohne Inhalt vom Backend und bekommen im Frontend den Titel `m.peers.busy`. Der Schalter „Sichtbar für Personen, mit denen du deinen Kalender teilst“ (`visibility`) erscheint nur bei Terminen des persönlichen Kalenders. Offene Anfragen an den Besitzer zeigt das Termin-Fenster mit `RequestDecision` (Annehmen/Ablehnen über `personalSharing.acceptRequest/declineRequest`). Kalender anderer Personen stehen unter Einstellungen › Verbindungen (`PeerCalendarSettings`), Einladungen unter Einstellungen › Einladungen (`PeerInvitationList`, der Tab erscheint dafür auch ohne `teams`).

### Aufgaben

Eigenes Feature unter `features/tasks/` (Schalter `tasks`, auch lokal): `types` (Task, TaskInput, TaskRepository, TaskAccess, TaskSetup), `utils/task.ts` (Parsen, Sortieren, Gruppen), `repositories` (`LocalTaskRepository` mit `calendar.tasks.v1`, ohne Zuständige; `RemoteTaskRepository` für `/tasks*` mit `If-Match`), `hooks` (`useTaskList` lädt je Zeitraum oder alle offenen plus die letzten erledigten, `useTaskActions` mit Neuladen über `invalidate`, `useTaskEditor`,, `useTaskLayout` für Liste oder Board in `calendar.taskLayout.v1`), `context/TasksContext.ts` (Aufgaben je Tag für die Ansichten, `useTaskRows`, Statuswechsel) und `components` (`TasksProvider` mit dem lazy geladenen `TaskModal`, `ChecklistField`, `DayTasks`/`TaskChip`, `TaskCheckbox`, `TaskDetails` für die Kennzeichen, `TasksView` mit Liste und Board).

- `CalendarPage` baut das `TaskSetup`: sichtbare Kalender, Zielkalender, Kalender mit `create_entry`, Rechte (`canEditEntry`/`canDeleteEntry` wie bei Terminen, Status und Checkliste zusätzlich für die zuständige Person: `canProgress`) und `loadAssignees` aus den Team-Mitgliedern. Der Link `?calendar=…&task=…` (Glocke, `taskAssigned`) öffnet die Aufgabe.
- `Calendar` legt `TasksProvider` um die Ansichten. Tag und Woche zeigen Aufgaben als Zeilen der Ganztägig-Spur nach dem Feiertag (Woche höchstens drei, dann „+N weitere Aufgaben“, ein Klick öffnet den Tag), Monat zeigt neben Terminen eine Zeile, Agenda alle. Abhaken ist sofort sichtbar und wird bei Fehler zurückgenommen.
- Status `open`, `inProgress`, `waiting`, `done` und Priorität `low` bis `urgent`. Offene Aufgaben sortiert nach Priorität, dann Fälligkeit (`compareTasks`), am Tag nach Fälligkeit. Ansicht „Aufgaben“: Werkzeugleiste mit **Liste / Board** und **Erstellen** rechts; die Liste zeigt je Status einen Abschnitt untereinander (Erledigt eingeklappt), das Board je Status eine Spalte nebeneinander, Karten lassen sich per Drag-and-drop (HTML5, `application/x-calendar-task`) in eine andere Spalte ziehen. Ohne Maus geht der Statuswechsel im Dialog.
- Dialog (`TaskModal`, normale Breite, Reiter wie beim Termin): **Allgemein** mit Titel, Status, Priorität, Fälligkeit, Aufwand; **Checkliste** (Anzahl im Reiter); **Details** mit Beschreibung, Kalender, Zuständig, Kategorien (`CategoryField` aus `features/categories`). Bei Fehlern springt der Dialog auf den ersten Reiter mit Fehler. Wer nur zuständig ist, sieht alles gesperrt bis auf Status und Checkliste, die sofort gespeichert werden.
- Aufwand: optional in Stunden und Minuten (`estimateMinutes`, höchstens 99 Std. 59 Min.), in der Liste an jeder Aufgabe und als Summe je Gruppe (`format.effort`, `sumTaskEstimates`).
- Beim Anlegen schaltet **Termin / Aufgabe** oben im Dialog um, Titel und Datum wandern mit.
- Antwortet `GET /tasks` mit `404`, `405` oder `501`, verschwinden Ansicht, Umschalter und Einträge (`isUnsupportedEndpoint`). Im Nur-Lesen-Modus sind Aufgaben nur sichtbar.
- Live: `task.changed` vom WebSocket wird in `utils/eventChange.ts` wie eine Terminänderung ohne Termin-ID behandelt und lädt neu.
- **Einplanen** (`TaskPlanModal`, lazy aus `TaskModal`): für gespeicherte, offene Aufgaben, wenn `TaskSetup.planning` gesetzt ist; Knopf als `outline`, damit er sich von „Abbrechen“ abhebt, ohne Aufwand gesperrt mit Hinweis als `title` (auch am umgebenden `.buttonHint`, weil gesperrte Knöpfe sonst keinen Tooltip zeigen) (`CalendarPage`: persönlicher Kalender als Ziel, alle eigenen, Team-, CalDAV- und geteilten Kalender plus Abos als belegt). Ungespeicherte Änderungen an Fälligkeit oder Aufwand sperren den Knopf. Hat die Aufgabe künftige Blöcke (`useHasFutureBlocks`, lädt nach jedem `invalidate` neu) oder wurde gerade angelegt, heißt er „Neu planen“. `useTaskPlanner` lädt Termine von gestern bis ein Jahr voraus, Feiertage (`listHolidays`) und die bisherigen Blöcke der Aufgabe (`taskId`), rechnet alles in Minuten der Anzeige-Zeitzone um und ruft `planTask` (`utils/taskPlanner.ts`, rein, mit Tests). Begonnene Blöcke zählen als erledigt, künftige werden beim Anlegen erst gelöscht, dann neu angelegt (privat, `taskId`, feste Kategorien der Aufgabe oder `work`).
- **Vorschau im Kalender:** „Im Kalender ansehen“ gibt ein `TaskPlanPreview` (Blöcke, ersetzte IDs, `save`) über `TasksProvider.onPlanPreview` an `Calendar`. Der schließt die Dialoge, merkt sich Ansicht und Datum, springt in die Woche des ersten Blocks, blendet ersetzte Blöcke aus und mischt `toPlanPreviewEvents` (IDs `planPreview:<n>`, `isPlanPreviewEvent`) in die Termine. Die bekommen die Klasse `eventPlanned`, sind nicht klick- oder ziehbar, und solange die Vorschau läuft, wird nichts neu angelegt. Kopfzeile: `TaskPlanPreviewActions` (Abbrechen, Sichern) statt des Host-Zubehörs, darunter `TaskPlanPreviewBar` mit „Zurück zur Planung“ (öffnet Aufgabe und Planung wieder mit derselben Verteilung, `useTaskEditor.openEdit(task, resumePlan)`). Der Planungsdialog hat feste Höhe wie die Erstellen-Dialoge, die Blockliste scrollt.
- `planTask` plant in 15-Minuten-Schritten Blöcke von mindestens 30 Minuten im Planungsfenster vor der Fälligkeit, ohne Überschneidung mit belegter Zeit. Für Arbeit (`work` oder `taskId` in eigenen Kalendern, plus die neuen Blöcke) prüft es Ruhezeit zu anderen Tagen, Tages- und Wochenhöchstzeit, längste Strecke ohne Pause und die nötigen Pausen (Lücken ab 15 Minuten). Ruhetage des Landes, Feiertage und ganztägige Termine mit fester Kategorie bleiben frei. `even` verteilt den Rest gleichmäßig auf die übrigen Tage und füllt danach von vorn auf, `early` füllt von vorn, `late` füllt von der Fälligkeit rückwärts (Tage rückwärts, im Tag der späteste mögliche Block); ohne Fälligkeit plant `late` wie `early`. Passt nicht alles, liefert es `missingMinutes`; `findEarliestCompletion` sucht den Tag, an dem alles passt (für „Fälligkeit verschieben“).
- Regeln je Land in `utils/workingTimeLaw.ts` (`WORKING_TIME_LAWS`, sonst `DEFAULT_WORKING_TIME_LAW` mit den deutschen Werten). Das Land kommt aus `planningCountry` oder der Feiertagsregion bzw. Sprache (`usePlanningCountry`). Einstellungen im Tab **Planung** (`TaskPlanningSettings`): Verteilung, Land mit Übersicht der Regeln, Planungsfenster (mindestens eine Stunde, `isPlanningWindow`).
- Erledigt oder gelöscht: das Backend verschiebt künftige Blöcke in den Papierkorb und löst beim Löschen die übrigen. Lokal macht das `LocalTaskRepository` über `releaseTaskBlocks` des `LocalEventRepository`.

### Steuerung durch den Gastgeber

- `HostBridge` (`context/HostBridge.ts`) verbindet die Hülle (`CalendarWidget`) mit der gerade sichtbaren `Calendar`-Komponente. `useHostController` meldet dort den Controller an und berichtet Ansichtswechsel.
- Nach außen gibt es `CalendarHandle` (`lib/handle.ts`): als `ref` der React-Komponente und als Methoden am Custom Element. Die Methoden prüfen ihre Argumente und antworten mit `false`, solange kein Kalender angezeigt wird.

### Aussehen anpassen

- Öffentliche CSS-Variablen `--calendar-accent`, `--calendar-on-accent`, `--calendar-font`, `--calendar-radius`, `--calendar-bg`, `--calendar-surface`, `--calendar-text`, `--calendar-heading`, `--calendar-muted`, `--calendar-border`. Sie werden in `variables.css` in die internen Variablen übernommen. Die internen Variablen stehen dafür auch auf `.calendarRoot`, damit dort gesetzte Werte greifen.
- Akzentfarbe (`--color-accent`) und die Terminfarbe Blau (`--color-blue`) sind getrennt. Text auf der Akzentfarbe nutzt `--color-on-brand`, Text auf Terminfarben `--event-text`.
- Die Option `appearance` setzt dieselben Variablen als Inline-Stil auf `.calendarRoot` (`lib/appearance.ts`) und für `density: compact` das Attribut `data-compact`.

### Duplizieren und Rückgängig

- **Duplizieren** im Termin-Dialog öffnet einen neuen Termin mit den aktuellen Werten des Dialogs, auch noch nicht gespeicherten. Die Kopie bekommt eine neue `uid`, verliert die Verknüpfung zu einer Serie, und alle Teilnehmer stehen wieder auf „keine Antwort“. Angelegt wird sie erst beim Speichern, im Kalender aus dem Feld **Kalender**.
- **Kalender wählen und verschieben:** Das Feld **Kalender** im Dialog bietet die eigenen Kalender mit Recht zum Anlegen und die beschreibbaren CalDAV-Kalender an (`calendarChoices` aus `CalendarPage`). Bei bestehenden Terminen erscheint es nur für Serien und Einzeltermine, die man löschen darf (`canMoveEvent`); herausgelöste Termine wandern mit ihrer Serie. Beim Speichern wird erst die Änderung gespeichert und dann verschoben (`useEvents.moveEvent`, `POST /events/{eventId}/move`), mit Rückgängig. Kategorien entfallen, weil sie zum alten Kalender gehören. Zwischen Kalender und CalDAV verschiebt `withCaldavEvents` durch Anlegen im Ziel und Löschen des Originals.
- **Löschen** fragt nur noch bei Serien nach (welche Termine). Einzeltermine werden sofort gelöscht.
- Nach dem Löschen und nach dem Verschieben oder Ändern der Dauer per Ziehen erscheint unten für acht Sekunden ein Hinweis mit **Rückgängig**. `features/events/utils/undo.ts` zeichnet dafür jede Änderung am Speicher auf (anlegen, ändern, löschen, mit dem Stand davor) und nimmt sie rückwärts zurück. Gelöschte Termine werden neu angelegt. Verweisen herausgelöste Termine auf eine wiederhergestellte Serie, wird die neue ID eingesetzt. Ist ein vorheriger Stand nicht bekannt, gibt es kein Rückgängig.

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
| `calendar.tasks.v1`  | Aufgaben als JSON-Array        |
| `calendar.taskLayout.v1` | Aufgaben als Liste oder Board |

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
README.md                      Überblick (Englisch), Startseite auf npm und GitHub
DEVELOPER_GUIDE.md             Einbindung, Konfiguration, Typen und Backend-Vertrag (Englisch)
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
│  ├─ CalendarPage.tsx         Kalender mit Startansicht, Kontomenü (ohne Anmeldefunktion Einstellungen im Kalendermenü), Bestätigungsleiste und Übernahme-Abfrage
│  ├─ RespondPage.tsx          Antwort aus dem Link einer Einladungs-E-Mail speichern und ändern (ohne Anmeldung)
│  ├─ BookingPage.tsx          Öffentliche Buchungsseite /book/:token: freie Zeiten, Name, E-Mail, Notiz (ohne Anmeldung)
│  ├─ BookingLinkPage.tsx      Buchung aus den E-Mail-Links bestätigen und absagen (ohne Anmeldung)
│  └─ SettingsPage.tsx         Einstellungen in Tabs: Kalender, Verbindungen, Einladungen, Darstellung, Planung, Benachrichtigungen, Konto, Sicherheit, Daten
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
│  ├─ TextField.tsx            Textfeld mit Beschriftung und Fehler, UrlField mit den Vorgaben für Adressen
│  ├─ PasswordField.tsx        Passwortfeld mit „Anzeigen“
│  ├─ StatusMessage.tsx        Fehler- (role="alert") und Erfolgsmeldung (role="status"), ActionFeedback für beides
│  ├─ PageLayout.tsx           Eigene Seite mit „Zum Kalender“ und Titel, als Karte (Anmeldung) oder volle Breite (Einstellungen)
│  ├─ PageSection.tsx          Abschnitt mit Überschrift und Erklärung links, Inhalt rechts, optional als Gefahrenbereich
│  ├─ ConfirmModal.tsx         Bestätigung einer gefährlichen Aktion, schließt sich nach Erfolg selbst
│  ├─ FormActions.tsx          Abbrechen und Absenden am Formularende, Standard „Speichern“
│  ├─ AsyncSwitch.tsx          Schalter, der eine asynchrone Aktion auslöst, mit Sperre und Fehlermeldung
│  ├─ CopyButton.tsx           In die Zwischenablage kopieren, zeigt „Kopiert“ bis sich der Wert ändert
│  ├─ ItemList.tsx             Liste oder Leer-Hinweis
│  ├─ LimitedAdd.tsx           Formular zum Hinzufügen oder Hinweis „Höchstzahl erreicht“
│  ├─ ManagedListSection.tsx   Abschnitt mit Liste, Hinzufügen bis zur Höchstzahl und Entfernen mit Bestätigung
│  └─ Icons.tsx                SVG-Symbole
├─ hooks/                      Featureübergreifende Hooks
│  ├─ useKeyboardShortcuts.ts  Tastenkürzel des Kalenders (Pfeile, T, N, /, D/W/M/Y, Strg+Z)
│  ├─ useAsyncAction.ts        Asynchrone Aktion mit Ladezustand, Erfolg und Fehlermeldung
│  ├─ useAsyncResource.ts      Daten laden, neu laden, Abbruch bei Wechsel, apply() übernimmt das Ergebnis einer Änderung
│  ├─ useForm.ts               Ganzes Formular: Werte, Prüfung, Vorbereiten, Absenden mit Lade-, Erfolgs- und Fehlerzustand
│  ├─ useFormState.ts          Formularwerte, Fehler je Feld, `bind(name)` für value/error/onChange, Prüfung beim Absenden, Zurücksetzen
│  ├─ useConfirm.ts            Ziel einer Bestätigung merken (ask/close), passend zu ConfirmModal
│  ├─ useActionError.ts        Fehler einer Aktion als Meldung, attempt(action) leert und setzt ihn
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
│  ├─ holidays.ts              Feiertags-Region auflösen (Einstellung, Host, Sprache), Antworten des Backends prüfen
│  ├─ event.ts                 Termin-Typen, Farben (Klasse/Style samt weiterer Klassen), Validierung, Vorkommen eines Termins
│  ├─ number.ts                Ganzzahl-Prüfung mit Bereich
│  ├─ object.ts                Felder übernehmen, Wert aus fester Liste prüfen (isOneOf)
│  ├─ parse.ts                 Antworten prüfen: isRecord/asRecord, textOrEmpty/textOrNull/filledTextOrNull, parseList, requireValue
│  ├─ list.ts                  Listen per id ändern (replaceById, upsertById, removeById), compact für bedingte Einträge
│  ├─ download.ts              Datei im Browser speichern (saveBlob)
│  ├─ preferences.ts           Einstellungen: Typen, Standardwerte, Prüfung, Startansicht
│  ├─ recurrence.ts            Wiederholungsregeln, Berechnung der Vorkommen
│  ├─ series.ts                Serien ausnehmen, aufteilen, ändern
│  ├─ booking.ts               Buchungsseiten: Typen, Prüfung der Antworten, Wochenzeiten, freie Zeiten je Tag, Link
│  ├─ hostLink.ts              Link auf einen Pfad des Widgets über die Gastgeberseite (öffentliche Links, Buchungsseiten)
│  └─ validation.ts            Fehler je Feld, gemeinsame Prüfung „gibt es Fehler?“, E-Mail prüfen
└─ features/
   ├─ calendar/                Anzeige: Tag, Woche, Monat, Jahr
   │  │                        constants/views.ts beschreibt jede Ansicht einmal (Zeitraum, Schritt, Titel),
   │  │                        hooks/useCalendarView.ts steuert Ansicht und Datum
   │  │                        hooks/useEventEditor.ts den Termindialog (neu, bearbeiten, per Link geöffnet, fremde Änderungen),
   │  │                        hooks/useUndo.ts das Rückgängig-Angebot, utils/editorAccess.ts was im Dialog erlaubt ist
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
   ├─ categories/              Kategorien: CategoryField (Termin-Dialog), CategoryFilterModal, CategoriesSection (Einstellungen), useCategories
   ├─ chat/                    Chat zu Terminen: ChatPanel, ChatProvider (Ungelesen-Zähler), UnreadBadge, useChatMessages
   ├─ tasks/                   Aufgaben: Typen, Repositories (lokal und REST), TasksProvider, TaskModal, TasksView, DayTasks, Planer (taskPlanner, workingTimeLaw, TaskPlanModal, TaskPlanningSettings)
   ├─ holidays/                Feiertage: useHolidays (Region auflösen, Quelle wählen), HolidaySettings, Bibliothek date-holidays (lazy)
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
   │  │  ├─ settings/          CalendarSettingsPage mit Allgemein, Mitglieder, Einladungen, Import & Export (mit Abo-Link), Gefahrenbereich
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
   │  ├─ components/           PreferencesSettings, NotificationSettings (E-Mails zu Terminen)
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
- Keine Doppelungen: Was an mehr als einer Stelle gebraucht wird, liegt einmal in `components/`, `hooks/` oder `utils/` (featureübergreifend) bzw. im `utils/`-Ordner des Features. Formularfelder werden aus `FormField` und den darauf aufbauenden Feldern zusammengesetzt, Formularenden aus `FormActions`, Listen mit Leer-Hinweis aus `ItemList`, Antworten des Backends mit den Hilfen aus `utils/parse.ts` geprüft, Datumswerte nur über `utils/date.ts` geprüft und berechnet, Backend-Aufrufe nur über den API-Client aus `utils/api.ts`.
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
