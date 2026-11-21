import type { Messages } from '../types.ts'
import { plural } from './grammar.ts'

export const storage: Messages['storage'] = {
  importTitle: 'Przenieść lokalne wydarzenia?',
  importMessage: (count) =>
    `W tej przeglądarce ${count === 1 ? 'jest zapisane jedno wydarzenie' : `zapisano ${count} ${plural(count, 'wydarzenie', 'wydarzenia', 'wydarzeń')}`} bez konta. Czy przenieść je na Twoje konto? Potem ${count === 1 ? 'będzie dostępne' : 'będą dostępne'} na wszystkich Twoich urządzeniach i ${count === 1 ? 'zostanie usunięte' : 'zostaną usunięte'} z tej przeglądarki.`,
  importing: 'Przenoszenie …',
  importConfirm: 'Przenieś na moje konto',
  keepLocal: 'Zostaw tylko w tej przeglądarce',
}
