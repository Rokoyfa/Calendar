export const views = {
  label: 'View',
  day: { label: 'Day', previous: 'Previous day', next: 'Next day' },
  week: { label: 'Week', previous: 'Previous week', next: 'Next week' },
  month: { label: 'Month', previous: 'Previous month', next: 'Next month' },
  year: { label: 'Year', previous: 'Previous year', next: 'Next year' },
  weekNumber: (week: number) => `Wk ${week}`,
  weekNumberLong: (week: number) => `Week ${week}`,
}

export const calendar = {
  today: 'Today',
  newEvent: 'New event',
  now: (time: string) => `Now: ${time}`,
  openDay: (date: string) => `Open ${date}`,
  moreEvents: (count: number) => `+${count} more`,
  moreLinks: (count: number) => `+${count} more links`,
  holiday: (name: string) => `Public holiday: ${name}`,
  fromCalendar: (name: string) => `From the calendar “${name}”`,
  sharedEventNotice: (source: string) => `${source}. All members see changes.`,
  dismiss: 'Dismiss',
  undo: { action: 'Undo', ctrlZ: 'Ctrl+Z', deleted: (title: string) => `“${title}” deleted`, moved: (title: string) => `“${title}” moved` },
  search: {
    open: 'Search',
    title: 'Search events',
    placeholder: 'Title, location or description',
    hint: 'Type at least 2 characters.',
    empty: 'No events found.',
    searching: 'Searching …',
  },
}
