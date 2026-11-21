import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Calendarios suscritos',
  description:
    'Muestra calendarios de otros servicios junto a los tuyos, por ejemplo festivos, vacaciones escolares o un calendario de trabajo. Pega la dirección iCal (.ics) que te da el servicio. Estos calendarios son de solo lectura.',
  empty: 'Todavía no te has suscrito a ningún calendario.',
  addTitle: 'Suscribirse a un calendario',
  url: 'Dirección del calendario (iCal)',
  urlHint:
    'Empieza por https:// o webcal://. La dirección completa no se vuelve a mostrar, porque puede contener una clave privada.',
  urlInvalid: 'Introduce una dirección que empiece por https:// o webcal://.',
  name: 'Nombre',
  nameRequired: 'Introduce un nombre.',
  add: 'Suscribirse',
  adding: 'Comprobando el calendario …',
  added: 'Se ha añadido el calendario.',
  show: 'Mostrar en el calendario',
  readOnly: 'Solo lectura',
  edit: 'Editar',
  remove: 'Cancelar suscripción',
  removing: 'Cancelando suscripción …',
  removeTitle: 'Cancelar suscripción al calendario',
  removeMessage: (name) => `¿Dejar de mostrar «${name}»? Puedes volver a suscribirte en cualquier momento.`,
  updated: (time) => `Actualizado: ${time}`,
  limitReached: (max) => `Puedes suscribirte como máximo a ${max} calendarios.`,
  eventNotice: (name) => `Del calendario suscrito «${name}». Solo se puede cambiar allí.`,
}
