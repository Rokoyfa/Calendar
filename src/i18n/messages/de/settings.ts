import type { Messages } from '../types.ts'

export const settings: Messages['settings'] = {
  tabsLabel: 'Bereiche der Einstellungen',
  tabs: { calendars: 'Kalender', invitations: 'Einladungen', appearance: 'Darstellung', account: 'Konto' },
  languageTitle: 'Sprache und Region',
  languageDescription: 'Bestimmt Sprache, Datums- und Zeitformate und den ersten Tag der Woche.',
  languageLabel: 'Sprache',
  languageAuto: 'Automatisch (Browser)',
  themeTitle: 'Farbschema',
  themeLabel: 'Hell oder dunkel',
  startViewTitle: 'Startansicht',
  startViewDescription: 'Mit dieser Ansicht öffnet sich der Kalender.',
  desktop: 'Computer und Tablet',
  mobile: 'Handy',
}
