# Datenspeicherung

Standardmäßig wird **nur der localStorage** des Browsers verwendet. Die Daten sind daher an Browser und Gerät gebunden und gehen beim Löschen der Browserdaten verloren. Über `VITE_STORAGE_MODE=remote` lässt sich auf die API umstellen (siehe [Konfiguration](05-configuration-env.md)), zum Entwickeln dient das Test-Backend `TestBE`.

| Schlüssel            | Inhalt                         |
| -------------------- | ------------------------------ |
| `calendar.events.v1` | Alle Termine als JSON-Array    |
| `calendar.colors.v1` | Eigene Farben als Hex-Werte    |
| `calendar.tasks.v1`  | Aufgaben als JSON-Array        |
| `calendar.taskLayout.v1` | Aufgaben als Liste oder Board |

## Datenmodell eines Termins

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
- Ein wiederkehrender Termin wird **einmal** als Serie gespeichert. `startDate` bis `endDate` beschreibt das erste Vorkommen, die weiteren werden beim Anzeigen berechnet (`domain/recurrence.ts`).
- `weekdays` zählt von `0` = Montag bis `6` = Sonntag und wird nur bei `weekly` ausgewertet. `until` ist das letzte mögliche Startdatum (inklusiv) oder `null`.
- `monthlyMode` wird nur bei `monthly` ausgewertet, Tag bzw. Wochentag und dessen Position ergeben sich aus `startDate`
- `until` und `count` schließen sich aus, beide `null` heißt „endet nie“
- `excludedDates` enthält Startdaten einzelner Vorkommen, die gelöscht oder als Einzeltermin herausgelöst wurden
- Ein herausgelöster Einzeltermin hat `seriesId` (Id der Serie) und `originalDate` (ursprüngliches Startdatum des Vorkommens), sonst sind beide `null`
- Ältere Termine ohne `recurrence` und `excludedDates` werden als einmalige Termine gelesen, ältere Wiederholungen ohne `monthlyMode` und `count` mit `'dayOfMonth'` und `null`
- Ältere Termine mit dem früheren Feld `date` werden beim Lesen automatisch übernommen (`endDate` = `startDate`) und beim nächsten Speichern im neuen Format geschrieben
- `calendarId` ist `'personal'` für den persönlichen Kalender (`PERSONAL_CALENDAR_ID` in `config/calendars.ts`), sonst die ID des Team-Kalenders. Ältere lokale Termine mit `'local'` werden beim Lesen dem persönlichen Kalender zugeordnet.
- `createdAt` und `updatedAt` sind ISO-Zeitstempel, gedacht für spätere Synchronisierung

## Vorbereitung für Server-Speicherung

Der Zugriff auf Daten läuft ausschließlich über die Repository-Schnittstellen in `features/storage/types/storage.ts` (`StorageRepositories`). Die Umsetzungen liegen im jeweiligen Feature (`features/<feature>/repositories/`, z. B. `LocalEventRepository` und `RemoteEventRepository` in `events`). Ein Daten-Adapter aus `src/data/` (`localDataSource`, `restDataSource`, `tenantDataSource`) stellt sie zusammen, `lib/CalendarApp.tsx` ruft `dataSource.connect` je nach Sitzung auf und reicht das Ergebnis an den `StorageProvider`. Die Website wählt den Adapter über die `.env`:

- `VITE_STORAGE_MODE=local` → `localDataSource()`
- `VITE_STORAGE_MODE=remote` → `restDataSource` mit `VITE_API_BASE_URL` und `VITE_API_TIMEOUT_MS`

Ist die Anmeldung eingeschaltet, entscheidet stattdessen die Sitzung: angemeldet `remote`, abgemeldet `local` (siehe [Anmeldung](07-sign-in.md)). Antwortet der Server nicht rechtzeitig oder ist er nicht erreichbar, zeigt der Kalender eine verständliche Fehlermeldung.

`RemoteEventRepository` ist dafür bereits angelegt und erwartet eine REST-API mit `GET /events?from=&to=&calendarId=…` (`calendarId` einmal je sichtbarem Kalender, `personal` steht für den eigenen persönlichen Kalender; liefert alle Termine, die den Zeitraum überschneiden, also `startDate <= to` und `endDate >= from`, sowie alle Serien, die im Zeitraum mindestens ein Vorkommen haben; die Serien werden unverändert geliefert und im Browser aufgefächert), `GET /events?seriesId=` (Serie und alle mit ihr verknüpften Einzeltermine), `POST /events` (mit `calendarId` im Body), `PUT /events/:id` (ändert den Kalender nicht) und `DELETE /events/:id`. Eigene Farben werden auch im Remote-Modus vorerst lokal gespeichert.

---

[← Zurück](08-features.md) · [Inhalt](../../DEVELOPMENT.md) · [Weiter →](10-project-structure.md)
