import type { Messages } from '../types.ts'

export const storage: Messages['storage'] = {
  importTitle: 'Importare gli eventi locali?',
  importMessage: (count) =>
    `${count === 1 ? 'Un evento è salvato' : `${count} eventi sono salvati`} in questo browser senza account. Vuoi spostar${count === 1 ? 'lo' : 'li'} nel tuo account? Poi ${count === 1 ? 'sarà disponibile' : 'saranno disponibili'} su tutti i tuoi dispositivi e ${count === 1 ? 'verrà rimosso' : 'verranno rimossi'} da questo browser.`,
  importing: 'Importazione …',
  importConfirm: 'Sposta nel mio account',
  keepLocal: 'Mantieni solo in questo browser',
}
