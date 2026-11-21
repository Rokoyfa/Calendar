import type { Messages } from '../types.ts'

export const settings: Messages['settings'] = {
  tabsLabel: 'Seções das configurações',
  tabs: {
    calendars: 'Calendários',
    invitations: 'Convites',
    appearance: 'Aparência',
    account: 'Conta',
    notifications: 'Notificações',
    data: 'Dados',
    security: 'Segurança',
    connections: 'Conexões',
  },
  dataExport: {
    title: 'Os seus dados',
    accountDescription:
      'Transfira tudo o que está guardado na sua conta: perfil, definições, cores, associações, os seus eventos, respostas, mensagens de chat e os dados dos seus anexos. O ficheiro está em formato JSON.',
    localDescription:
      'Transfira todos os eventos e definições que este navegador guarda. O ficheiro está em formato JSON.',
    download: 'Transferir dados',
  },
  languageTitle: 'Idioma e região',
  languageDescription: 'Define o idioma, os formatos de data e hora e o primeiro dia da semana.',
  languageLabel: 'Idioma',
  languageAuto: 'Automático (navegador)',
  timeZoneTitle: 'Fuso horário',
  timeZoneDescription: 'Os eventos são mostrados neste fuso horário, que também vem pré-selecionado nos novos eventos.',
  timeZoneLabel: 'Fuso horário',
  timeZoneAuto: (zone) => `Automático: ${zone} (recomendado)`,
  holidaysTitle: 'Feriados',
  holidaysDescription: 'Mostra os feriados oficiais no calendário. Dados: date-holidays (CC BY-SA 4.0).',
  holidaysCountry: 'País',
  holidaysRegion: 'Região',
  holidaysAuto: (name) => `Automático: ${name} (recomendado)`,
  holidaysOff: 'Sem feriados',
  holidaysWholeCountry: 'Todo o país',
  notifications: {
    title: 'E-mails sobre eventos',
    description:
      'E-mails para o teu endereço confirmado. Os lembretes por e-mail chegam mesmo com o calendário fechado.',
    unverified: 'Confirma o teu endereço de e-mail para receber e-mails.',
    emailInvites: 'Quando alguém me convida para um evento',
    emailChanges: 'Quando um evento para o qual fui convidado muda ou é cancelado',
    emailReminders: 'Lembretes por e-mail',
    emailChat: 'Novas mensagens no chat dos eventos para os quais fui convidado',
  },
  themeTitle: 'Tema',
  themeLabel: 'Claro ou escuro',
  startViewTitle: 'Visualização inicial',
  startViewDescription: 'O calendário abre nesta visualização.',
  desktop: 'Computador e tablet',
  mobile: 'Celular',
}
