import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Vue',
  day: { label: 'Jour', previous: 'Jour précédent', next: 'Jour suivant' },
  week: { label: 'Semaine', previous: 'Semaine précédente', next: 'Semaine suivante' },
  month: { label: 'Mois', previous: 'Mois précédent', next: 'Mois suivant' },
  year: { label: 'Année', previous: 'Année précédente', next: 'Année suivante' },
  agenda: {
    label: 'Agenda',
    previous: '30 jours précédents',
    next: '30 jours suivants',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Toute la journée',
    empty: 'Aucun événement pendant ces 30 jours.',
  },
  weekNumber: (week) => `S. ${week}`,
  weekNumberLong: (week) => `Semaine ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Aujourd’hui',
  newEvent: 'Nouvel événement',
  now: (time) => `Maintenant\u00a0: ${time}`,
  ownResponse: (status) => `Votre réponse\u00a0: ${status}`,
  newEventAt: (day, time) => `Nouvel événement\u00a0: ${day}, ${time}`,
  todayMark: 'aujourd’hui',
  openDay: (date) => `Ouvrir le ${date}`,
  moreEvents: (count) => `+${count} de plus`,
  moreLinks: (count) => `+${count} autres liens`,
  holiday: (name) => `Jour férié\u00a0: ${name}`,
  fromCalendar: (name) => `Du calendrier «\u00a0${name}\u00a0»`,
  sharedEventNotice: (source) => `${source}. Tous les membres voient les modifications.`,
  dismiss: 'Fermer',
  undo: {
    action: 'Annuler',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `«\u00a0${title}\u00a0» supprimé`,
    moved: (title) => `«\u00a0${title}\u00a0» déplacé`,
  },
  filter: {
    open: 'Filtrer par catégorie',
    openActive: 'Filtrer par catégorie (actif)',
    title: 'Filtrer par catégorie',
    uncategorized: 'Sans catégorie',
    reset: 'Tout afficher',
  },
  search: {
    open: 'Rechercher',
    title: 'Rechercher des événements',
    placeholder: 'Titre, lieu ou description',
    hint: 'Saisissez au moins 2 caractères.',
    empty: 'Aucun événement trouvé.',
    searching: 'Recherche …',
  },
  print: {
    open: 'Imprimer ou enregistrer en PDF',
    empty: 'Aucun événement sur cette période.',
  },
}
