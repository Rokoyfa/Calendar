import { useMemo } from 'react'
import { useI18n } from '../../../i18n/index.ts'
import { getLocaleRegion, splitHolidayRegion } from '../../../utils/holidays.ts'
import { PLANNING_COUNTRY_AUTO } from '../../../utils/preferences.ts'
import { useHolidayRegion } from '../../holidays/index.ts'
import { usePreferences } from '../../preferences/index.ts'
import { WORKING_TIME_LAWS } from '../utils/workingTimeLaw.ts'

export const getCountryName = (country: string, language: string) => {
  try {
    return new Intl.DisplayNames([language], { type: 'region', fallback: 'code' }).of(country) ?? country
  } catch {
    return country
  }
}

export function useAutomaticPlanningCountry() {
  const region = useHolidayRegion()
  const { locale } = useI18n()
  return region ? splitHolidayRegion(region).country : getLocaleRegion(locale)
}

export function usePlanningCountry() {
  const { preferences } = usePreferences()
  const automatic = useAutomaticPlanningCountry()
  return preferences.planningCountry === PLANNING_COUNTRY_AUTO ? automatic : preferences.planningCountry
}

export function usePlanningCountryName(country: string | null) {
  const { m, language } = useI18n()
  const text = m.settings.planning
  return useMemo(() => {
    if (!country) return text.generalRules
    const name = getCountryName(country, language)
    return country in WORKING_TIME_LAWS ? name : text.withGeneralRules(name)
  }, [country, language, text])
}
