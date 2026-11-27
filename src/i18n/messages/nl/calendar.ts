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
  tasks: { label: 'Taken' },
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
  menu: {
    open: 'Menu openen',
    openMarked: 'Menu openen (filter actief)',
    title: 'Menu',
    active: 'actief',
    calendarSettings: 'Agenda-instellingen',
    calendarGroup: (name) => `Agenda: ${name}`,
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
  jump: {
    open: 'Naar datum gaan',
    previousMonth: 'Vorige maand',
    nextMonth: 'Volgende maand',
  },
  quickCreate: {
    title: 'Titel toevoegen',
    untitled: '(Geen titel)',
    more: 'Meer opties',
    inCalendar: (name) => `In ${name}`,
  },
  peek: {
    edit: 'Bewerken',
    details: 'Details',
    attendees: (count) => (count === 1 ? '1 deelnemer' : `${count} deelnemers`),
  },
  shortcutHelp: {
    title: 'Sneltoetsen',
    navigation: 'Navigatie',
    actions: 'Acties',
    previousNext: 'Vorige of volgende periode',
    moveFocus: 'Tussen tijden of afspraken wisselen',
    undo: 'Ongedaan maken',
  },
  tour: {
    label: 'Rondleiding',
    count: (current, total) => `Stap ${current} van ${total}`,
    back: 'Terug',
    next: 'Volgende',
    close: 'Stoppen',
    done: 'Klaar',
    steps: {
      grid: {
        title: 'Afspraken toevoegen',
        text: 'Klik op een tijd om meteen een afspraak toe te voegen, of sleep om de duur te kiezen. Klik op een afspraak om de details te zien.',
        touch:
          'Tik op een tijd om een afspraak toe te voegen; houd vast en sleep om de duur te kiezen. Tik op een afspraak om de details te zien.',
      },
      create: {
        title: 'Alle opties',
        text: 'De plusknop opent het volledige formulier met herhaling, herinneringen, locatie en meer.',
        tasks: 'Boven in het formulier kun je in plaats van een afspraak een taak kiezen.',
      },
      navigate: {
        title: 'Door de tijd bladeren',
        text: 'De pijlen gaan een periode terug of vooruit, ‘Vandaag’ brengt je terug naar vandaag.',
        swipe: 'Je kunt ook naar links of rechts vegen.',
        keys: 'Met het toetsenbord: ← → en T.',
      },
      jump: {
        title: 'Naar een datum gaan',
        text: 'Klik op de titel om een maandkalender te openen en naar elke datum te gaan.',
      },
      switch: {
        title: 'Van agenda wisselen',
        text: 'Hier zie je welke agenda actief is. Klik erop om te wisselen. Met de vinkjes zie je team- en gedeelde agenda’s ook in je persoonlijke agenda.',
      },
      views: {
        title: 'Weergaven',
        text: 'Wissel tussen dag, week, maand, jaar en lijst.',
        keys: 'Druk op ? om alle sneltoetsen te zien.',
      },
      tasks: {
        title: 'Taken',
        text: 'Hier vind je je taken, als lijst of als bord. Een taak heeft een deadline, een status, een prioriteit en een checklist. Taken met een deadline zie je ook in de dag- en weekweergave, bovenaan bij hun dag.',
      },
      planner: {
        title: 'Taken automatisch inplannen',
        text: 'Geef een taak een geschatte tijdsbesteding en kies ‘Inplannen’ in de taak. De planner zoekt vrije tijd vóór de deadline, laat korte pauzes tussen afspraken en toont je de blokken eerst als voorbeeld voordat je ze toevoegt.',
      },
      menu: {
        title: 'Menu',
        text: 'In het menu vind je zoeken, filters en sneltoetsen, en alles over de actieve agenda, zoals de instellingen, delen, importeren en exporteren en de prullenbak.',
      },
      notifications: {
        title: 'Meldingen',
        text: 'Uitnodigingen, antwoorden, wijzigingen door anderen en herinneringen komen hier binnen.',
      },
      account: {
        title: 'Je account',
        text: 'Hier open je je instellingen, zoals profiel, beveiliging, meldingen en de regels voor de planner, of log je uit.',
      },
      signIn: {
        title: 'Inloggen',
        text: 'Met een account gebruik je je agenda op al je apparaten en kun je agenda’s met anderen delen.',
      },
      done: {
        title: 'Alles klaar',
        text: 'Je kunt deze rondleiding altijd opnieuw starten via het menu, onder ‘Rondleiding’.',
      },
    },
  },
}
