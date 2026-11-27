# Einbetten

> Die öffentliche Dokumentation auf Englisch steht im [DEVELOPER_GUIDE.md](../../DEVELOPER_GUIDE.md). Diese Datei beschreibt die Entwicklung im Detail.

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

## Daten-Adapter

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
| `restDataSource({ baseUrl, timeoutMs?, auth?, headers?, getAccessToken? })` | Spricht die [REST-API](../../api/openapi.yaml). Mit `auth: true` (Standard) gibt es Anmeldung im Widget. Gäste arbeiten dann im Browser, Angemeldete auf dem Server. Mit `auth: false` immer Server, z. B. wenn der Gastgeber selbst anmeldet und per `getAccessToken` ein Token mitgibt. |

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

## Tenants und Anmeldung über den Gastgeber

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

Was der öffentliche Tenant-Dienst dafür tun muss, steht in [`api/openapi.yaml`](../../api/openapi.yaml) unter „Public tenant service“ (für Selbst-Hoster nur Empfehlungen): Host-Token prüfen (nur `ES256`/`EdDSA`/`RS256`, `kid`, `iss` = Tenant, `aud: rokoyfa-calendar`, höchstens 5 Minuten gültig, jedes `jti` nur einmal), Sitzung an den Tenant binden, `Origin` bei jeder Änderung prüfen, fremde Daten mit `404` beantworten. Wie ein Gastgeber seine Tokens signiert, steht im DEVELOPER_GUIDE unter „Signing user tokens“. Nutzer löscht der Gastgeber im Host-Dashboard (E-Mail und Name), nicht über die API. Die E-Mail aus dem Host-Token gilt nicht als bestätigt; Einladungen gibt es erst nach Bestätigung (`emailNotVerified`). Getestet gegen ein simuliertes Backend: Tenant-Header bei allen Aufrufen, Anmeldung per Token, Gastmodus ohne Token und erneute Anmeldung nach abgelaufener Sitzung.

## REST-API (OpenAPI)

Der Vertrag zwischen `restDataSource` und einem Backend liegt als **OpenAPI 3.1** in [`api/openapi.yaml`](../../api/openapi.yaml): alle Endpunkte mit Anfragen, Antworten, Fehlercodes und Rechten. Jede Operation trägt `x-feature` (`core`, ein Feature-Name, `getUserToken` oder `tenant`); ein eigenes Backend braucht nur `core` und die Endpunkte der eingeschalteten Features. Das Test-Backend ist die Referenz-Umsetzung. Geprüft wurde, dass das Test-Backend alle beschriebenen Endpunkte außer `POST /auth/token` (Tenants) und `GET /holidays` (nur für `holidaySource="backend"`) hat und dass seine Antworten den Schemas entsprechen: zuerst in einem Durchlauf über die 40 Endpunkte von 1.x (65 Aufrufe, auch Fehlerfälle), dann für Zwei-Faktor-Anmeldung, Geräte, abonnierte Kalender, Verlauf und Benachrichtigungen (44 Aufrufe über 29 Operationen).

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

## Sprache und Region

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

[← Zurück](01-quick-start.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](03-browser-tests.md)
