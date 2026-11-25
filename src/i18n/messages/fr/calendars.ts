import type { Messages } from '../types.ts'

export const calendars: Messages['calendars'] = {
  personalName: 'Personnel',
  roles: {
    owner: 'Propriétaire',
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    editor: 'Éditeur',
    member: 'Membre',
    contributor: 'Contributeur',
    viewer: 'Lecteur',
  },
  roleDescriptions: {
    owner: 'Dirige le calendrier et a toujours tous les droits.',
    admin: 'Gère les calendriers, les membres et tous les événements. Ne peut pas supprimer le calendrier.',
    manager: 'Gère le calendrier et tous les événements et invite de nouveaux membres.',
    editor: 'Crée des événements, modifie et supprime tous les événements.',
    member: 'Crée des événements, modifie et supprime les siens.',
    contributor: 'Crée des événements et modifie les siens, mais ne supprime rien.',
    viewer: 'Voit le calendrier mais ne modifie rien.',
  },
  roleOverview: 'Ce que chaque rôle peut faire',
  roleHint: (role, description) => `${role}\u00a0: ${description}`,
  kind: {
    personal: 'Calendrier personnel',
    team: 'Calendrier d’équipe',
    teamWithName: (team) => `Calendrier d’équipe · ${team}`,
  },
  indicator: {
    onlyYou: 'Rien que pour vous',
    shared: 'Partagé avec vous',
    team: (role) => `Équipe · ${role}`,
    current: (name) => `Calendrier actuel\u00a0: ${name}`,
  },
  switcher: {
    open: 'Changer de calendrier',
    title: 'Changer de calendrier',
    personal: 'Personnel',
    teams: 'Équipes',
    shared: 'Partagés avec vous',
    active: 'Actif',
    openInvitations: (count) =>
      count === 1 ? 'Vous avez une invitation en attente.' : `Vous avez ${count} invitations en attente.`,
    view: 'Afficher',
    noTeams: 'Vous ne faites encore partie d’aucune équipe. Créez un calendrier ou rejoignez-en un via une invitation.',
    newCalendar: 'Nouveau calendrier',
  },
  invitations: {
    title: 'Invitations',
    description:
      'Vous avez été invité à ces calendriers. Une fois acceptés, ils apparaissent sous Calendriers et dans «\u00a0Changer de calendrier\u00a0».',
    empty: 'Aucune invitation en attente. Lorsque quelqu’un vous invite à un calendrier, l’invitation apparaît ici.',
    invitedBy: (name) => `${name} vous invite`,
    invited: 'Vous êtes invité',
    validUntil: (date) => `valable jusqu’au ${date}`,
    decline: 'Refuser',
    declining: 'Refus …',
    accept: 'Accepter',
    accepting: 'Acceptation …',
  },
  list: {
    title: 'Calendriers',
    description:
      'Tous les calendriers auxquels vous avez accès, avec votre rôle. Pour les calendriers d’équipe, vous choisissez si leurs événements apparaissent aussi dans votre calendrier personnel. Vous pouvez les quitter, sauf si vous en êtes le propriétaire. Il faut alors d’abord transférer la propriété.',
    settingsFor: (name) => `Paramètres de ${name}`,
    personalHint: 'Votre propre calendrier. Il ne peut être ni quitté ni supprimé.',
    showInPersonal: 'Afficher aussi les événements dans le calendrier personnel',
    leave: 'Quitter le calendrier',
    ownerCannotLeave:
      'En tant que propriétaire, vous ne pouvez quitter le calendrier qu’après avoir transféré la propriété.',
    noTeamCalendars: 'Pas encore de calendrier d’équipe. Créez-en un ou rejoignez-en un via une invitation.',
    create: 'Créer un calendrier',
  },
  leave: {
    title: 'Quitter le calendrier\u202f?',
    confirm: 'Quitter',
    pending: 'Départ …',
    message: (team) =>
      `Vous quittez l’équipe «\u00a0${team}\u00a0» et ne verrez plus son calendrier. Vous ne pourrez revenir que via une nouvelle invitation.`,
  },
  create: {
    title: 'Nouveau calendrier',
    steps: [
      {
        label: 'Nom',
        title: 'Comment s’appelle le calendrier\u202f?',
        hint: 'Tous les membres voient le nom et la description.',
      },
      {
        label: 'Couleur',
        title: 'Quelle couleur doit-il avoir\u202f?',
        hint: 'Les nouveaux événements de ce calendrier commencent avec cette couleur.',
      },
      {
        label: 'Membres',
        title: 'Qui voulez-vous inviter\u202f?',
        hint: 'Les invités reçoivent un e-mail et voient le calendrier dès qu’ils acceptent.',
      },
      {
        label: 'Vérification',
        title: 'Tout est correct\u202f?',
        hint: 'Vous êtes le propriétaire et pouvez tout modifier plus tard.',
      },
    ],
    stepCount: (step, total) => `Étape ${step} sur ${total}`,
    next: 'Suivant',
    pending: 'Création …',
    submit: 'Créer le calendrier',
  },
  details: {
    name: 'Nom',
    namePlaceholder: 'p. ex. Famille, club de foot, projet',
    description: 'Description',
    descriptionOptional: 'Description (facultatif)',
    descriptionPlaceholder: 'À quoi sert ce calendrier\u202f?',
    yourRole: 'Votre rôle',
    invitations: 'Invitations',
    none: 'Aucune',
  },
  invite: {
    email: 'Adresse e-mail',
    role: 'Rôle',
    add: 'Ajouter',
    nobodyYet: 'Personne n’a encore été invité. Vous pourrez aussi le faire plus tard.',
    remove: (email) => `Retirer ${email}`,
  },
  validation: {
    nameRequired: 'Veuillez saisir un nom.',
    nameTooLong: (max) => `Le nom peut comporter au maximum ${max} caractères.`,
    tooManyInvitations: (max) => `Au maximum ${max} invitations à la fois.`,
    selfInvite: 'Vous êtes automatiquement propriétaire et n’avez pas besoin de vous inviter.',
    alreadyInvited: 'Cette adresse a déjà été invitée.',
    alreadyMember: 'Cette personne est déjà membre.',
  },
  settings: {
    title: 'Paramètres du calendrier',
    pageTitle: (name) => `${name} · Paramètres`,
    notFound: 'Ce calendrier n’existe pas ou vous n’y avez plus accès.',
    tabsLabel: 'Sections des paramètres du calendrier',
    withCount: (label, count) => (count > 0 ? `${label} (${count})` : label),
    tabs: {
      general: 'Général',
      members: 'Membres',
      invitations: 'Invitations',
      danger: 'Zone de danger',
      booking: 'Pages de réservation',
      sharing: 'Partage',
      exchange: 'Import et export',
      trash: 'Corbeille',
    },
    displayTitle: 'Affichage',
    displayDescription: 'S’applique uniquement à vous. Les autres membres règlent cela eux-mêmes.',
    personalTitle: 'Calendrier personnel',
    personalHint:
      'Vous seul voyez ce calendrier. Il ne peut être ni quitté ni supprimé. Vous affichez ou masquez les événements des calendriers d’équipe dans leurs paramètres.',
  },
  general: {
    title: 'Général',
    teamDescription:
      'Les propriétaires, administrateurs et gestionnaires modifient le nom et la couleur. Les propriétaires et administrateurs modifient la description.',
    personalDescription: 'Nom et couleur de votre calendrier personnel. Vous seul le voyez.',
    pending: 'Enregistrement …',
  },
  members: {
    title: 'Membres',
    description:
      'Toutes les personnes qui voient ce calendrier. Les propriétaires et administrateurs peuvent modifier les rôles et retirer des membres, mais uniquement pour les rôles inférieurs au leur.',
    you: ' (vous)',
    roleOf: (name) => `Rôle de ${name}`,
    remove: 'Retirer',
    removeTitle: 'Retirer le membre\u202f?',
    removing: 'Retrait …',
    removeMessage: (name, calendar) =>
      `${name} ne verra plus «\u00a0${calendar}\u00a0». Un retour n’est possible que via une nouvelle invitation.`,
  },
  teamInvitations: {
    title: 'Invitations',
    description:
      'Invitez de nouveaux membres par e-mail. Vous ne pouvez attribuer que des rôles inférieurs au vôtre. Une invitation est valable 7 jours.',
    revoke: 'Retirer',
    revoking: 'Retrait …',
    submit: 'Inviter',
    sending: 'Envoi …',
    sent: (email) => `Invitation envoyée à ${email}.`,
    none: 'Aucune invitation en attente.',
  },
  danger: {
    title: 'Zone de danger',
    transferHint:
      'Un autre membre devient propriétaire et vous devenez administrateur. Vous ne récupérez le rôle que si le nouveau propriétaire vous le rend.',
    transferUnavailable:
      'Pour transférer la propriété, l’équipe a besoin d’un autre membre qui n’est pas encore propriétaire.',
    transfer: 'Transférer la propriété',
    lastOwnerHint:
      'En tant que seul propriétaire, vous ne pouvez pas partir. Transférez d’abord la propriété ou supprimez l’équipe.',
    leaveHint: 'Vous ne verrez plus le calendrier. Vous ne pourrez revenir que via une nouvelle invitation.',
    deleteHint: (team) =>
      `Supprime l’équipe «\u00a0${team}\u00a0» avec tous les calendriers, événements et invitations, pour tous les membres.`,
    deleteTeam: 'Supprimer l’équipe',
    transferConfirmTitle: 'Vraiment transférer la propriété\u202f?',
    transferConfirm: 'Transférer définitivement',
    transferring: 'Transfert …',
    transferMessage: (name, email, team, role) =>
      `${name} (${email}) devient propriétaire de «\u00a0${team}\u00a0» et obtient tous les droits, y compris la suppression de l’équipe. Vous devenez ${role} et ne pourrez plus supprimer l’équipe ni reprendre vous-même la propriété.`,
    deleteTitle: 'Supprimer l’équipe\u202f?',
    deleteConfirm: 'Supprimer définitivement',
    deleting: 'Suppression …',
    deleteMessage: (team, count) =>
      `«\u00a0${team}\u00a0» sera supprimée avec tous les calendriers, événements et invitations, également pour les ${count} membres. Cette action est irréversible.`,
  },
  categories: {
    title: 'Catégories',
    description: 'Classez les événements de ce calendrier par catégories et filtrez les vues.',
    empty: 'Aucune catégorie pour le moment.',
    nameLabel: 'Nom de la catégorie',
    newLabel: 'Nouvelle catégorie',
    add: 'Ajouter',
    rename: 'Renommer',
    remove: (name) => `Supprimer la catégorie ${name}`,
  },
  trash: {
    title: 'Corbeille',
    description:
      'Les événements supprimés restent ici 30 jours. Ensuite, ils sont supprimés définitivement, avec leurs pièces jointes et leur discussion.',
    empty: 'La corbeille est vide.',
    withDetached: (count) =>
      count === 1 ? 'avec 1 événement modifié à part' : `avec ${count} événements modifiés à part`,
    deletedBy: (name, date) => `Supprimé par ${name} le ${date}`,
    deletedAt: (date) => `Supprimé le ${date}`,
    expires: (date) => `supprimé définitivement le ${date}`,
    search: 'Rechercher dans la corbeille',
    searchPlaceholder: 'Titre, lieu ou auteur de la suppression',
    noResults: 'Aucune entrée correspondante.',
    showMore: (shown, total) => `Afficher plus (${shown} sur ${total})`,
    emptyAction: 'Vider la corbeille',
    emptyTitle: 'Vider la corbeille\u202f?',
    emptyConfirm: (count) =>
      `${count} entrée(s) de la corbeille seront supprimées définitivement, avec leurs pièces jointes et leur discussion. Cette action est irréversible.`,
    emptyConfirmOwn: (own, total) =>
      `${own} entrée(s) sur ${total} seront supprimées définitivement, celles que vous pouvez supprimer. Cette action est irréversible.`,
    restore: 'Restaurer',
    deleteForever: 'Supprimer définitivement',
    deleteForeverLabel: (title) => `Supprimer «\u00a0${title}\u00a0» définitivement`,
    confirmTitle: 'Supprimer définitivement\u202f?',
    confirmDelete: (title) =>
      `«\u00a0${title}\u00a0» sera supprimé définitivement, avec toutes les pièces jointes et la discussion. Cette action est irréversible.`,
  },
  share: {
    title: 'Lien public',
    description:
      'Partagez ce calendrier en lecture seule avec tout le monde, sans connexion. Les visiteurs voient le titre, l’heure, le lieu, la description, les liens et les catégories de tous les événements, mais pas les participants, les rappels ni la discussion.',
    label: 'Lien public',
    pathLabel: 'Chemin pour l’option initial-path',
    create: 'Créer un lien public',
    copy: 'Copier le lien',
    open: 'Ouvrir',
    warning:
      'Toute personne disposant de ce lien peut voir tous les événements de ce calendrier. Créer un nouveau lien désactive l’ancien.',
    renew: 'Créer un nouveau lien',
    remove: 'Arrêter le partage',
    readOnly: 'Lecture seule',
    notFound: 'Ce calendrier n’est pas partagé ou le lien a été désactivé.',
  },
  feed: {
    title: 'S’abonner',
    description:
      'Abonne-toi à ce calendrier dans Google Agenda, Outlook ou Apple Calendrier. Les modifications y apparaissent automatiquement, en général en quelques heures. L’abonnement est en lecture seule.',
    label: 'Lien d’abonnement',
    create: 'Créer un lien d’abonnement',
    copy: 'Copier le lien',
    openApp: 'Ouvrir dans l’app de calendrier',
    warning:
      'Toute personne ayant ce lien voit tous les événements de ce calendrier. Un nouveau lien désactive l’ancien.',
    renew: 'Créer un nouveau lien',
    remove: 'Arrêter l’abonnement',
  },
  ical: {
    title: 'Import et export',
    description:
      'Échangez des événements avec d’autres applications de calendrier au format iCalendar (.ics). Un nouvel import met à jour les événements déjà importés.',
    exportLabel: 'Exporter en .ics',
    exporting: 'Exportation …',
    importLabel: 'Importer un fichier .ics',
    importing: 'Importation …',
    imported: (created, updated) => `${created} ajouté(s), ${updated} mis à jour.`,
    skipped: (count) => `${count} entrée(s) illisible(s) ignorée(s).`,
    importFailed: 'Ce fichier n’est pas un fichier iCalendar valide.',
    noEvents: 'Ce calendrier ne contient encore aucun événement.',
  },
  transfer: {
    title: 'Transférer la propriété',
    search: 'Rechercher des membres',
    searchPlaceholder: 'Nom ou e-mail',
    noResults: 'Aucun membre trouvé.',
    newOwner: 'Nouveau propriétaire',
    confirm: 'Confirmer',
  },
}
