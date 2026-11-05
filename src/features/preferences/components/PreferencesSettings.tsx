import { FormField } from '../../../components/FormField.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
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
        <FormField as="fieldset" label="Farbschema">
          <SegmentedControl
            label="Farbschema"
            value={preferences.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => void run({ theme })}
          />
        </FormField>
      </PageSection>

      <PageSection title="Startansicht" description="Mit dieser Ansicht öffnet sich der Kalender.">
        <FormField as="fieldset" label="Computer und Tablet">
          <SegmentedControl
            label="Startansicht auf Computer und Tablet"
            value={preferences.defaultView}
            options={VIEW_OPTIONS}
            onChange={(defaultView) => void run({ defaultView })}
          />
        </FormField>
        <FormField as="fieldset" label="Handy">
          <SegmentedControl
            label="Startansicht auf dem Handy"
            value={preferences.mobileDefaultView}
            options={VIEW_OPTIONS}
            onChange={(mobileDefaultView) => void run({ mobileDefaultView })}
          />
        </FormField>
      </PageSection>

      <ErrorMessage message={error} />
    </>
  )
}
