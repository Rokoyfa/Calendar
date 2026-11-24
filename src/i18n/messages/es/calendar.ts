import type { Messages } from '../types.ts'

export const views: Messages['views'] = {
  label: 'Vista',
  day: { label: 'Día', previous: 'Día anterior', next: 'Día siguiente' },
  week: { label: 'Semana', previous: 'Semana anterior', next: 'Semana siguiente' },
  month: { label: 'Mes', previous: 'Mes anterior', next: 'Mes siguiente' },
  year: { label: 'Año', previous: 'Año anterior', next: 'Año siguiente' },
  agenda: {
    label: 'Agenda',
    previous: '30 días anteriores',
    next: '30 días siguientes',
    range: (from, to) => `${from} – ${to}`,
    allDay: 'Todo el día',
    empty: 'No hay eventos en estos 30 días.',
  },
  tasks: { label: 'Tareas' },
  weekNumber: (week) => `Sem. ${week}`,
  weekNumberLong: (week) => `Semana ${week}`,
}

export const calendar: Messages['calendar'] = {
  today: 'Hoy',
  newEvent: 'Nuevo evento',
  now: (time) => `Ahora: ${time}`,
  ownResponse: (status) => `Tu respuesta: ${status}`,
  newEventAt: (day, time) => `Nuevo evento: ${day}, ${time}`,
  todayMark: 'hoy',
  openDay: (date) => `Abrir ${date}`,
  moreEvents: (count) => `${count} más`,
  moreLinks: (count) => `+${count} enlaces más`,
  holiday: (name) => `Festivo: ${name}`,
  fromCalendar: (name) => `Del calendario «${name}»`,
  sharedEventNotice: (source) => `${source}. Todos los miembros ven los cambios.`,
  dismiss: 'Cerrar',
  undo: {
    action: 'Deshacer',
    ctrlZ: 'Ctrl+Z',
    deleted: (title) => `«${title}» eliminado`,
    moved: (title) => `«${title}» movido`,
  },
  menu: {
    open: 'Abrir menú',
    openMarked: 'Abrir menú (filtro activo)',
    title: 'Menú',
    active: 'activo',
    calendarSettings: 'Configuración del calendario',
    calendarGroup: (name) => `Calendario: ${name}`,
  },
  filter: {
    open: 'Filtrar por categoría',
    openActive: 'Filtrar por categoría (activo)',
    title: 'Filtrar por categoría',
    uncategorized: 'Sin categoría',
    reset: 'Mostrar todo',
  },
  search: {
    open: 'Buscar',
    title: 'Buscar eventos',
    placeholder: 'Título, ubicación o descripción',
    hint: 'Escribe al menos 2 caracteres.',
    empty: 'No se han encontrado eventos.',
    searching: 'Buscando …',
  },
  print: {
    open: 'Imprimir o guardar como PDF',
    empty: 'No hay eventos en este periodo.',
  },
}
