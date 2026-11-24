import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Notifiche',
  openUnread: (count) => `Notifiche, ${count} non lette`,
  title: 'Notifiche',
  empty: 'Nessuna notifica.',
  markAllRead: 'Segna tutte come lette',
  remove: 'Rimuovi notifica',
  loadMore: 'Mostra precedenti',
  someone: 'Qualcuno',
  kinds: {
    teamInvitation: (actor, team) => `${actor} ti ha invitato al calendario «${team}»`,
    eventInvitation: (actor, title) => `${actor} ti ha invitato a «${title}»`,
    eventChanged: (actor, title) => `${actor} ha modificato «${title}»`,
    eventCanceled: (actor, title) => `${actor} ha annullato «${title}»`,
    attendeeResponse: (actor, title) => `${actor} ha risposto a «${title}»`,
    chatMessage: (actor, title) => `${actor} ha scritto su «${title}»`,
    reminder: (title) => `Promemoria: «${title}»`,
    bookingCreated: (title) => `Nuova prenotazione: «${title}»`,
    bookingCanceled: (title) => `Prenotazione annullata: «${title}»`,
  },
}
