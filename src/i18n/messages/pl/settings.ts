import type { Messages } from '../types.ts'

export const settings: Messages['settings'] = {
  tabsLabel: 'Sekcje ustawień',
  tabs: {
    calendars: 'Kalendarze',
    invitations: 'Zaproszenia',
    appearance: 'Wygląd',
    account: 'Konto',
    notifications: 'Powiadomienia',
    data: 'Dane',
    security: 'Bezpieczeństwo',
    connections: 'Połączenia',
  },
  dataExport: {
    title: 'Twoje dane',
    accountDescription:
      'Pobierz wszystko, co jest zapisane dla Twojego konta: profil, ustawienia, kolory, członkostwa, Twoje wydarzenia, odpowiedzi, wiadomości z czatu i dane Twoich załączników. Plik jest w formacie JSON.',
    localDescription:
      'Pobierz wszystkie wydarzenia i ustawienia zapisane w tej przeglądarce. Plik jest w formacie JSON.',
    download: 'Pobierz dane',
  },
  languageTitle: 'Język i region',
  languageDescription: 'Określa język, format daty i godziny oraz pierwszy dzień tygodnia.',
  languageLabel: 'Język',
  languageAuto: 'Automatyczny (przeglądarka)',
  timeZoneTitle: 'Strefa czasowa',
  timeZoneDescription:
    'Wydarzenia są wyświetlane w tej strefie czasowej, a nowe wydarzenia mają ją ustawioną domyślnie.',
  timeZoneLabel: 'Strefa czasowa',
  timeZoneAuto: (zone) => `Automatyczna: ${zone} (zalecane)`,
  holidaysTitle: 'Święta',
  holidaysDescription: 'Pokazuje dni ustawowo wolne w kalendarzu. Dane: date-holidays (CC BY-SA 4.0).',
  holidaysCountry: 'Kraj',
  holidaysRegion: 'Region',
  holidaysAuto: (name) => `Automatycznie: ${name} (zalecane)`,
  holidaysOff: 'Bez świąt',
  holidaysWholeCountry: 'Cały kraj',
  notifications: {
    title: 'E-maile o wydarzeniach',
    description:
      'E-maile na Twój potwierdzony adres. Przypomnienia e-mailem przychodzą także wtedy, gdy kalendarz jest zamknięty.',
    unverified: 'Potwierdź adres e-mail, aby otrzymywać wiadomości.',
    emailInvites: 'Gdy ktoś zaprosi mnie na wydarzenie',
    emailChanges: 'Gdy wydarzenie, na które jestem zaproszony, zmieni się lub zostanie odwołane',
    emailReminders: 'Przypomnienia e-mailem',
    emailChat: 'Nowe wiadomości na czacie wydarzeń, na które jestem zaproszony',
  },
  themeTitle: 'Motyw',
  themeLabel: 'Jasny lub ciemny',
  startViewTitle: 'Widok startowy',
  startViewDescription: 'Kalendarz otwiera się w tym widoku.',
  desktop: 'Komputer i tablet',
  mobile: 'Telefon',
}
