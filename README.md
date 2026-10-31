# Kalender

Online-Kalender als Website, gebaut mit React, TypeScript und Vite.

Ziel ist ein Kalender, der auf zwei Arten nutzbar ist:

- **Ohne Anmeldung:** Termine werden im Browser gespeichert (localStorage).
- **Mit Anmeldung:** Termine werden dauerhaft auf einem Server gespeichert.

Später folgt ein **Team-Modus**, in dem mehrere Mitglieder per E-Mail-Einladung einen gemeinsamen Kalender sehen und Termine anlegen können.

> **Aktueller Stand:** Es gibt nur die Variante **ohne Anmeldung**. Alle Daten liegen ausschließlich im **localStorage** des Browsers. Anmeldung, Server-Speicherung und Team-Modus sind noch nicht umgesetzt.

---

## Schnellstart

```bash
npm install
npm run dev
```

| Befehl            | Beschreibung                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Entwicklungsserver starten                  |
| `npm run build`   | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Produktions-Build lokal ansehen             |
| `npm run lint`    | ESLint ausführen                            |

**Technik:** React 19, TypeScript 6, Vite 8, ESLint. Keine weiteren Laufzeit-Abhängigkeiten.

---

## Funktionen

### Wochenansicht

- Montag bis Sonntag mit Zeitraster von 00:00 bis 23:00 Uhr
- Heutiger Tag und aktuelle Stunde sind hervorgehoben, die Uhrzeit aktualisiert sich jede Minute
- Titel zeigt Monat und Jahr, bei Monatswechsel innerhalb der Woche beide Monate
- Kalenderwoche wird neben den Pfeilen angezeigt

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
- Monatlich am selben Tag des Monats, Monate ohne diesen Tag werden übersprungen (31. → nur Monate mit 31 Tagen). Jährlich am selben Datum, der 29. Februar nur in Schaltjahren.
- Ende der Serie: nie oder an einem bestimmten Datum (letzter möglicher Termin, inklusiv)
- Unter den Feldern steht eine Zusammenfassung, zum Beispiel „Wöchentlich am Montag und Mittwoch bis 30.11.2026“
- Wiederkehrende Termine tragen im Raster ein Wiederholungssymbol, der Tooltip zeigt die Regel
- **Bearbeiten:** Bleibt die Wiederholungsregel gleich, wird gefragt, ob die Änderung für **nur diesen Termin** oder **alle Termine** gelten soll.
  - *Nur dieser Termin:* Das Datum wird in der Serie ausgenommen und ein eigenständiger Einzeltermin mit den neuen Werten angelegt.
  - *Alle Termine:* Die Änderung gilt für die ganze Serie. Wird der Termin dabei um Tage verschoben, verschiebt sich die ganze Serie mit.
  - Wird die Wiederholungsregel selbst geändert, gilt die Änderung ohne Nachfrage für alle Termine.
- **Löschen:** Bei Serien gibt es die Wahl zwischen „Nur dieser Termin“ und „Alle Termine“.
- Wird ein Termin in eine andere Woche verschoben, springt der Kalender nach dem Speichern dorthin

### Darstellung von Terminen

- Position und Höhe entsprechen exakt Uhrzeit und Dauer
- **Überlappende Termine** stehen nebeneinander und teilen sich die Spaltenbreite, zum Beispiel 2 Termine je 50 % und 3 Termine je 33 %. Die Tagesspalten behalten ihre Breite.
- Kurze Termine werden kompakter dargestellt, ab 90 Minuten wird zusätzlich die Uhrzeit angezeigt
- **Mehrtägige Termine** werden pro Tag als eigener Abschnitt im Raster gezeigt: am ersten Tag ab Beginn bis 24:00, dazwischen ganztägig, am letzten Tag ab 00:00 bis zum Ende. An den Übergängen sind die Ecken eckig, damit der Zusammenhang sichtbar bleibt. Die Zeitangabe enthält dann auch die Daten, zum Beispiel `30.10. 10:00 – 03.11. 16:00`.

### Farben

- Vier Standardfarben: Blau, Rot, Grün, Gelb
- Über den grauen **+**-Kreis lassen sich **eigene Farben** hinzufügen, maximal 12
- Eigene Farben werden gespeichert und stehen in jedem Termin wieder zur Auswahl
- Die Schriftfarbe auf eigenen Farben wird automatisch hell oder dunkel gewählt

### Bedienung

| Aktion                | Tastatur / Maus                    |
| --------------------- | ---------------------------------- |
| Vorherige Woche       | `←` oder linker Pfeil im Header    |
| Nächste Woche         | `→` oder rechter Pfeil im Header   |
| Zur aktuellen Woche   | Klick auf den Titel                |
| Fenster schließen     | `Esc` oder Klick neben das Fenster |

Die Pfeiltasten sind deaktiviert, solange ein Eingabefeld oder ein Fenster aktiv ist.

### Design

- Farben und Layout basieren auf dem ursprünglichen Kalender-Design
- **Hell- und Dunkelmodus**, standardmäßig nach Systemeinstellung
- Manuell umschaltbar über `document.documentElement.dataset.theme = 'dark' | 'light'`. Einen Schalter in der Oberfläche gibt es noch nicht.
- Auf kleinen Bildschirmen lässt sich das Raster seitlich scrollen

---

## Datenspeicherung

Momentan wird **nur der localStorage** des Browsers verwendet. Die Daten sind daher an Browser und Gerät gebunden und gehen beim Löschen der Browserdaten verloren.

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
  createdAt: string
  updatedAt: string
}

type Recurrence = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  weekdays: number[]
  until: string | null
}
```

- `startDate` und `endDate` im Format `JJJJ-MM-TT`, `start` und `end` im Format `HH:MM`
- Das Ende ist exklusiv: `endDate` = Folgetag mit `end` = `00:00` bedeutet „bis Mitternacht“
- Ein wiederkehrender Termin wird **einmal** als Serie gespeichert. `startDate` bis `endDate` beschreibt das erste Vorkommen, die weiteren werden beim Anzeigen berechnet (`utils/recurrence.ts`).
- `weekdays` zählt von `0` = Montag bis `6` = Sonntag und wird nur bei `weekly` ausgewertet. `until` ist das letzte mögliche Startdatum (inklusiv) oder `null`.
- `excludedDates` enthält Startdaten einzelner Vorkommen, die gelöscht oder als Einzeltermin herausgelöst wurden
- Ältere Termine ohne `recurrence` und `excludedDates` werden als einmalige Termine gelesen
- Ältere Termine mit dem früheren Feld `date` werden beim Lesen automatisch übernommen (`endDate` = `startDate`) und beim nächsten Speichern im neuen Format geschrieben
- `calendarId` ist lokal immer `'local'` und für Team-Kalender vorgesehen
- `createdAt` und `updatedAt` sind ISO-Zeitstempel, gedacht für spätere Synchronisierung

### Vorbereitung für Server-Speicherung

Der Zugriff auf Daten läuft ausschließlich über die Schnittstellen `EventRepository` und `ColorRepository` im Feature `storage`. Welche Umsetzung genutzt wird, entscheidet der `StorageProvider` in `App.tsx`:

```tsx
<StorageProvider>
```

Standard ist `{ mode: 'local' }`. Für die Version mit Anmeldung ist der Umstieg so vorgesehen:

```tsx
<StorageProvider config={{ mode: 'remote', baseUrl: '/api', getAccessToken }}>
```

`RemoteEventRepository` ist dafür bereits angelegt und erwartet eine REST-API mit `GET /events?from=&to=` (liefert alle Termine, die den Zeitraum überschneiden, also `startDate <= to` und `endDate >= from`, sowie alle Serien, die im Zeitraum mindestens ein Vorkommen haben; die Serien werden unverändert geliefert und im Browser aufgefächert), `POST /events`, `PUT /events/:id` und `DELETE /events/:id`. **Es wird derzeit nicht verwendet und ist nicht gegen einen echten Server getestet.** Eigene Farben werden auch im Remote-Modus vorerst lokal gespeichert.

---

## Projektstruktur

```
src/
├─ App.tsx                     StorageProvider + Kalender
├─ main.tsx                    Einstiegspunkt
├─ assets/
│  ├─ css/                     Styles, gebündelt über index.css
│  └─ imgs/
├─ components/
│  └─ Modal.tsx                Allgemeines Fenster (<dialog>), featureübergreifend
├─ utils/
│  ├─ color.ts                 Hex-Farben, lesbare Schriftfarbe
│  ├─ date.ts                  Datums- und Zeitfunktionen
│  ├─ error.ts                 Fehlermeldungen
│  ├─ event.ts                 Termin-Typen, Standardfarben, Validierung, Serien-Aktionen
│  └─ recurrence.ts            Wiederholungsregeln, Berechnung der Vorkommen
└─ features/
   ├─ calendar/                Anzeige der Wochenansicht
   │  ├─ components/
   │  ├─ constants/
   │  ├─ hooks/
   │  ├─ types/
   │  └─ utils/                Aufteilung mehrtägiger Termine, Berechnung überlappender Termine
   ├─ events/                  Termine anlegen, bearbeiten, löschen
   │  ├─ components/           EventModal, DeleteEventModal, ColorPicker, RecurrenceFields, RecurrenceScopeModal
   │  ├─ constants/
   │  ├─ hooks/                useEvents, useCustomColors
   │  └─ types/
   ├─ storage/                 Datenspeicherung
   │  ├─ context/              StorageContext, StorageProvider
   │  ├─ hooks/                useStorage, useEventRepository, useColorRepository
   │  ├─ repositories/         Local- und Remote-Umsetzungen
   │  └─ types/
   ├─ authorization/           noch leer
   └─ teams/                   noch leer
```

### Regeln

- Jedes Feature ist nach `components`, `hooks`, `types`, `utils`, `constants` usw. aufgeteilt.
- Von außen wird ein Feature nur über seine `index.ts` importiert.
- `calendar` zeigt nur an und kennt die Speicherung nicht. `events` enthält die Termin-Logik, `storage` die Persistenz.
- Typen, die zwischen Features geteilt werden, liegen in `utils/`. Props-Typen bleiben bei ihrer Komponente.

---

## Bekannte Einschränkungen

- Nur localStorage, keine Synchronisierung zwischen Geräten oder Browsern
- Keine Ganztagstermine und keine eigene Leiste für mehrtägige Termine oberhalb des Rasters
- Bei Serien fehlt noch „Dieser und alle folgenden Termine“, ebenso Regeln wie „jeden 2. Dienstag im Monat“ oder „endet nach X Terminen“
- Ein herausgelöster Einzeltermin ist danach unabhängig von der Serie. Wird die Serie gelöscht, bleibt er bestehen.
- Eigene Farben lassen sich noch nicht wieder entfernen
- Nur Wochenansicht, keine Monats- oder Tagesansicht
- Datums- und Zeitfelder zeigen das Format der Browser- bzw. Systemsprache

## Nächste Schritte

- [ ] Anmeldung und Registrierung (`features/authorization`)
- [ ] Server-Speicherung über `RemoteEventRepository` aktivieren
- [ ] Team-Modus mit Einladung per E-Mail (`features/teams`)
- [ ] Eigene Farben entfernen
- [ ] Schalter für Hell- und Dunkelmodus in der Oberfläche
