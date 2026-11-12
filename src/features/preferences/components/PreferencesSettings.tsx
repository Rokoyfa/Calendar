import { PageSection } from '../../../components/PageSection.tsx'
import { SegmentedField } from '../../../components/SegmentedField.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { getLocaleChoices, getLocaleName, useI18n } from '../../../i18n/index.ts'
import { useAutomaticTimeZone } from '../../../context/TimeZoneContext.ts'
import { AUTO_TIME_ZONE, THEMES } from '../../../utils/preferences.ts'
import { formatTimeZoneLabel, listTimeZones } from '../../../utils/timeZone.ts'
import { getViewOptions } from '../../calendar/index.ts'
import { usePreferences } from '../hooks/usePreferences.ts'

export function PreferencesSettings() {
  const { m, languages } = useI18n()
  const { preferences, updatePreferences } = usePreferences()
  const { run, error } = useAsyncAction(updatePreferences)
  const themeOptions = THEMES.map((theme) => ({ value: theme, label: m.themes[theme] }))
  const choices = getLocaleChoices(languages)
  if (!choices.includes(preferences.locale)) choices.push(preferences.locale)
  const languageOptions = choices.map((choice) => ({
    value: choice,
    label: choice === 'auto' ? m.settings.languageAuto : getLocaleName(choice),
  }))
  const viewOptions = getViewOptions(m)
  const automaticTimeZone = useAutomaticTimeZone()
  const zones = listTimeZones()
  if (preferences.timeZone !== AUTO_TIME_ZONE && !zones.includes(preferences.timeZone)) zones.unshift(preferences.timeZone)
  const timeZoneOptions = [
    { value: AUTO_TIME_ZONE, label: m.settings.timeZoneAuto(formatTimeZoneLabel(automaticTimeZone)) },
    ...zones.map((zone) => ({ value: zone, label: formatTimeZoneLabel(zone) })),
  ]

  return (
    <>
      <PageSection title={m.settings.languageTitle} description={m.settings.languageDescription}>
        <SelectField
          label={m.settings.languageLabel}
          name="language"
          value={preferences.locale}
          options={languageOptions}
          onChange={(locale) => void run({ locale })}
        />
      </PageSection>

      <PageSection title={m.settings.timeZoneTitle} description={m.settings.timeZoneDescription}>
        <SelectField
          label={m.settings.timeZoneLabel}
          name="timeZone"
          value={preferences.timeZone}
          options={timeZoneOptions}
          onChange={(timeZone) => void run({ timeZone })}
        />
      </PageSection>

      <PageSection title={m.settings.themeTitle}>
        <SegmentedField
          label={m.settings.themeLabel}
          value={preferences.theme}
          options={themeOptions}
          onChange={(theme) => void run({ theme })}
        />
      </PageSection>

      <PageSection title={m.settings.startViewTitle} description={m.settings.startViewDescription}>
        <SegmentedField
          label={m.settings.desktop}
          value={preferences.defaultView}
          options={viewOptions}
          onChange={(defaultView) => void run({ defaultView })}
        />
        <SegmentedField
          label={m.settings.mobile}
          value={preferences.mobileDefaultView}
          options={viewOptions}
          onChange={(mobileDefaultView) => void run({ mobileDefaultView })}
        />
      </PageSection>

      <ErrorMessage message={error} />
    </>
  )
}
