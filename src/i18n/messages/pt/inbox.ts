import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Notificações',
  openUnread: (count) => `Notificações, ${count} não lidas`,
  title: 'Notificações',
  empty: 'Nenhuma notificação.',
  markAllRead: 'Marcar todas como lidas',
  remove: 'Remover notificação',
  loadMore: 'Mostrar anteriores',
  someone: 'Alguém',
  kinds: {
    teamInvitation: (actor, team) => `${actor} convidou você para o calendário “${team}”`,
    eventInvitation: (actor, title) => `${actor} convidou você para “${title}”`,
    eventChanged: (actor, title) => `${actor} alterou “${title}”`,
    eventCanceled: (actor, title) => `${actor} cancelou “${title}”`,
    attendeeResponse: (actor, title) => `${actor} respondeu a “${title}”`,
    chatMessage: (actor, title) => `${actor} escreveu sobre “${title}”`,
    reminder: (title) => `Lembrete: “${title}”`,
    bookingCreated: (title) => `Nova reserva: “${title}”`,
    bookingCanceled: (title) => `Reserva cancelada: “${title}”`,
    calendarShareInvitation: (actor) => `${actor} quer mostrar o calendário para você`,
    eventRequested: (actor, title) => `${actor} solicitou “${title}”`,
    eventRequestAccepted: (actor, title) => `${actor} aceitou sua solicitação “${title}”`,
    eventRequestDeclined: (actor, title) => `${actor} recusou sua solicitação “${title}”`,
    eventRequestWithdrawn: (actor, title) => `${actor} retirou a solicitação “${title}”`,
    taskAssigned: (actor, title) => `${actor} atribuiu a você a tarefa “${title}”`,
  },
}
