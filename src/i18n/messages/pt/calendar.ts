import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Visualização',
  day: { label: 'Dia', previous: 'Dia anterior', next: 'Próximo dia' },
  week: { label: 'Semana', previous: 'Semana anterior', next: 'Próxima semana' },
  month: { label: 'Mês', previous: 'Mês anterior', next: 'Próximo mês' },
  year: { label: 'Ano', previous: 'Ano anterior', next: 'Próximo ano' },
  agenda: {
    label: 'Agenda',
    previous: '30 dias anteriores',
    next: 'Próximos 30 dias',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Dia inteiro',
    empty: 'Nenhum evento nestes 30 dias.',
  },
  tasks: { label: 'Tarefas' },
  weekNumber: (week) => `Sem. ${week}`,
  weekNumberLong: (week) => `Semana ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Hoje',
  newEvent: 'Novo evento',
  now: (time) => `Agora: ${time}`,
  ownResponse: (status) => `A sua resposta: ${status}`,
  newEventAt: (day, time) => `Novo evento: ${day}, ${time}`,
  todayMark: 'hoje',
  openDay: (date) => `Abrir ${date}`,
  moreEvents: (count) => `mais ${count}`,
  moreLinks: (count) => `+${count} outros links`,
  holiday: (name) => `Feriado: ${name}`,
  fromCalendar: (name) => `Do calendário “${name}”`,
  sharedEventNotice: (source) => `${source}. Todos os membros veem as alterações.`,
  dismiss: 'Fechar',
  undo: {
    action: 'Anular',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `“${title}” excluído`,
    moved: (title) => `“${title}” movido`,
  },
  menu: {
    open: 'Abrir menu',
    openMarked: 'Abrir menu (filtro ativo)',
    title: 'Menu',
    active: 'ativo',
    calendarSettings: 'Configurações do calendário',
    calendarGroup: (name) => `Calendário: ${name}`,
  },
  filter: {
    open: 'Filtrar por categoria',
    openActive: 'Filtrar por categoria (ativo)',
    title: 'Filtrar por categoria',
    uncategorized: 'Sem categoria',
    reset: 'Mostrar tudo',
  },
  search: {
    open: 'Buscar',
    title: 'Buscar eventos',
    placeholder: 'Título, local ou descrição',
    hint: 'Digite pelo menos 2 caracteres.',
    empty: 'Nenhum evento encontrado.',
    searching: 'Buscando …',
  },
  print: {
    open: 'Imprimir ou salvar como PDF',
    empty: 'Sem eventos neste período.',
  },
}
