<<<<<<< HEAD
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
- Felder: Titel, Datum, Beginn, Ende, Beschreibung, Farbe
- Eingaben werden geprüft, zum Beispiel Pflichttitel und Ende nach Beginn
- Wird ein Termin in eine andere Woche verschoben, springt der Kalender nach dem Speichern dorthin

### Darstellung von Terminen

- Position und Höhe entsprechen exakt Uhrzeit und Dauer
- **Überlappende Termine** stehen nebeneinander und teilen sich die Spaltenbreite, zum Beispiel 2 Termine je 50 % und 3 Termine je 33 %. Die Tagesspalten behalten ihre Breite.
- Kurze Termine werden kompakter dargestellt, ab 90 Minuten wird zusätzlich die Uhrzeit angezeigt

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
  date: string
  start: string
  end: string
  description: string
  color: 'blue' | 'red' | 'green' | 'yellow' | `#${string}`
  createdAt: string
  updatedAt: string
}
```

- `date` im Format `JJJJ-MM-TT`, `start` und `end` im Format `HH:MM`
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

`RemoteEventRepository` ist dafür bereits angelegt und erwartet eine REST-API mit `GET /events?from=&to=`, `POST /events`, `PUT /events/:id` und `DELETE /events/:id`. **Es wird derzeit nicht verwendet und ist nicht gegen einen echten Server getestet.** Eigene Farben werden auch im Remote-Modus vorerst lokal gespeichert.

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
│  └─ event.ts                 Termin-Typen, Standardfarben, Validierung
└─ features/
   ├─ calendar/                Anzeige der Wochenansicht
   │  ├─ components/
   │  ├─ constants/
   │  ├─ hooks/
   │  ├─ types/
   │  └─ utils/                Berechnung überlappender Termine
   ├─ events/                  Termine anlegen, bearbeiten, löschen
   │  ├─ components/           EventModal, DeleteEventModal, ColorPicker
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
- Termine müssen am selben Tag enden, an dem sie beginnen. Termine über Mitternacht und mehrtägige Termine gehen noch nicht.
- Keine Ganztagstermine und keine wiederkehrenden Termine
- Eigene Farben lassen sich noch nicht wieder entfernen
- Nur Wochenansicht, keine Monats- oder Tagesansicht
- Datums- und Zeitfelder zeigen das Format der Browser- bzw. Systemsprache

## Nächste Schritte

- [ ] Anmeldung und Registrierung (`features/authorization`)
- [ ] Server-Speicherung über `RemoteEventRepository` aktivieren
- [ ] Team-Modus mit Einladung per E-Mail (`features/teams`)
- [ ] Eigene Farben entfernen
- [ ] Schalter für Hell- und Dunkelmodus in der Oberfläche
=======
# Calendar
 Calendar
>>>>>>> dd5120cb0dcc96d39a7255a5c5adaa8dc655fe57
