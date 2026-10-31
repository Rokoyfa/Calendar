import {
  addDaysToISODate,
  addMonthsToISODate,
  DAYS_PER_WEEK,
  endOfMonthISO,
  endOfWeekISO,
  endOfYearISO,
  formatLongDate,
  formatMonthYear,
  formatWeekTitle,
  fromISODate,
  getIsoWeek,
  startOfMonthISO,
  startOfWeekISO,
  startOfYearISO,
} from '../../../utils/date.ts'
import type { CalendarView, ViewDefinition } from '../types/view.ts'

const MONTHS_PER_YEAR = 12

export const VIEW_DEFINITIONS: Record<CalendarView, ViewDefinition> = {
  day: {
    label: 'Tag',
    previousLabel: 'Vorheriger Tag',
    nextLabel: 'Nächster Tag',
    getRange: (anchor) => ({ from: anchor, to: anchor }),
    step: (anchor, direction) => addDaysToISODate(anchor, direction),
    getTitle: formatLongDate,
  },
  week: {
    label: 'Woche',
    previousLabel: 'Vorherige Woche',
    nextLabel: 'Nächste Woche',
    getRange: (anchor) => ({ from: startOfWeekISO(anchor), to: endOfWeekISO(anchor) }),
    step: (anchor, direction) => addDaysToISODate(anchor, direction * DAYS_PER_WEEK),
    getTitle: (anchor) => formatWeekTitle(fromISODate(startOfWeekISO(anchor))),
    getSubtitle: (anchor) => `KW ${getIsoWeek(fromISODate(anchor))}`,
  },
  month: {
    label: 'Monat',
    previousLabel: 'Vorheriger Monat',
    nextLabel: 'Nächster Monat',
    getRange: (anchor) => ({
      from: startOfWeekISO(startOfMonthISO(anchor)),
      to: endOfWeekISO(endOfMonthISO(anchor)),
    }),
    step: (anchor, direction) => addMonthsToISODate(anchor, direction),
    getTitle: formatMonthYear,
  },
  year: {
    label: 'Jahr',
    previousLabel: 'Vorheriges Jahr',
    nextLabel: 'Nächstes Jahr',
    getRange: (anchor) => ({ from: startOfYearISO(anchor), to: endOfYearISO(anchor) }),
    step: (anchor, direction) => addMonthsToISODate(anchor, direction * MONTHS_PER_YEAR),
    getTitle: (anchor) => anchor.slice(0, 4),
  },
}
