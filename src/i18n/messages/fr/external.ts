import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Calendriers abonnés',
  description:
    'Affichez des calendriers d’autres services à côté des vôtres, par exemple les jours fériés, les vacances scolaires ou un calendrier professionnel. Collez l’adresse iCal (.ics) fournie par le service. Ces calendriers sont en lecture seule.',
  empty: 'Vous n’êtes encore abonné à aucun calendrier.',
  addTitle: 'S’abonner à un calendrier',
  url: 'Adresse du calendrier (iCal)',
  urlHint:
    'Commence par https:// ou webcal://. L’adresse complète n’est plus affichée ensuite, car elle peut contenir une clé privée.',
  urlInvalid: 'Veuillez saisir une adresse commençant par https:// ou webcal://.',
  name: 'Nom',
  nameRequired: 'Veuillez saisir un nom.',
  add: 'S’abonner',
  adding: 'Vérification du calendrier …',
  added: 'Le calendrier a été ajouté.',
  show: 'Afficher dans le calendrier',
  readOnly: 'Lecture seule',
  edit: 'Modifier',
  remove: 'Se désabonner',
  removing: 'Désabonnement …',
  removeTitle: 'Se désabonner du calendrier',
  removeMessage: (name) => `Ne plus afficher «\u00a0${name}\u00a0»\u202f? Vous pouvez vous réabonner à tout moment.`,
  updated: (time) => `Mis à jour\u00a0: ${time}`,
  limitReached: (max) => `Vous pouvez vous abonner à ${max} calendriers au maximum.`,
  eventNotice: (name) => `Du calendrier abonné «\u00a0${name}\u00a0». Il ne peut être modifié que là-bas.`,
}
