import { PageSection } from '../../../components/PageSection.tsx'
import { SegmentedField } from '../../../components/SegmentedField.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { LOCALE_CHOICES, useI18n } from '../../../i18n/index.ts'
import { THEMES } from '../../../utils/preferences.ts'
import { getViewOptions } from '../../calendar/index.ts'
import { usePreferences } from '../hooks/usePreferences.ts'

export function PreferencesSettings() {
  const { m } = useI18n()
  const { preferences, updatePreferences } = usePreferences()
  const { run, error } = useAsyncAction(updatePreferences)
  const themeOptions = THEMES.map((theme) => ({ value: theme, label: m.themes[theme] }))
  const languageOptions = LOCALE_CHOICES.map((choice) => ({ value: choice, label: m.settings.languages[choice] }))
  const viewOptions = getViewOptions(m)

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
