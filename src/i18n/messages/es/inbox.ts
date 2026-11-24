import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Notificaciones',
  openUnread: (count) => `Notificaciones, ${count} sin leer`,
  title: 'Notificaciones',
  empty: 'No hay notificaciones.',
  markAllRead: 'Marcar todas como leídas',
  remove: 'Eliminar notificación',
  loadMore: 'Mostrar anteriores',
  someone: 'Alguien',
  kinds: {
    teamInvitation: (actor, team) => `${actor} te ha invitado al calendario «${team}»`,
    eventInvitation: (actor, title) => `${actor} te ha invitado a «${title}»`,
    eventChanged: (actor, title) => `${actor} ha modificado «${title}»`,
    eventCanceled: (actor, title) => `${actor} ha cancelado «${title}»`,
    attendeeResponse: (actor, title) => `${actor} ha respondido a «${title}»`,
    chatMessage: (actor, title) => `${actor} ha escrito sobre «${title}»`,
    reminder: (title) => `Recordatorio: «${title}»`,
    bookingCreated: (title) => `Nueva reserva: «${title}»`,
    bookingCanceled: (title) => `Reserva cancelada: «${title}»`,
    calendarShareInvitation: (actor) => `${actor} quiere mostrarte su calendario`,
    eventRequested: (actor, title) => `${actor} solicitó «${title}»`,
    eventRequestAccepted: (actor, title) => `${actor} aceptó tu solicitud «${title}»`,
    eventRequestDeclined: (actor, title) => `${actor} rechazó tu solicitud «${title}»`,
    eventRequestWithdrawn: (actor, title) => `${actor} retiró la solicitud «${title}»`,
  },
}
