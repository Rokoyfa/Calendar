import { useState, type SubmitEventHandler } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../../../components/Button.tsx'
import { Form } from '../../../../components/Form.tsx'
import { PageLayout } from '../../../../components/PageLayout.tsx'
import { ActionFeedback } from '../../../../components/StatusMessage.tsx'
import { Stepper } from '../../../../components/Stepper.tsx'
import { ROUTES } from '../../../../config/routes.ts'
import { useAsyncAction } from '../../../../hooks/useAsyncAction.ts'
import { hasFieldErrors, type FieldErrors } from '../../../../utils/validation.ts'
import { useAuth } from '../../../authorization/index.ts'
import { EMPTY_CALENDAR_DRAFT } from '../../constants/calendars.ts'
import { useCalendars } from '../../hooks/useCalendars.ts'
import type { CalendarDraft } from '../../types/calendar.ts'
import { validateDetails, type DetailsValues } from '../../utils/draft.ts'
import { ColorStep } from './ColorStep.tsx'
import { DetailsStep } from './DetailsStep.tsx'
import { MembersStep } from './MembersStep.tsx'
import { ReviewStep } from './ReviewStep.tsx'

const STEPS = [
  { label: 'Name', title: 'Wie heißt der Kalender?', hint: 'Name und Beschreibung sehen alle Mitglieder.' },
  {
    label: 'Farbe',
    title: 'Welche Farbe bekommt er?',
    hint: 'Neue Termine in diesem Kalender starten mit dieser Farbe.',
  },
  {
    label: 'Mitglieder',
    title: 'Wen möchtest du einladen?',
    hint: 'Eingeladene bekommen eine E-Mail und sehen den Kalender, sobald sie annehmen.',
  },
  { label: 'Überprüfen', title: 'Alles richtig?', hint: 'Du bist Owner und kannst alles später noch ändern.' },
] as const

const LAST_STEP = STEPS.length - 1

export function CreateCalendarPage() {
  const { user } = useAuth()
  const { createCalendar, selectCalendar } = useCalendars()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<CalendarDraft>(EMPTY_CALENDAR_DRAFT)
  const [detailErrors, setDetailErrors] = useState<FieldErrors<DetailsValues>>({})
  const {
    run: create,
    isPending,
    error,
  } = useAsyncAction(async () => {
    const calendar = await createCalendar(draft)
    selectCalendar(calendar.id)
    await navigate(ROUTES.calendar)
  })

  const update = (changes: Partial<CalendarDraft>) => setDraft((current) => ({ ...current, ...changes }))

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (step === 0) {
      const errors = validateDetails(draft)
      setDetailErrors(errors)
      if (hasFieldErrors(errors)) return
    }
    if (step === LAST_STEP) void create()
    else setStep(step + 1)
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <DetailsStep
            autoFocus
            values={draft}
            errors={detailErrors}
            onChange={(changes) => {
              update(changes)
              setDetailErrors({})
            }}
          />
        )
      case 1:
        return <ColorStep color={draft.color} onChange={(color) => update({ color })} />
      case 2:
        return (
          <MembersStep
            invitations={draft.invitations}
            ownEmail={user?.email ?? null}
            onChange={(invitations) => update({ invitations })}
          />
        )
      default:
        return <ReviewStep draft={draft} />
    }
  }

  const { title, hint } = STEPS[step]

  return (
    <PageLayout title="Neuer Kalender" variant="full">
      <div className="wizard">
        <Stepper steps={STEPS} current={step} onSelect={setStep} />
        <Form onSubmit={handleSubmit} className="wizardPanel">
          <header className="wizardHeader">
            <p className="wizardStepCount">
              Schritt {step + 1} von {STEPS.length}
            </p>
            <h2 className="wizardTitle">{title}</h2>
            <p className="formHint">{hint}</p>
          </header>
          {renderStep()}
          <ActionFeedback error={error} />
          <div className="wizardActions">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Zurück
              </Button>
            )}
            <Button type="submit" isPending={isPending} pendingLabel="Wird erstellt …">
              {step === LAST_STEP ? 'Kalender erstellen' : 'Weiter'}
            </Button>
          </div>
        </Form>
      </div>
    </PageLayout>
  )
}
