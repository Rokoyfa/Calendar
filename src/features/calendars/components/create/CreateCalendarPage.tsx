import { useState, type SubmitEventHandler } from 'react'
import { useNavigate } from 'react-router'
import { useI18n } from '../../../../i18n/index.ts'
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

export function CreateCalendarPage() {
  const { m } = useI18n()
  const { create: text } = m.calendars
  const steps = text.steps
  const lastStep = steps.length - 1
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
      const errors = validateDetails(draft, m)
      setDetailErrors(errors)
      if (hasFieldErrors(errors)) return
    }
    if (step === lastStep) void create()
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

  const { title, hint } = steps[step]

  return (
    <PageLayout title={text.title} variant="full">
      <div className="wizard">
        <Stepper steps={steps} current={step} onSelect={setStep} />
        <Form onSubmit={handleSubmit} className="wizardPanel">
          <header className="wizardHeader">
            <p className="wizardStepCount">{text.stepCount(step + 1, steps.length)}</p>
            <h2 className="wizardTitle">{title}</h2>
            <p className="formHint">{hint}</p>
          </header>
          {renderStep()}
          <ActionFeedback error={error} />
          <div className="wizardActions">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                {m.common.back}
              </Button>
            )}
            <Button type="submit" isPending={isPending} pendingLabel={text.pending}>
              {step === lastStep ? text.submit : text.next}
            </Button>
          </div>
        </Form>
      </div>
    </PageLayout>
  )
}
