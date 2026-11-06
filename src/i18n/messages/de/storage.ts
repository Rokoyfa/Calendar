import type { Messages } from '../types.ts'

export const storage: Messages['storage'] = {
  importTitle: 'Lokale Termine übernehmen?',
  importMessage: (count) =>
    `In diesem Browser ${count === 1 ? 'ist ein Termin' : `sind ${count} Termine`} ohne Konto gespeichert. Sollen sie in dein Konto übernommen werden? Danach sind sie auf allen Geräten verfügbar und werden hier lokal entfernt.`,
  importing: 'Wird übernommen …',
  importConfirm: 'In mein Konto übernehmen',
  keepLocal: 'Nur in diesem Browser behalten',
}
