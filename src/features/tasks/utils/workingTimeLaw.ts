export type BreakRule = { over: number; minutes: number }

export type WorkingTimeLaw = {
  restMinutes: number
  maxDailyMinutes: number
  maxWeeklyMinutes: number
  maxStretchMinutes: number
  breaks: readonly BreakRule[]
  restDays: readonly number[]
}

const FRIDAY = 4
const SATURDAY = 5
const SUNDAY = 6

const hours = (value: number) => value * 60

export const DEFAULT_WORKING_TIME_LAW: WorkingTimeLaw = {
  restMinutes: hours(11),
  maxDailyMinutes: hours(8),
  maxWeeklyMinutes: hours(48),
  maxStretchMinutes: hours(6),
  breaks: [
    { over: hours(6), minutes: 30 },
    { over: hours(9), minutes: 45 },
  ],
  restDays: [SUNDAY],
}

const EU = DEFAULT_WORKING_TIME_LAW

const GULF: WorkingTimeLaw = {
  restMinutes: hours(11),
  maxDailyMinutes: hours(8),
  maxWeeklyMinutes: hours(48),
  maxStretchMinutes: hours(5),
  breaks: [{ over: hours(5), minutes: 30 }],
  restDays: [FRIDAY],
}

export const WORKING_TIME_LAWS: Readonly<Record<string, WorkingTimeLaw>> = {
  DE: EU,
  AT: { ...EU, breaks: [{ over: hours(6), minutes: 30 }] },
  CH: {
    ...EU,
    maxDailyMinutes: hours(9),
    maxWeeklyMinutes: hours(45),
    maxStretchMinutes: hours(5.5),
    breaks: [
      { over: hours(5.5), minutes: 15 },
      { over: hours(7), minutes: 30 },
      { over: hours(9), minutes: 60 },
    ],
  },
  FR: { ...EU, maxDailyMinutes: hours(10), breaks: [{ over: hours(6), minutes: 20 }] },
  BE: { ...EU, breaks: [{ over: hours(6), minutes: 15 }] },
  NL: {
    ...EU,
    maxStretchMinutes: hours(5.5),
    breaks: [
      { over: hours(5.5), minutes: 30 },
      { over: hours(10), minutes: 45 },
    ],
  },
  LU: { ...EU, breaks: [{ over: hours(6), minutes: 30 }] },
  IT: { ...EU, breaks: [{ over: hours(6), minutes: 10 }] },
  ES: { ...EU, restMinutes: hours(12), maxDailyMinutes: hours(9), breaks: [{ over: hours(6), minutes: 15 }] },
  PT: { ...EU, maxStretchMinutes: hours(5), breaks: [{ over: hours(5), minutes: 60 }] },
  PL: { ...EU, breaks: [{ over: hours(6), minutes: 15 }] },
  CZ: { ...EU, breaks: [{ over: hours(6), minutes: 30 }] },
  DK: EU,
  SE: { ...EU, maxStretchMinutes: hours(5), breaks: [{ over: hours(5), minutes: 30 }] },
  FI: { ...EU, breaks: [{ over: hours(6), minutes: 30 }] },
  IE: { ...EU, breaks: [{ over: hours(6), minutes: 30 }] },
  GB: { ...EU, breaks: [{ over: hours(6), minutes: 20 }] },
  SA: GULF,
  QA: GULF,
  KW: GULF,
  BH: GULF,
  OM: { ...GULF, restDays: [FRIDAY, SATURDAY] },
  AE: { ...GULF, restDays: [SUNDAY] },
  IL: {
    ...EU,
    restMinutes: hours(8),
    maxDailyMinutes: hours(9),
    maxWeeklyMinutes: hours(42),
    breaks: [{ over: hours(6), minutes: 45 }],
    restDays: [SATURDAY],
  },
}

export const PLANNING_COUNTRIES = Object.keys(WORKING_TIME_LAWS).sort()

export const getWorkingTimeLaw = (country: string | null) =>
  (country && WORKING_TIME_LAWS[country]) || DEFAULT_WORKING_TIME_LAW

export const isRestDay = (law: WorkingTimeLaw, weekday: number) => law.restDays.includes(weekday)
