import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Meldingen',
  openUnread: (count) => `Meldingen, ${count} ongelezen`,
  title: 'Meldingen',
  empty: 'Geen meldingen.',
  markAllRead: 'Alles als gelezen markeren',
  remove: 'Melding verwijderen',
  loadMore: 'Oudere tonen',
  someone: 'Iemand',
  kinds: {
    teamInvitation: (actor, team) => `${actor} heeft je uitgenodigd voor de agenda “${team}”`,
    eventInvitation: (actor, title) => `${actor} heeft je uitgenodigd voor “${title}”`,
    eventChanged: (actor, title) => `${actor} heeft “${title}” gewijzigd`,
    eventCanceled: (actor, title) => `${actor} heeft “${title}” afgezegd`,
    attendeeResponse: (actor, title) => `${actor} heeft gereageerd op “${title}”`,
    chatMessage: (actor, title) => `${actor} schreef over “${title}”`,
    reminder: (title) => `Herinnering: “${title}”`,
    bookingCreated: (title) => `Nieuwe boeking: “${title}”`,
    bookingCanceled: (title) => `Boeking geannuleerd: “${title}”`,
    calendarShareInvitation: (actor) => `${actor} wil je de eigen agenda laten zien`,
    eventRequested: (actor, title) => `${actor} heeft “${title}” aangevraagd`,
    eventRequestAccepted: (actor, title) => `${actor} heeft je verzoek “${title}” geaccepteerd`,
    eventRequestDeclined: (actor, title) => `${actor} heeft je verzoek “${title}” geweigerd`,
    eventRequestWithdrawn: (actor, title) => `${actor} heeft het verzoek “${title}” ingetrokken`,
  },
}
