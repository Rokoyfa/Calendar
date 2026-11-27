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
  tasks: { label: 'Tâches' },
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
  menu: {
    open: 'Ouvrir le menu',
    openMarked: 'Ouvrir le menu (filtre actif)',
    title: 'Menu',
    active: 'actif',
    calendarSettings: 'Paramètres du calendrier',
    calendarGroup: (name) => `Calendrier: ${name}`,
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
  jump: {
    open: 'Aller à une date',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
  },
  quickCreate: {
    title: 'Ajouter un titre',
    untitled: '(Sans titre)',
    more: 'Plus d’options',
    inCalendar: (name) => `Dans ${name}`,
  },
  peek: {
    edit: 'Modifier',
    details: 'Détails',
    attendees: (count) => (count === 1 ? '1\u00a0participant' : `${count}\u00a0participants`),
  },
  shortcutHelp: {
    title: 'Raccourcis clavier',
    navigation: 'Navigation',
    actions: 'Actions',
    previousNext: 'Période précédente ou suivante',
    moveFocus: 'Passer d’un créneau ou d’un événement à l’autre',
    undo: 'Annuler',
  },
  tour: {
    label: 'Visite guidée',
    count: (current, total) => `Étape ${current} sur ${total}`,
    back: 'Retour',
    next: 'Suivant',
    close: 'Terminer',
    done: 'C’est parti',
    steps: {
      grid: {
        title: 'Créer des événements',
        text: 'Cliquez sur une heure pour créer directement un événement, ou faites glisser pour choisir la durée. Cliquez sur un événement pour voir ses détails.',
        touch:
          'Touchez une heure pour créer un événement\u00a0; maintenez et faites glisser pour choisir la durée. Touchez un événement pour voir ses détails.',
      },
      create: {
        title: 'Toutes les options',
        text: 'Le bouton plus ouvre le formulaire complet avec répétition, rappels, lieu et plus encore.',
        tasks: 'En haut du formulaire, vous pouvez choisir une tâche au lieu d’un événement.',
      },
      navigate: {
        title: 'Naviguer dans le temps',
        text: 'Les flèches reculent ou avancent d’une période, «\u00a0Aujourd’hui\u00a0» vous ramène à aujourd’hui.',
        swipe: 'Vous pouvez aussi balayer vers la gauche ou la droite.',
        keys: 'Au clavier\u00a0: ← → et T.',
      },
      jump: {
        title: 'Aller à une date',
        text: 'Cliquez sur le titre pour ouvrir un calendrier mensuel et aller à n’importe quelle date.',
      },
      switch: {
        title: 'Changer de calendrier',
        text: 'Vous voyez ici quel calendrier est actif. Cliquez dessus pour en changer. Avec les cases à cocher, les calendriers d’équipe et partagés s’affichent aussi dans votre calendrier personnel.',
      },
      views: {
        title: 'Vues',
        text: 'Passez du jour à la semaine, au mois, à l’année ou à l’agenda.',
        keys: 'Appuyez sur ? pour voir tous les raccourcis clavier.',
      },
      tasks: {
        title: 'Tâches',
        text: 'Vos tâches sont ici, en liste ou en tableau. Une tâche a une échéance, un statut, une priorité et une liste de contrôle. Les tâches à échéance apparaissent aussi dans les vues jour et semaine, en haut de leur jour.',
      },
      planner: {
        title: 'Planifier les tâches automatiquement',
        text: 'Indiquez la charge estimée d’une tâche et choisissez «\u00a0Planifier\u00a0» dans la tâche. Le planificateur trouve du temps libre avant l’échéance, laisse de courtes pauses entre les événements et vous montre les créneaux en aperçu avant de les créer.',
      },
      menu: {
        title: 'Menu',
        text: 'Le menu contient la recherche, les filtres et les raccourcis clavier, ainsi que tout ce qui concerne le calendrier actif, comme ses paramètres, le partage, l’import et l’export et la corbeille.',
      },
      notifications: {
        title: 'Notifications',
        text: 'Les invitations, les réponses, les modifications faites par d’autres et les rappels arrivent ici.',
      },
      account: {
        title: 'Votre compte',
        text: 'Ouvrez ici vos paramètres, par exemple profil, sécurité, notifications et règles du planificateur, ou déconnectez-vous.',
      },
      signIn: {
        title: 'Se connecter',
        text: 'Avec un compte, vous utilisez votre calendrier sur tous vos appareils et pouvez partager des calendriers avec d’autres personnes.',
      },
      done: {
        title: 'Tout est prêt',
        text: 'Vous pouvez relancer cette visite à tout moment depuis le menu, sous «\u00a0Visite guidée\u00a0».',
      },
    },
  },
}
