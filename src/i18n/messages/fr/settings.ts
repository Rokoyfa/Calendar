import type { Messages } from '../types.ts'

export const settings: Messages['settings'] = {
  tabsLabel: 'Sections des paramètres',
  tabs: {
    calendars: 'Calendriers',
    invitations: 'Invitations',
    appearance: 'Apparence',
    account: 'Compte',
    notifications: 'Notifications',
    data: 'Données',
    security: 'Sécurité',
    connections: 'Connexions',
  },
  dataExport: {
    title: 'Vos données',
    accountDescription:
      'Téléchargez tout ce qui est enregistré pour votre compte\u00a0: profil, paramètres, couleurs, adhésions, vos événements, réponses, messages de discussion et les informations sur vos pièces jointes. Le fichier est au format JSON.',
    localDescription:
      'Téléchargez tous les événements et paramètres enregistrés par ce navigateur. Le fichier est au format JSON.',
    download: 'Télécharger les données',
  },
  languageTitle: 'Langue et région',
  languageDescription: 'Définit la langue, les formats de date et d’heure et le premier jour de la semaine.',
  languageLabel: 'Langue',
  languageAuto: 'Automatique (navigateur)',
  timeZoneTitle: 'Fuseau horaire',
  timeZoneDescription:
    'Les événements sont affichés dans ce fuseau horaire, qui est aussi présélectionné pour les nouveaux événements.',
  timeZoneLabel: 'Fuseau horaire',
  timeZoneAuto: (zone) => `Automatique\u00a0: ${zone} (recommandé)`,
  holidaysTitle: 'Jours fériés',
  holidaysDescription: 'Affiche les jours fériés dans le calendrier. Données\u00a0: date-holidays (CC BY-SA 4.0).',
  holidaysCountry: 'Pays',
  holidaysRegion: 'Région',
  holidaysAuto: (name) => `Automatique\u00a0: ${name} (recommandé)`,
  holidaysOff: 'Aucun jour férié',
  holidaysWholeCountry: 'Tout le pays',
  notifications: {
    title: 'E-mails sur les événements',
    description: 'E-mails à ton adresse confirmée. Les rappels par e-mail arrivent même si le calendrier est fermé.',
    unverified: 'Confirme ton adresse e-mail pour recevoir des e-mails.',
    emailInvites: 'Quand quelqu’un m’invite à un événement',
    emailChanges: 'Quand un événement auquel je suis invité change ou est annulé',
    emailReminders: 'Rappels par e-mail',
    emailChat: 'Nouveaux messages dans la discussion des événements auxquels je suis invité',
  },
  themeTitle: 'Thème',
  themeLabel: 'Clair ou sombre',
  startViewTitle: 'Vue de départ',
  startViewDescription: 'Le calendrier s’ouvre dans cette vue.',
  desktop: 'Ordinateur et tablette',
  mobile: 'Téléphone',
}
