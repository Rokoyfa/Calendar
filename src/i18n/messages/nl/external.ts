import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Geabonneerde agenda’s',
  description:
    'Toon agenda’s van andere diensten naast je eigen agenda’s, bijvoorbeeld feestdagen, schoolvakanties of een werkagenda. Plak het iCal-adres (.ics) dat de dienst je geeft. Deze agenda’s zijn alleen-lezen.',
  empty: 'Je bent nog op geen enkele agenda geabonneerd.',
  addTitle: 'Abonneren op een agenda',
  url: 'Agenda-adres (iCal)',
  urlHint:
    'Begint met https:// of webcal://. Het volledige adres wordt daarna niet meer getoond, omdat het een privésleutel kan bevatten.',
  urlInvalid: 'Voer een adres in dat begint met https:// of webcal://.',
  name: 'Naam',
  nameRequired: 'Voer een naam in.',
  add: 'Abonneren',
  adding: 'Agenda controleren …',
  added: 'De agenda is toegevoegd.',
  show: 'Tonen in de agenda',
  readOnly: 'Alleen-lezen',
  edit: 'Bewerken',
  remove: 'Abonnement opzeggen',
  removing: 'Opzeggen …',
  removeTitle: 'Abonnement op agenda opzeggen',
  removeMessage: (name) => `“${name}” niet meer tonen? Je kunt je altijd opnieuw abonneren.`,
  updated: (time) => `Bijgewerkt: ${time}`,
  limitReached: (max) => `Je kunt je op maximaal ${max} agenda’s abonneren.`,
  eventNotice: (name) => `Uit de geabonneerde agenda “${name}”. Die kun je alleen daar wijzigen.`,
}
