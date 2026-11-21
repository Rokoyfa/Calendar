import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Notifications',
  openUnread: (count) => `Notifications, ${count} non lues`,
  title: 'Notifications',
  empty: 'Aucune notification.',
  markAllRead: 'Tout marquer comme lu',
  remove: 'Supprimer la notification',
  loadMore: 'Afficher les plus anciennes',
  someone: 'Quelqu’un',
  kinds: {
    teamInvitation: (actor, team) => `${actor} vous a invité au calendrier «\u00a0${team}\u00a0»`,
    eventInvitation: (actor, title) => `${actor} vous a invité à «\u00a0${title}\u00a0»`,
    eventChanged: (actor, title) => `${actor} a modifié «\u00a0${title}\u00a0»`,
    eventCanceled: (actor, title) => `${actor} a annulé «\u00a0${title}\u00a0»`,
    attendeeResponse: (actor, title) => `${actor} a répondu à «\u00a0${title}\u00a0»`,
    chatMessage: (actor, title) => `${actor} a écrit à propos de «\u00a0${title}\u00a0»`,
    reminder: (title) => `Rappel\u00a0: «\u00a0${title}\u00a0»`,
  },
}
