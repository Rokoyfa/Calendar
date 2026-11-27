import { useState } from 'react'
import { FormField } from '../../../components/FormField.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { SegmentedField } from '../../../components/SegmentedField.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isPlanningWindow, PLANNING_COUNTRY_AUTO, PLANNING_DISTRIBUTIONS } from '../../../domain/preferences.ts'
import { usePreferences } from '../../preferences/index.ts'
import {
  getCountryName,
  useAutomaticPlanningCountry,
  usePlanningCountry,
  usePlanningCountryName,
} from '../hooks/usePlanningCountryName.ts'
import { getWorkingTimeLaw, PLANNING_COUNTRIES } from '../utils/workingTimeLaw.ts'

export function TaskPlanningSettings() {
  const { m, format, language } = useI18n()
  const text = m.settings.planning
  const { preferences, updatePreferences } = usePreferences()
  const { run, error } = useAsyncAction(updatePreferences)
  const automaticName = usePlanningCountryName(useAutomaticPlanningCountry())
  const country = usePlanningCountry()
  const law = getWorkingTimeLaw(country)
  const [start, setStart] = useState(preferences.planningDayStart)
  const [end, setEnd] = useState(preferences.planningDayEnd)
  const isWindowValid = isPlanningWindow(start, end)

  const countries = PLANNING_COUNTRIES.map((code) => ({ value: code, label: getCountryName(code, language) })).sort(
    (a, b) => a.label.localeCompare(b.label, language),
  )
  const countryOptions = [{ value: PLANNING_COUNTRY_AUTO, label: text.countryAuto(automaticName) }, ...countries]
  if (!countryOptions.some((option) => option.value === preferences.planningCountry))
    countryOptions.push({
      value: preferences.planningCountry,
      label: text.withGeneralRules(getCountryName(preferences.planningCountry, language)),
    })

  const changeWindow = (nextStart: string, nextEnd: string) => {
    setStart(nextStart)
    setEnd(nextEnd)
    if (
      isPlanningWindow(nextStart, nextEnd) &&
      (nextStart !== preferences.planningDayStart || nextEnd !== preferences.planningDayEnd)
    )
      void run({ planningDayStart: nextStart, planningDayEnd: nextEnd })
  }

  const rules = [
    text.rest(format.effort(law.restMinutes)),
    text.daily(format.effort(law.maxDailyMinutes)),
    text.weekly(format.effort(law.maxWeeklyMinutes)),
    text.stretch(format.effort(law.maxStretchMinutes)),
    ...law.breaks.map((rule) => text.breakRule(format.effort(rule.over), format.effort(rule.minutes))),
    text.restDays(format.list(law.restDays.map((day) => format.weekdayName(day)))),
  ]

  return (
    <>
      <PageSection title={text.title} description={text.description}>
        <SegmentedField
          label={text.distribution}
          value={preferences.planningDistribution}
          options={PLANNING_DISTRIBUTIONS.map((value) => ({ value, label: text.distributions[value] }))}
          onChange={(planningDistribution) => void run({ planningDistribution })}
        />
        <SelectField
          label={text.country}
          name="planningCountry"
          value={preferences.planningCountry}
          options={countryOptions}
          onChange={(planningCountry) => void run({ planningCountry })}
        />
        <ul className="planningRules">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="formHint">{text.rulesNote}</p>
      </PageSection>
      <PageSection title={text.window} description={text.windowDescription}>
        <div className="formRow">
          <FormField label={text.windowStart}>
            <input
              className="input"
              type="time"
              name="planningDayStart"
              step={900}
              value={start}
              aria-invalid={!isWindowValid}
              onChange={(event) => changeWindow(event.target.value, end)}
            />
          </FormField>
          <FormField label={text.windowEnd}>
            <input
              className="input"
              type="time"
              name="planningDayEnd"
              step={900}
              value={end}
              aria-invalid={!isWindowValid}
              onChange={(event) => changeWindow(start, event.target.value)}
            />
          </FormField>
        </div>
        <ErrorMessage message={!isWindowValid && text.windowInvalid} />
      </PageSection>
      <ErrorMessage message={error} />
    </>
  )
}
