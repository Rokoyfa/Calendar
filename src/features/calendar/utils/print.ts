import type { Formatter } from '../../../i18n/format.ts'
import { timeToMinutes } from '../../../utils/date.ts'
import type { EventOccurrence } from '../../../domain/event.ts'
import type { CalendarView } from '../types/view.ts'

const PRESET_COLORS: Readonly<Record<string, string>> = {
  blue: '#365caf',
  red: '#be230f',
  green: '#158115',
  yellow: '#c9c500',
}

const DAYS_PER_WEEK = 7

export type PrintTexts = {
  allDay: string
  empty: string
}

export type PrintOptions = {
  title: string
  subtitle?: string
  view: CalendarView
  dates: readonly string[]
  occurrences: readonly EventOccurrence[]
  holidays: ReadonlyMap<string, readonly string[]>
  calendarName: (calendarId: string) => string | undefined
  language: string
  format: Formatter
  texts: PrintTexts
}

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

const colorOf = (color: string) => PRESET_COLORS[color] ?? (/^#[0-9a-f]{6}$/i.test(color) ? color : PRESET_COLORS.blue)

const onDate = (occurrences: readonly EventOccurrence[], date: string) =>
  occurrences
    .filter(
      (occurrence) =>
        occurrence.startDate <= date &&
        date <= occurrence.endDate &&
        (occurrence.allDay || date === occurrence.startDate || date < occurrence.endDate || occurrence.end !== '00:00'),
    )
    .sort(
      (a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title),
    )

const timeOf = (occurrence: EventOccurrence, date: string, { format, texts }: PrintOptions) => {
  if (occurrence.allDay) return texts.allDay
  const start = occurrence.startDate === date ? format.time(timeToMinutes(occurrence.start)) : ''
  const end = occurrence.endDate === date ? format.time(timeToMinutes(occurrence.end)) : ''
  return `${start}–${end}`
}

const eventLine = (occurrence: EventOccurrence, date: string, options: PrintOptions, withDetails: boolean) => {
  const calendar = options.calendarName(occurrence.calendarId)
  const details = withDetails ? [occurrence.location, calendar].filter((part): part is string => Boolean(part)) : []
  return `<li><span class="dot" style="background:${colorOf(occurrence.color)}"></span><span class="time">${escape(
    timeOf(occurrence, date, options),
  )}</span> <strong>${escape(occurrence.title)}</strong>${details.map((part) => ` · ${escape(part)}`).join('')}</li>`
}

const holidayLine = (options: PrintOptions, date: string) => {
  const names = options.holidays.get(date) ?? []
  return names.length > 0 ? `<p class="holiday">${escape(names.join(', '))}</p>` : ''
}

const listBody = (options: PrintOptions) => {
  const days = options.dates
    .map((date) => ({ date, events: onDate(options.occurrences, date) }))
    .filter(({ date, events }) => events.length > 0 || (options.holidays.get(date)?.length ?? 0) > 0)
  if (days.length === 0) return `<p class="empty">${escape(options.texts.empty)}</p>`
  return days
    .map(
      ({ date, events }) =>
        `<section class="day"><h2>${escape(options.format.longDate(date))}</h2>${holidayLine(options, date)}<ul>${events
          .map((occurrence) => eventLine(occurrence, date, options, true))
          .join('')}</ul></section>`,
    )
    .join('')
}

const monthBody = (options: PrintOptions) => {
  const { dates, format } = options
  const weeks: string[][] = []
  for (let index = 0; index < dates.length; index += DAYS_PER_WEEK)
    weeks.push(dates.slice(index, index + DAYS_PER_WEEK))
  const month = dates[Math.floor(dates.length / 2)].slice(0, 7)
  const head = weeks[0].map((date) => `<th>${escape(format.shortWeekday(new Date(`${date}T12:00:00`)))}</th>`).join('')
  const rows = weeks
    .map(
      (week) =>
        `<tr>${week
          .map(
            (date) =>
              `<td class="${date.startsWith(month) ? '' : 'outside'}"><div class="number">${Number(
                date.slice(8),
              )}</div>${holidayLine(options, date)}<ul>${onDate(options.occurrences, date)
                .map((occurrence) => eventLine(occurrence, date, options, false))
                .join('')}</ul></td>`,
          )
          .join('')}</tr>`,
    )
    .join('')
  return `<table class="month"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`
}

const STYLE = `
@page { margin: 14mm; }
* { box-sizing: border-box; }
body { font: 11pt/1.4 system-ui, 'Segoe UI', sans-serif; color: #111; margin: 0; }
h1 { font-size: 16pt; margin: 0; }
.subtitle { margin: 2pt 0 0; color: #555; }
header { margin-bottom: 10pt; }
h2 { font-size: 11pt; margin: 12pt 0 4pt; padding-bottom: 2pt; border-bottom: 1px solid #bbb; break-after: avoid; }
ul { list-style: none; margin: 0; padding: 0; }
li { margin: 2pt 0; break-inside: avoid; }
.day { break-inside: avoid-page; }
.dot { display: inline-block; width: 7pt; height: 7pt; border-radius: 50%; margin-right: 4pt;
  print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.time { color: #444; font-variant-numeric: tabular-nums; }
.holiday { margin: 0 0 2pt; color: #555; font-style: italic; }
.empty { color: #555; }
table.month { width: 100%; border-collapse: collapse; table-layout: fixed; }
.month th { font-size: 9pt; padding: 3pt; border: 1px solid #bbb; background: #f2f2f2;
  print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.month td { vertical-align: top; height: 24mm; padding: 2pt 3pt; border: 1px solid #bbb; font-size: 8pt; overflow: hidden; }
.month td.outside { color: #999; }
.month .number { font-weight: 600; }
.month li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`

export const buildPrintDocument = (options: PrintOptions) =>
  `<!doctype html><html lang="${escape(options.language)}"><head><meta charset="utf-8"><title>${escape(
    options.title,
  )}</title><style>${STYLE}</style></head><body><header><h1>${escape(options.title)}</h1>${
    options.subtitle ? `<p class="subtitle">${escape(options.subtitle)}</p>` : ''
  }</header>${options.view === 'month' ? monthBody(options) : listBody(options)}</body></html>`
