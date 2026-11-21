import type { Messages } from '../types.ts'

export const storage: Messages['storage'] = {
  importTitle: 'Importer les événements locaux\u202f?',
  importMessage: (count) =>
    `${count === 1 ? 'Un événement est enregistré' : `${count} événements sont enregistrés`} dans ce navigateur sans compte. Voulez-vous ${count === 1 ? 'le' : 'les'} transférer vers votre compte\u202f? ${count === 1 ? 'Il sera' : 'Ils seront'} alors disponible${count === 1 ? '' : 's'} sur tous vos appareils et supprimé${count === 1 ? '' : 's'} de ce navigateur.`,
  importing: 'Importation …',
  importConfirm: 'Transférer vers mon compte',
  keepLocal: 'Garder uniquement dans ce navigateur',
}
