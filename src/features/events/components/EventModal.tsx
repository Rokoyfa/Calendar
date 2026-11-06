import { useState, type SubmitEventHandler } from 'react'
import { useI18n } from '../../../i18n/index.ts'
import { Button } from '../../../components/Button.tsx'
import { DateTimeField } from '../../../components/DateTimeField.tsx'
import { Form } from '../../../components/Form.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { isISODate } from '../../../utils/date.ts'
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  hasValidationErrors,
  moveToStartDate,
  normalizeEventInput,
  validateEventInput,
  type EditScope,
  type EventInput,
  type EventOccurrence,
  type EventValidationErrors,
} from '../../../utils/event.ts'
import { adaptRecurrenceToStart, type Recurrence } from '../../../utils/recurrence.ts'
import type { EventModalMode } from '../types/eventModal.ts'
import { getScopeOptions } from '../utils/scopeOptions.ts'
import { ColorPicker } from './ColorPicker.tsx'
import { RecurrenceFields } from './RecurrenceFields.tsx'
import { RecurrenceScopeModal } from './RecurrenceScopeModal.tsx'

type EventModalProps = {
  initialValue: EventInput
  occurrence?: EventOccurrence | null
  notice?: string
  onSave: (input: EventInput, scope: EditScope) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}

type PendingSave = {
  input: EventInput
  options: EditScope[]
}

export function EventModal({ initialValue, occurrence = null, notice, onSave, onDelete, onClose }: EventModalProps) {
  const i18n = useI18n()
  const { m } = i18n
  const mode: EventModalMode = occurrence ? 'edit' : 'create'
  const [values, setValues] = useState(initialValue)
  const [errors, setErrors] = useState<EventValidationErrors>({})
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null)
  const { run: save, isPending, error: submitError } = useAsyncAction(onSave)

  const update = (changes: Partial<EventInput>, clearedErrors: readonly (keyof EventValidationErrors)[]) => {
    setValues((current) => ({ ...current, ...changes }))
    setErrors((current) => ({ ...current, ...Object.fromEntries(clearedErrors.map((key) => [key, undefined])) }))
  }

  const setField = <K extends Exclude<keyof EventInput, 'recurrence'>>(field: K, value: EventInput[K]) =>
    update({ [field]: value }, [field])

  const changeStartDate = (startDate: string) =>
    update(
      {
        ...(isISODate(values.startDate) && isISODate(values.endDate) && isISODate(startDate)
          ? moveToStartDate(values, startDate)
          : { startDate }),
        recurrence: adaptRecurrenceToStart(values.recurrence, values.startDate, startDate),
      },
      ['startDate', 'endDate'],
    )

  const setRecurrence = (recurrence: Recurrence | null) => update({ recurrence }, ['recurrence'])

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const input = normalizeEventInput(values)
    const nextErrors = validateEventInput(input, m)
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    const options = getScopeOptions(occurrence, input.recurrence)
    if (options.length > 1) setPendingSave({ input, options })
    else void save(input, options[0])
  }

  const handleScopeSelect = (scope: EditScope) => {
    if (!pendingSave) return
    setPendingSave(null)
    void save(pendingSave.input, scope)
  }

  return (
    <>
      <Modal title={mode === 'create' ? m.events.createTitle : m.events.editTitle} onClose={onClose}>
        <Form className="eventForm" onSubmit={handleSubmit}>
          {notice && <p className="formHint eventNotice">{notice}</p>}
          <TextField
            label={m.events.title}
            name="title"
            autoComplete="off"
            maxLength={EVENT_TITLE_MAX_LENGTH}
            value={values.title}
            error={errors.title}
            onChange={(title) => setField('title', title)}
            data-autofocus
          />

          <DateTimeField
            name="start"
            dateLabel={m.events.startDate}
            timeLabel={m.events.startTime}
            date={values.startDate}
            time={values.start}
            dateError={errors.startDate}
            timeError={errors.start}
            onDateChange={changeStartDate}
            onTimeChange={(start) => setField('start', start)}
          />

          <DateTimeField
            name="end"
            dateLabel={m.events.endDate}
            timeLabel={m.events.endTime}
            date={values.endDate}
            time={values.end}
            minDate={values.startDate}
            dateError={errors.endDate}
            timeError={errors.end}
            onDateChange={(endDate) => setField('endDate', endDate)}
            onTimeChange={(end) => setField('end', end)}
          />

          <RecurrenceFields
            value={values.recurrence}
            startDate={values.startDate}
            errors={errors.recurrence ?? {}}
            onChange={setRecurrence}
          />

          <FormField label={m.events.description} error={errors.description}>
            <textarea
              className="textarea eventDescription"
              name="description"
              maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
              value={values.description}
              onChange={(event) => setField('description', event.target.value)}
            />
          </FormField>

          <ColorPicker value={values.color} onChange={(color) => setField('color', color)} />

          <ErrorMessage message={submitError} />

          <div className="modalActions">
            <Button type="submit" isPending={isPending} pendingLabel={m.common.saving}>
              {m.common.save}
            </Button>
            {onDelete && (
              <Button variant="danger" disabled={isPending} onClick={onDelete}>
                {m.common.delete}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              {m.common.cancel}
            </Button>
          </div>
        </Form>
      </Modal>

      {pendingSave && (
        <RecurrenceScopeModal
          options={pendingSave.options}
          onSelect={handleScopeSelect}
          onClose={() => setPendingSave(null)}
        />
      )}
    </>
  )
}
