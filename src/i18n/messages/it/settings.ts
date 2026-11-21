import type { Messages } from '../types.ts'

export const settings: Messages['settings'] = {
  tabsLabel: 'Sezioni delle impostazioni',
  tabs: {
    calendars: 'Calendari',
    invitations: 'Inviti',
    appearance: 'Aspetto',
    account: 'Account',
    notifications: 'Notifiche',
    data: 'Dati',
    security: 'Sicurezza',
    connections: 'Connessioni',
  },
  dataExport: {
    title: 'I tuoi dati',
    accountDescription:
      'Scarica tutto ciò che è salvato per il tuo account: profilo, impostazioni, colori, iscrizioni, i tuoi eventi, risposte, messaggi della chat e i dati dei tuoi allegati. Il file è in formato JSON.',
    localDescription:
      'Scarica tutti gli eventi e le impostazioni salvati da questo browser. Il file è in formato JSON.',
    download: 'Scarica i dati',
  },
  languageTitle: 'Lingua e regione',
  languageDescription: 'Determina la lingua, i formati di data e ora e il primo giorno della settimana.',
  languageLabel: 'Lingua',
  languageAuto: 'Automatica (browser)',
  timeZoneTitle: 'Fuso orario',
  timeZoneDescription:
    'Gli eventi vengono mostrati in questo fuso orario, che è preselezionato anche per i nuovi eventi.',
  timeZoneLabel: 'Fuso orario',
  timeZoneAuto: (zone) => `Automatico: ${zone} (consigliato)`,
  holidaysTitle: 'Festività',
  holidaysDescription: 'Mostra le festività ufficiali nel calendario. Dati: date-holidays (CC BY-SA 4.0).',
  holidaysCountry: 'Paese',
  holidaysRegion: 'Regione',
  holidaysAuto: (name) => `Automatico: ${name} (consigliato)`,
  holidaysOff: 'Nessuna festività',
  holidaysWholeCountry: 'Tutto il paese',
  notifications: {
    title: 'Email sugli eventi',
    description: 'Email al tuo indirizzo confermato. I promemoria via email arrivano anche se il calendario è chiuso.',
    unverified: 'Conferma il tuo indirizzo email per ricevere le email.',
    emailInvites: 'Quando qualcuno mi invita a un evento',
    emailChanges: 'Quando un evento a cui sono invitato cambia o viene annullato',
    emailReminders: 'Promemoria via email',
    emailChat: 'Nuovi messaggi nella chat degli eventi a cui sono invitato',
  },
  themeTitle: 'Tema',
  themeLabel: 'Chiaro o scuro',
  startViewTitle: 'Vista iniziale',
  startViewDescription: 'Il calendario si apre in questa vista.',
  desktop: 'Computer e tablet',
  mobile: 'Telefono',
}
