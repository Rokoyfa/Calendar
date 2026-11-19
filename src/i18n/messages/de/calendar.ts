import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Ansicht',
  day: { label: 'Tag', previous: 'Vorheriger Tag', next: 'Nächster Tag' },
  week: { label: 'Woche', previous: 'Vorherige Woche', next: 'Nächste Woche' },
  month: { label: 'Monat', previous: 'Vorheriger Monat', next: 'Nächster Monat' },
  year: { label: 'Jahr', previous: 'Vorheriges Jahr', next: 'Nächstes Jahr' },
  agenda: {
    label: 'Agenda',
    previous: 'Vorherige 30 Tage',
    next: 'Nächste 30 Tage',
    range: (from: string, to: string) => `${from} – ${to}`,
    allDay: 'Ganztägig',
    empty: 'Keine Termine in diesen 30 Tagen.',
  },
  weekNumber: (week) => `KW ${week}`,
  weekNumberLong: (week) => `Kalenderwoche ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Heute',
  newEvent: 'Neuer Termin',
  now: (time) => `Jetzt: ${time}`,
  ownResponse: (status: string) => `Deine Antwort: ${status}`,
  newEventAt: (day: string, time: string) => `Neuer Termin: ${day}, ${time}`,
  todayMark: 'heute',
  openDay: (date) => `${date} öffnen`,
  moreEvents: (count) => `+${count} weitere`,
  moreLinks: (count) => `+${count} weitere Links`,
  holiday: (name) => `Feiertag: ${name}`,
  fromCalendar: (name) => `Aus dem Kalender „${name}“`,
  sharedEventNotice: (source) => `${source}. Änderungen sehen alle Mitglieder.`,
  dismiss: 'Schließen',
  undo: {
    action: 'Rückgängig',
    ctrlZ: 'Strg+Z',
    deleted: (title) => `„${title}“ gelöscht`,
    moved: (title) => `„${title}“ verschoben`,
  },
  filter: {
    open: 'Nach Kategorie filtern',
    openActive: 'Nach Kategorie filtern (aktiv)',
    title: 'Nach Kategorie filtern',
    uncategorized: 'Ohne Kategorie',
    reset: 'Alle anzeigen',
  },
  search: {
    open: 'Suchen',
    title: 'Termine suchen',
    placeholder: 'Titel, Ort oder Beschreibung',
    hint: 'Mindestens 2 Zeichen eingeben.',
    empty: 'Keine Termine gefunden.',
    searching: 'Suche läuft …',
  },
}
