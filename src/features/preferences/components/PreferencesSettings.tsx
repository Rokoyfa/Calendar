import { PageSection } from '../../../components/PageSection.tsx'
import { SegmentedField } from '../../../components/SegmentedField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { THEME_LABELS, THEMES } from '../../../utils/preferences.ts'
import { VIEW_OPTIONS } from '../../calendar/index.ts'
import { usePreferences } from '../hooks/usePreferences.ts'

const THEME_OPTIONS = THEMES.map((theme) => ({ value: theme, label: THEME_LABELS[theme] }))

export function PreferencesSettings() {
  const { preferences, updatePreferences } = usePreferences()
  const { run, error } = useAsyncAction(updatePreferences)

  return (
    <>
      <PageSection title="Darstellung">
        <SegmentedField
          label="Farbschema"
          value={preferences.theme}
          options={THEME_OPTIONS}
          onChange={(theme) => void run({ theme })}
        />
      </PageSection>

      <PageSection title="Startansicht" description="Mit dieser Ansicht öffnet sich der Kalender.">
        <SegmentedField
          label="Computer und Tablet"
          value={preferences.defaultView}
          options={VIEW_OPTIONS}
          onChange={(defaultView) => void run({ defaultView })}
        />
        <SegmentedField
          label="Handy"
          value={preferences.mobileDefaultView}
          options={VIEW_OPTIONS}
          onChange={(mobileDefaultView) => void run({ mobileDefaultView })}
        />
      </PageSection>

      <ErrorMessage message={error} />
    </>
  )
}
