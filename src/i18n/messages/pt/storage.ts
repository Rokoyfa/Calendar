import type { Messages } from '../types.ts'

export const storage: Messages['storage'] = {
  importTitle: 'Importar eventos locais?',
  importMessage: (count) =>
    `${count === 1 ? 'Há um evento salvo' : `Há ${count} eventos salvos`} neste navegador sem conta. Deseja movê-${count === 1 ? 'lo' : 'los'} para sua conta? Depois ${count === 1 ? 'ele estará disponível' : 'eles estarão disponíveis'} em todos os seus dispositivos e ${count === 1 ? 'será removido' : 'serão removidos'} deste navegador.`,
  importing: 'Importando …',
  importConfirm: 'Mover para minha conta',
  keepLocal: 'Manter só neste navegador',
}
