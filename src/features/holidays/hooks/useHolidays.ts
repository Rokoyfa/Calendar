import { useCallback, useMemo } from 'react'
import { useHost } from '../../../context/HostContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import type { DateRange } from '../../../utils/date.ts'
import { groupHolidaysByDate, resolveHolidayRegion, type PublicHoliday } from '../../../domain/holidays.ts'
import { usePreferences } from '../../preferences/index.ts'
import { useStorage, type HolidayQuery, type HolidayRepository } from '../../storage/index.ts'
import { libraryHolidays } from '../utils/holidayLibrary.ts'

const NO_HOLIDAYS: PublicHoliday[] = []

export const listHolidays = (repository: HolidayRepository | undefined, query: HolidayQuery) => {
  const fromLibrary = () => libraryHolidays.list(query).catch(() => NO_HOLIDAYS)
  return repository ? repository.list(query).catch(fromLibrary) : fromLibrary()
}

export const useHolidayRegion = () => {
  const { preferences } = usePreferences()
  const host = useHost()
  const { locale } = useI18n()
  return host.features.holidays ? resolveHolidayRegion(preferences.holidays, host.holidays, locale) : null
}

export function useHolidays({ from, to }: DateRange) {
  const region = useHolidayRegion()
  const { language } = useI18n()
  const { holidays: repository } = useStorage()

  const load = useCallback(async () => {
    if (!region) return NO_HOLIDAYS
    return listHolidays(repository, { from, to, region, language })
  }, [region, from, to, language, repository])

  const { data } = useAsyncResource(load, NO_HOLIDAYS)
  return useMemo(() => groupHolidaysByDate(data), [data])
}
