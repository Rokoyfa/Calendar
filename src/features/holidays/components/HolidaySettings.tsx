import { useCallback } from 'react'
import { PageSection } from '../../../components/PageSection.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import {
  getHostHolidayRegion,
  HOLIDAYS_AUTO,
  HOLIDAYS_OFF,
  isHolidayRegion,
  splitHolidayRegion,
  toHolidayRegion,
} from '../../../utils/holidays.ts'
import { usePreferences } from '../../preferences/index.ts'
import { listHolidayCountries, listHolidayStates, type HolidayArea } from '../utils/holidayLibrary.ts'

const NO_AREAS: HolidayArea[] = []
const WHOLE_COUNTRY = ''

const describeRegion = (region: string | null, countries: readonly HolidayArea[]) => {
  if (!region) return null
  const { country, state } = splitHolidayRegion(region)
  const name = countries.find((area) => area.code === country)?.name ?? country
  return state ? `${name} (${state})` : name
}

export function HolidaySettings() {
  const { m, language, locale } = useI18n()
  const host = useHost()
  const { preferences, updatePreferences } = usePreferences()
  const { run, error } = useAsyncAction(updatePreferences)
  const setting = preferences.holidays
  const chosen = isHolidayRegion(setting) ? splitHolidayRegion(setting) : null

  const loadCountries = useCallback(() => listHolidayCountries(language), [language])
  const { data: countries } = useAsyncResource(loadCountries, NO_AREAS)
  const chosenCountry = chosen?.country ?? null
  const loadStates = useCallback(
    () => (chosenCountry ? listHolidayStates(chosenCountry, language) : Promise.resolve(NO_AREAS)),
    [chosenCountry, language],
  )
  const { data: states } = useAsyncResource(loadStates, NO_AREAS)

  const automatic = describeRegion(getHostHolidayRegion(host.holidays, locale), countries)
  const countryOptions = [
    { value: HOLIDAYS_AUTO, label: m.settings.holidaysAuto(automatic ?? m.settings.holidaysOff) },
    { value: HOLIDAYS_OFF, label: m.settings.holidaysOff },
    ...countries.map(({ code, name }) => ({ value: code, label: name })),
  ]
  if (chosen && !countries.some(({ code }) => code === chosen.country))
    countryOptions.push({ value: chosen.country, label: chosen.country })

  return (
    <PageSection title={m.settings.holidaysTitle} description={m.settings.holidaysDescription}>
      <SelectField
        label={m.settings.holidaysCountry}
        name="holidayCountry"
        value={chosen?.country ?? setting}
        options={countryOptions}
        onChange={(holidays) => void run({ holidays })}
      />
      {chosen && states.length > 0 && (
        <SelectField
          label={m.settings.holidaysRegion}
          name="holidayRegion"
          value={chosen.state ?? WHOLE_COUNTRY}
          options={[
            { value: WHOLE_COUNTRY, label: m.settings.holidaysWholeCountry },
            ...states.map(({ code, name }) => ({ value: code, label: name })),
          ]}
          onChange={(state) => void run({ holidays: toHolidayRegion(chosen.country, state || null) })}
        />
      )}
      <ErrorMessage message={error} />
    </PageSection>
  )
}
