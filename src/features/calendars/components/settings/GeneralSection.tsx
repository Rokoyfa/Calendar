import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageSection } from '../../../../components/PageSection.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { useForm } from '../../../../hooks/useForm.ts'
import type { EventColor } from '../../../../utils/event.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import type { CalendarSummary } from '../../types/calendar.ts'
import { validateDetails } from '../../utils/draft.ts'
import { hasPermission, isPersonalCalendar } from '../../utils/permissions.ts'
import { CalendarPreview } from '../CalendarPreview.tsx'
import { ColorStep } from '../create/ColorStep.tsx'
import { DetailsStep } from '../create/DetailsStep.tsx'

type GeneralValues = { name: string; description: string; color: EventColor }

export function GeneralSection({ calendar }: { calendar: CalendarSummary }) {
  const { updateCalendar, updateTeam } = useCalendars()
  const isTeam = !isPersonalCalendar(calendar)
  const canEditCalendar = hasPermission(calendar, 'manage_calendars')
  const canEditTeam = isTeam && hasPermission(calendar, 'manage_team')
  const { values, errors, setField, handleSubmit, isPending, isSuccess, error } = useForm<GeneralValues>({
    initialValues: { name: calendar.name, description: calendar.description, color: calendar.color },
    validate: validateDetails,
    prepare: (input) => ({ ...input, name: input.name.trim(), description: input.description.trim() }),
    onSubmit: async ({ name, description, color }) => {
      if (canEditCalendar && (name !== calendar.name || color !== calendar.color))
        await updateCalendar(calendar, { name, color })
      if (canEditTeam && (name !== calendar.teamName || description !== calendar.description))
        await updateTeam(calendar, { name, description })
    },
  })
  const isDirty =
    values.name.trim() !== calendar.name ||
    values.description.trim() !== calendar.description ||
    values.color !== calendar.color

  return (
    <PageSection
      title="Allgemein"
      description={
        isTeam
          ? 'Name und Farbe ändern Owner, Administratoren und Verwalter. Die Beschreibung ändern Owner und Administratoren.'
          : 'Name und Farbe deines persönlichen Kalenders. Nur du siehst ihn.'
      }
    >
      <Form onSubmit={handleSubmit}>
        {isTeam ? (
          <DetailsStep
            values={values}
            errors={errors}
            disabled={{ name: !canEditCalendar, description: !canEditTeam }}
            onChange={(changes) => {
              if (changes.name !== undefined) setField('name', changes.name)
              if (changes.description !== undefined) setField('description', changes.description)
            }}
          />
        ) : (
          <DetailsStep
            values={values}
            errors={errors}
            hideDescription
            disabled={{ name: !canEditCalendar }}
            onChange={({ name }) => name !== undefined && setField('name', name)}
          />
        )}
        {canEditCalendar ? (
          <ColorStep color={values.color} onChange={(color) => setField('color', color)} />
        ) : (
          <CalendarPreview color={values.color} />
        )}
        <ActionFeedback error={error} success={isSuccess && !isDirty && 'Gespeichert.'} />
        {(canEditCalendar || canEditTeam) && (
          <div className="formActions">
            <Button type="submit" isPending={isPending} pendingLabel="Wird gespeichert …" disabled={!isDirty}>
              Speichern
            </Button>
          </div>
        )}
      </Form>
    </PageSection>
  )
}
