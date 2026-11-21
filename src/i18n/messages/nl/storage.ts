import type { Messages } from '../types.ts'

export const storage: Messages['storage'] = {
  importTitle: 'Lokale afspraken overnemen?',
  importMessage: (count) =>
    `In deze browser ${count === 1 ? 'is één afspraak' : `zijn ${count} afspraken`} zonder account opgeslagen. Wil je ${count === 1 ? 'die' : 'ze'} naar je account verplaatsen? Daarna ${count === 1 ? 'is die' : 'zijn ze'} op al je apparaten beschikbaar en ${count === 1 ? 'wordt die' : 'worden ze'} uit deze browser verwijderd.`,
  importing: 'Overnemen …',
  importConfirm: 'Naar mijn account verplaatsen',
  keepLocal: 'Alleen in deze browser bewaren',
}
