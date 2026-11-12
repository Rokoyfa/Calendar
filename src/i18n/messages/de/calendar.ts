import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Ansicht',
  day: { label: 'Tag', previous: 'Vorheriger Tag', next: 'Nächster Tag' },
  week: { label: 'Woche', previous: 'Vorherige Woche', next: 'Nächste Woche' },
  month: { label: 'Monat', previous: 'Vorheriger Monat', next: 'Nächster Monat' },
  year: { label: 'Jahr', previous: 'Vorheriges Jahr', next: 'Nächstes Jahr' },
  weekNumber: (week) => `KW ${week}`,
  weekNumberLong: (week) => `Kalenderwoche ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Heute',
  newEvent: 'Neuer Termin',
  now: (time) => `Jetzt: ${time}`,
  openDay: (date) => `${date} öffnen`,
  moreEvents: (count) => `+${count} weitere`,
  moreLinks: (count) => `+${count} weitere Links`,
  fromCalendar: (name) => `Aus dem Kalender „${name}“`,
  sharedEventNotice: (source) => `${source}. Änderungen sehen alle Mitglieder.`,
  dismiss: 'Schließen',
  search: {
    open: 'Suchen',
    title: 'Termine suchen',
    placeholder: 'Titel, Ort oder Beschreibung',
    hint: 'Mindestens 2 Zeichen eingeben.',
    empty: 'Keine Termine gefunden.',
    searching: 'Suche läuft …',
  },
}
