import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Powiadomienia',
  openUnread: (count) => `Powiadomienia, nieprzeczytane: ${count}`,
  title: 'Powiadomienia',
  empty: 'Brak powiadomień.',
  markAllRead: 'Oznacz wszystkie jako przeczytane',
  remove: 'Usuń powiadomienie',
  loadMore: 'Pokaż starsze',
  someone: 'Ktoś',
  kinds: {
    teamInvitation: (actor, team) => `${actor}: zaproszenie do kalendarza „${team}”`,
    eventInvitation: (actor, title) => `${actor}: zaproszenie na „${title}”`,
    eventChanged: (actor, title) => `${actor}: zmiana „${title}”`,
    eventCanceled: (actor, title) => `${actor}: odwołanie „${title}”`,
    attendeeResponse: (actor, title) => `${actor}: odpowiedź na „${title}”`,
    chatMessage: (actor, title) => `${actor}: nowa wiadomość o „${title}”`,
    reminder: (title) => `Przypomnienie: „${title}”`,
    bookingCreated: (title) => `Nowa rezerwacja: „${title}”`,
    bookingCanceled: (title) => `Rezerwacja odwołana: „${title}”`,
  },
}
