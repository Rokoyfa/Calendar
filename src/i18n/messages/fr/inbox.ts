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
    bookingCreated: (title) => `Nouvelle réservation\u00a0: «\u00a0${title}\u00a0»`,
    bookingCanceled: (title) => `Réservation annulée\u00a0: «\u00a0${title}\u00a0»`,
    calendarShareInvitation: (actor) => `${actor} souhaite vous montrer son calendrier`,
    eventRequested: (actor, title) => `${actor} a demandé «\u00a0${title}\u00a0»`,
    eventRequestAccepted: (actor, title) => `${actor} a accepté votre demande «\u00a0${title}\u00a0»`,
    eventRequestDeclined: (actor, title) => `${actor} a refusé votre demande «\u00a0${title}\u00a0»`,
    eventRequestWithdrawn: (actor, title) => `${actor} a retiré la demande «\u00a0${title}\u00a0»`,
    taskAssigned: (actor, title) => `${actor} vous a attribué la tâche «\u00a0${title}\u00a0»`,
    taskDueSoon: (title) =>
      `La tâche «\u00a0${title}\u00a0» arrive bientôt à échéance et n’est pas encore entièrement planifiée`,
    taskPlanConflict: (actor, event, task) =>
      `«\u00a0${event}\u00a0» de ${actor} chevauche le temps planifié pour «\u00a0${task}\u00a0»`,
  },
}
