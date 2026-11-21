import type { Messages } from '../types.ts'

export const settings: Messages['settings'] = {
  tabsLabel: 'Secciones de la configuración',
  tabs: {
    calendars: 'Calendarios',
    invitations: 'Invitaciones',
    appearance: 'Apariencia',
    account: 'Cuenta',
    notifications: 'Notificaciones',
    data: 'Datos',
    security: 'Seguridad',
    connections: 'Conexiones',
  },
  dataExport: {
    title: 'Tus datos',
    accountDescription:
      'Descarga todo lo que se guarda en tu cuenta: perfil, ajustes, colores, membresías, tus eventos, respuestas, mensajes de chat y los datos de tus adjuntos. El archivo está en formato JSON.',
    localDescription:
      'Descarga todos los eventos y ajustes que guarda este navegador. El archivo está en formato JSON.',
    download: 'Descargar datos',
  },
  languageTitle: 'Idioma y región',
  languageDescription: 'Determina el idioma, los formatos de fecha y hora y el primer día de la semana.',
  languageLabel: 'Idioma',
  languageAuto: 'Automático (navegador)',
  timeZoneTitle: 'Zona horaria',
  timeZoneDescription: 'Los eventos se muestran en esta zona horaria y los nuevos eventos la usan por defecto.',
  timeZoneLabel: 'Zona horaria',
  timeZoneAuto: (zone) => `Automática: ${zone} (recomendado)`,
  holidaysTitle: 'Días festivos',
  holidaysDescription: 'Muestra los días festivos oficiales en el calendario. Datos: date-holidays (CC BY-SA 4.0).',
  holidaysCountry: 'País',
  holidaysRegion: 'Región',
  holidaysAuto: (name) => `Automático: ${name} (recomendado)`,
  holidaysOff: 'Sin días festivos',
  holidaysWholeCountry: 'Todo el país',
  notifications: {
    title: 'Correos sobre eventos',
    description:
      'Correos a tu dirección confirmada. Los recordatorios por correo llegan aunque el calendario esté cerrado.',
    unverified: 'Confirma tu dirección de correo para recibir correos.',
    emailInvites: 'Cuando alguien me invita a un evento',
    emailChanges: 'Cuando cambia o se cancela un evento al que estoy invitado',
    emailReminders: 'Recordatorios por correo',
    emailChat: 'Mensajes nuevos en el chat de eventos a los que estoy invitado',
  },
  themeTitle: 'Tema',
  themeLabel: 'Claro u oscuro',
  startViewTitle: 'Vista inicial',
  startViewDescription: 'El calendario se abre en esta vista.',
  desktop: 'Ordenador y tableta',
  mobile: 'Teléfono',
}
