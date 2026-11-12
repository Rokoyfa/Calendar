import type { HolidayQuery, HolidayRepository } from '../../storage/index.ts'
import { splitHolidayRegion, type PublicHoliday } from '../../../utils/holidays.ts'

type HolidaysClass = (typeof import('date-holidays'))['default']

let library: Promise<HolidaysClass> | null = null

const loadLibrary = () => (library ??= import('date-holidays').then((module) => module.default))

const getYears = (from: string, to: string) => {
  const first = Number(from.slice(0, 4))
  const last = Number(to.slice(0, 4))
  return Array.from({ length: last - first + 1 }, (_, index) => first + index)
}

export const libraryHolidays: HolidayRepository = {
  async list({ from, to, region, language }: HolidayQuery) {
    const Holidays = await loadLibrary()
    const { country, state } = splitHolidayRegion(region)
    const calendar = state ? new Holidays(country, state) : new Holidays(country)
    return getYears(from, to)
      .flatMap((year) => calendar.getHolidays(year, language))
      .filter(({ type }) => type === 'public')
      .map(({ date, name }): PublicHoliday => ({ date: date.slice(0, 10), name }))
      .filter(({ date }) => date >= from && date <= to)
  },
}

export type HolidayArea = { code: string; name: string }

const toAreas = (
  entries: Record<string, string> | undefined,
  language: string,
  translate: (code: string) => string | undefined = () => undefined,
): HolidayArea[] =>
  Object.entries(entries ?? {})
    .map(([code, name]) => ({ code, name: translate(code) ?? name }))
    .sort((a, b) => a.name.localeCompare(b.name, language))

const getRegionNames = (language: string) => {
  try {
    const names = new Intl.DisplayNames([language], { type: 'region', fallback: 'none' })
    return (code: string) => names.of(code)
  } catch {
    return undefined
  }
}

export const listHolidayCountries = async (language: string) =>
  toAreas(new (await loadLibrary())().getCountries(language), language, getRegionNames(language))

export const listHolidayStates = async (country: string, language: string) =>
  toAreas(new (await loadLibrary())().getStates(country, language), language)
