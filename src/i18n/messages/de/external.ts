import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Abonnierte Kalender',
  description:
    'Blende Kalender aus anderen Diensten neben deinen eigenen ein, zum Beispiel Feiertage, Schulferien oder einen Arbeitskalender. Füge die iCal-Adresse (.ics) ein, die der Dienst dir gibt. Diese Kalender sind schreibgeschützt.',
  empty: 'Du hast noch keinen Kalender abonniert.',
  addTitle: 'Kalender abonnieren',
  url: 'Kalenderadresse (iCal)',
  urlHint:
    'Beginnt mit https:// oder webcal://. Die vollständige Adresse wird danach nicht mehr angezeigt, weil sie einen privaten Schlüssel enthalten kann.',
  urlInvalid: 'Bitte gib eine Adresse mit https:// oder webcal:// ein.',
  name: 'Name',
  nameRequired: 'Bitte gib einen Namen ein.',
  add: 'Abonnieren',
  adding: 'Kalender wird geprüft …',
  added: 'Der Kalender wurde hinzugefügt.',
  show: 'Im Kalender anzeigen',
  readOnly: 'Nur lesen',
  edit: 'Bearbeiten',
  remove: 'Abo beenden',
  removing: 'Abo wird beendet …',
  removeTitle: 'Abo beenden',
  removeMessage: (name: string) => `„${name}“ nicht mehr anzeigen? Du kannst ihn jederzeit wieder abonnieren.`,
  updated: (time: string) => `Aktualisiert ${time}`,
  limitReached: (max: number) => `Du kannst höchstens ${max} Kalender abonnieren.`,
  eventNotice: (name: string) => `Aus dem abonnierten Kalender „${name}“. Er lässt sich nur dort ändern.`,
}
