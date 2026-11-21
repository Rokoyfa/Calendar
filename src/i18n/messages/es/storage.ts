import type { Messages } from '../types.ts'

export const storage: Messages['storage'] = {
  importTitle: '¿Importar eventos locales?',
  importMessage: (count) =>
    `${count === 1 ? 'Hay un evento guardado' : `Hay ${count} eventos guardados`} en este navegador sin cuenta. ¿Quieres pasar${count === 1 ? 'lo' : 'los'} a tu cuenta? Después estará${count === 1 ? '' : 'n'} disponible${count === 1 ? '' : 's'} en todos tus dispositivos y se eliminará${count === 1 ? '' : 'n'} de este navegador.`,
  importing: 'Importando …',
  importConfirm: 'Pasar a mi cuenta',
  keepLocal: 'Mantener solo en este navegador',
}
