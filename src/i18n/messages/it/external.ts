import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Calendari iscritti',
  description:
    'Mostra calendari di altri servizi accanto ai tuoi, per esempio festività, vacanze scolastiche o un calendario di lavoro. Incolla l’indirizzo iCal (.ics) fornito dal servizio. Questi calendari sono di sola lettura.',
  empty: 'Non sei ancora iscritto a nessun calendario.',
  addTitle: 'Iscriviti a un calendario',
  url: 'Indirizzo del calendario (iCal)',
  urlHint:
    'Inizia con https:// o webcal://. L’indirizzo completo non viene più mostrato, perché può contenere una chiave privata.',
  urlInvalid: 'Inserisci un indirizzo che inizi con https:// o webcal://.',
  name: 'Nome',
  nameRequired: 'Inserisci un nome.',
  add: 'Iscriviti',
  adding: 'Verifica del calendario …',
  added: 'Il calendario è stato aggiunto.',
  show: 'Mostra nel calendario',
  readOnly: 'Sola lettura',
  edit: 'Modifica',
  remove: 'Annulla iscrizione',
  removing: 'Annullamento …',
  removeTitle: 'Annulla iscrizione al calendario',
  removeMessage: (name) => `Non mostrare più «${name}»? Puoi iscriverti di nuovo in qualsiasi momento.`,
  updated: (time) => `Aggiornato: ${time}`,
  limitReached: (max) => `Puoi iscriverti al massimo a ${max} calendari.`,
  eventNotice: (name) => `Dal calendario iscritto «${name}». Si può modificare solo lì.`,
}
