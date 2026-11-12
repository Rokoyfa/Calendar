import type { Messages } from '../../../i18n/index.ts'
import {
  addDaysToISODate,
  addMonthsToISODate,
  DAYS_PER_WEEK,
  endOfMonthISO,
  endOfWeekISO,
  endOfYearISO,
  fromISODate,
  getWeekNumber,
  startOfMonthISO,
  startOfWeekISO,
  startOfYearISO,
} from '../../../utils/date.ts'
import { CALENDAR_VIEWS, type CalendarView, type ViewDefinition } from '../types/view.ts'

const MONTHS_PER_YEAR = 12

export const VIEW_DEFINITIONS: Record<CalendarView, ViewDefinition> = {
  day: {
    getRange: (anchor) => ({ from: anchor, to: anchor }),
    step: (anchor, direction) => addDaysToISODate(anchor, direction),
    getTitle: (anchor, { format }) => format.longDate(anchor),
  },
  week: {
    getRange: (anchor, firstDay) => ({ from: startOfWeekISO(anchor, firstDay), to: endOfWeekISO(anchor, firstDay) }),
    step: (anchor, direction) => addDaysToISODate(anchor, direction * DAYS_PER_WEEK),
    getTitle: (anchor, { format, weekInfo }) => format.weekTitle(fromISODate(startOfWeekISO(anchor, weekInfo.firstDay))),
    getSubtitle: (anchor, { m, weekInfo }) => m.views.weekNumber(getWeekNumber(fromISODate(anchor), weekInfo)),
  },
  month: {
    getRange: (anchor, firstDay) => ({
      from: startOfWeekISO(startOfMonthISO(anchor), firstDay),
      to: endOfWeekISO(endOfMonthISO(anchor), firstDay),
    }),
    step: (anchor, direction) => addMonthsToISODate(anchor, direction),
    getTitle: (anchor, { format }) => format.monthYear(anchor),
  },
  year: {
    getRange: (anchor) => ({ from: startOfYearISO(anchor), to: endOfYearISO(anchor) }),
    step: (anchor, direction) => addMonthsToISODate(anchor, direction * MONTHS_PER_YEAR),
    getTitle: (anchor) => anchor.slice(0, 4),
  },
}

export const VIEW_SHORTCUTS: Record<CalendarView, string> = { day: 'd', week: 'w', month: 'm', year: 'y' }

export const withShortcut = (label: string, key: string) => `${label} (${key.toUpperCase()})`

export const getViewOptions = (m: Messages) =>
  CALENDAR_VIEWS.map((view) => ({
    value: view,
    label: m.views[view].label,
    title: withShortcut(m.views[view].label, VIEW_SHORTCUTS[view]),
  }))
