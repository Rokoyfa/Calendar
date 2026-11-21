import type { Messages } from '../types.ts'

export const external: Messages['external'] = {
  title: 'Calendários assinados',
  description:
    'Mostre calendários de outros serviços ao lado dos seus, por exemplo feriados, férias escolares ou um calendário de trabalho. Cole o endereço iCal (.ics) fornecido pelo serviço. Estes calendários são somente leitura.',
  empty: 'Você ainda não assina nenhum calendário.',
  addTitle: 'Assinar um calendário',
  url: 'Endereço do calendário (iCal)',
  urlHint:
    'Começa com https:// ou webcal://. O endereço completo não é mostrado de novo, porque pode conter uma chave privada.',
  urlInvalid: 'Digite um endereço que comece com https:// ou webcal://.',
  name: 'Nome',
  nameRequired: 'Digite um nome.',
  add: 'Assinar',
  adding: 'Verificando o calendário …',
  added: 'O calendário foi adicionado.',
  show: 'Mostrar no calendário',
  readOnly: 'Somente leitura',
  edit: 'Editar',
  remove: 'Cancelar assinatura',
  removing: 'Cancelando assinatura …',
  removeTitle: 'Cancelar assinatura do calendário',
  removeMessage: (name) => `Deixar de mostrar “${name}”? Você pode assinar novamente a qualquer momento.`,
  updated: (time) => `Atualizado em ${time}`,
  limitReached: (max) => `Você pode assinar no máximo ${max} calendários.`,
  eventNotice: (name) => `Do calendário assinado “${name}”. Só pode ser alterado lá.`,
}
