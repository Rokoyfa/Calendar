import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Subskrybowane kalendarze',
  description:
    'Wyświetlaj kalendarze z innych usług obok własnych, na przykład święta, ferie szkolne lub kalendarz służbowy. Wklej adres iCal (.ics) podany przez usługę. Te kalendarze są tylko do odczytu.',
  empty: 'Nie subskrybujesz jeszcze żadnego kalendarza.',
  addTitle: 'Subskrybuj kalendarz',
  url: 'Adres kalendarza (iCal)',
  urlHint:
    'Zaczyna się od https:// lub webcal://. Pełny adres nie jest później wyświetlany, ponieważ może zawierać prywatny klucz.',
  urlInvalid: 'Wpisz adres zaczynający się od https:// lub webcal://.',
  name: 'Nazwa',
  nameRequired: 'Wpisz nazwę.',
  add: 'Subskrybuj',
  adding: 'Sprawdzanie kalendarza …',
  added: 'Kalendarz został dodany.',
  show: 'Pokaż w kalendarzu',
  readOnly: 'Tylko do odczytu',
  edit: 'Edytuj',
  remove: 'Zakończ subskrypcję',
  removing: 'Kończenie subskrypcji …',
  removeTitle: 'Zakończ subskrypcję kalendarza',
  removeMessage: (name) => `Przestać wyświetlać „${name}”? Możesz w każdej chwili subskrybować go ponownie.`,
  updated: (time) => `Zaktualizowano: ${time}`,
  limitReached: (max) => `Możesz subskrybować maksymalnie ${max} kalendarzy.`,
  eventNotice: (name) => `Z subskrybowanego kalendarza „${name}”. Można go zmienić tylko tam.`,
}
