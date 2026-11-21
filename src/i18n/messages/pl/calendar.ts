import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Widok',
  day: { label: 'Dzień', previous: 'Poprzedni dzień', next: 'Następny dzień' },
  week: { label: 'Tydzień', previous: 'Poprzedni tydzień', next: 'Następny tydzień' },
  month: { label: 'Miesiąc', previous: 'Poprzedni miesiąc', next: 'Następny miesiąc' },
  year: { label: 'Rok', previous: 'Poprzedni rok', next: 'Następny rok' },
  agenda: {
    label: 'Lista',
    previous: 'Poprzednie 30 dni',
    next: 'Następne 30 dni',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Cały dzień',
    empty: 'Brak wydarzeń w tych 30 dniach.',
  },
  weekNumber: (week) => `Tydz. ${week}`,
  weekNumberLong: (week) => `Tydzień ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Dziś',
  newEvent: 'Nowe wydarzenie',
  now: (time) => `Teraz: ${time}`,
  ownResponse: (status) => `Twoja odpowiedź: ${status}`,
  newEventAt: (day, time) => `Nowe wydarzenie: ${day}, ${time}`,
  todayMark: 'dzisiaj',
  openDay: (date) => `Otwórz ${date}`,
  moreEvents: (count) => `+${count} więcej`,
  moreLinks: (count) => `+${count} więcej linków`,
  holiday: (name) => `Święto: ${name}`,
  fromCalendar: (name) => `Z kalendarza „${name}”`,
  sharedEventNotice: (source) => `${source}. Wszyscy członkowie widzą zmiany.`,
  dismiss: 'Zamknij',
  undo: {
    action: 'Cofnij',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `Usunięto „${title}”`,
    moved: (title) => `Przeniesiono „${title}”`,
  },
  filter: {
    open: 'Filtruj według kategorii',
    openActive: 'Filtruj według kategorii (aktywne)',
    title: 'Filtruj według kategorii',
    uncategorized: 'Bez kategorii',
    reset: 'Pokaż wszystko',
  },
  search: {
    open: 'Szukaj',
    title: 'Szukaj wydarzeń',
    placeholder: 'Tytuł, miejsce lub opis',
    hint: 'Wpisz co najmniej 2 znaki.',
    empty: 'Nie znaleziono wydarzeń.',
    searching: 'Wyszukiwanie …',
  },
}
