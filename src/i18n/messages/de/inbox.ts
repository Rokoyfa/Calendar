import type { Messages } from '../types.ts'

export const inbox: Messages['inbox'] = {
  open: 'Benachrichtigungen',
  openUnread: (count: number) => `Benachrichtigungen, ${count} ungelesen`,
  title: 'Benachrichtigungen',
  empty: 'Keine Benachrichtigungen.',
  markAllRead: 'Alle als gelesen markieren',
  remove: 'Benachrichtigung entfernen',
  loadMore: 'Ältere anzeigen',
  someone: 'Jemand',
  kinds: {
    teamInvitation: (actor: string, team: string) => `${actor} hat dich in den Kalender „${team}“ eingeladen`,
    eventInvitation: (actor: string, title: string) => `${actor} hat dich zu „${title}“ eingeladen`,
    eventChanged: (actor: string, title: string) => `${actor} hat „${title}“ geändert`,
    eventCanceled: (actor: string, title: string) => `${actor} hat „${title}“ abgesagt`,
    attendeeResponse: (actor: string, title: string) => `${actor} hat auf „${title}“ geantwortet`,
    chatMessage: (actor: string, title: string) => `${actor} hat zu „${title}“ geschrieben`,
    reminder: (title: string) => `Erinnerung: „${title}“`,
    bookingCreated: (title) => `Neue Buchung: „${title}“`,
    bookingCanceled: (title) => `Buchung abgesagt: „${title}“`,
  },
}
