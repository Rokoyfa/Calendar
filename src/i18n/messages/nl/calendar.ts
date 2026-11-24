import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Weergave',
  day: { label: 'Dag', previous: 'Vorige dag', next: 'Volgende dag' },
  week: { label: 'Week', previous: 'Vorige week', next: 'Volgende week' },
  month: { label: 'Maand', previous: 'Vorige maand', next: 'Volgende maand' },
  year: { label: 'Jaar', previous: 'Vorig jaar', next: 'Volgend jaar' },
  agenda: {
    label: 'Lijst',
    previous: 'Vorige 30 dagen',
    next: 'Volgende 30 dagen',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Hele dag',
    empty: 'Geen afspraken in deze 30 dagen.',
  },
  weekNumber: (week) => `Wk ${week}`,
  weekNumberLong: (week) => `Week ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Vandaag',
  newEvent: 'Nieuwe afspraak',
  now: (time) => `Nu: ${time}`,
  ownResponse: (status) => `Jouw antwoord: ${status}`,
  newEventAt: (day, time) => `Nieuwe afspraak: ${day}, ${time}`,
  todayMark: 'vandaag',
  openDay: (date) => `${date} openen`,
  moreEvents: (count) => `nog ${count}`,
  moreLinks: (count) => `+${count} andere links`,
  holiday: (name) => `Feestdag: ${name}`,
  fromCalendar: (name) => `Uit de agenda ‘${name}’`,
  sharedEventNotice: (source) => `${source}. Alle leden zien wijzigingen.`,
  dismiss: 'Sluiten',
  undo: {
    action: 'Ongedaan maken',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `‘${title}’ verwijderd`,
    moved: (title) => `‘${title}’ verplaatst`,
  },
  filter: {
    open: 'Filteren op categorie',
    openActive: 'Filteren op categorie (actief)',
    title: 'Filteren op categorie',
    uncategorized: 'Zonder categorie',
    reset: 'Alles tonen',
  },
  search: {
    open: 'Zoeken',
    title: 'Afspraken zoeken',
    placeholder: 'Titel, locatie of beschrijving',
    hint: 'Typ minstens 2 tekens.',
    empty: 'Geen afspraken gevonden.',
    searching: 'Zoeken …',
  },
  print: {
    open: 'Afdrukken of opslaan als pdf',
    empty: 'Geen afspraken in deze periode.',
  },
}
