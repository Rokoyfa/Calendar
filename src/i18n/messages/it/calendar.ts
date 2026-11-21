import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Vista',
  day: { label: 'Giorno', previous: 'Giorno precedente', next: 'Giorno successivo' },
  week: { label: 'Settimana', previous: 'Settimana precedente', next: 'Settimana successiva' },
  month: { label: 'Mese', previous: 'Mese precedente', next: 'Mese successivo' },
  year: { label: 'Anno', previous: 'Anno precedente', next: 'Anno successivo' },
  agenda: {
    label: 'Agenda',
    previous: '30 giorni precedenti',
    next: '30 giorni successivi',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Tutto il giorno',
    empty: 'Nessun evento in questi 30 giorni.',
  },
  weekNumber: (week) => `Sett. ${week}`,
  weekNumberLong: (week) => `Settimana ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Oggi',
  newEvent: 'Nuovo evento',
  now: (time) => `Adesso: ${time}`,
  ownResponse: (status) => `La tua risposta: ${status}`,
  newEventAt: (day, time) => `Nuovo evento: ${day}, ${time}`,
  todayMark: 'oggi',
  openDay: (date) => `Apri ${date}`,
  moreEvents: (count) => `altri ${count}`,
  moreLinks: (count) => `+${count} altri link`,
  holiday: (name) => `Festività: ${name}`,
  fromCalendar: (name) => `Dal calendario «${name}»`,
  sharedEventNotice: (source) => `${source}. Tutti i membri vedono le modifiche.`,
  dismiss: 'Chiudi',
  undo: {
    action: 'Annulla',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `«${title}» eliminato`,
    moved: (title) => `«${title}» spostato`,
  },
  filter: {
    open: 'Filtra per categoria',
    openActive: 'Filtra per categoria (attivo)',
    title: 'Filtra per categoria',
    uncategorized: 'Senza categoria',
    reset: 'Mostra tutto',
  },
  search: {
    open: 'Cerca',
    title: 'Cerca eventi',
    placeholder: 'Titolo, luogo o descrizione',
    hint: 'Digita almeno 2 caratteri.',
    empty: 'Nessun evento trovato.',
    searching: 'Ricerca …',
  },
}
