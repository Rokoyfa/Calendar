import { useState, type FormEvent } from 'react'
import { DateTimeField } from '../../../components/DateTimeField.tsx'
import { ErrorMessage } from '../../../components/ErrorMessage.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { Modal } from '../../../components/Modal.tsx'
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
  onSave: (input: EventInput, scope: EditScope) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}

type PendingSave = {
  input: EventInput
  options: EditScope[]
}

const TITLES: Record<EventModalMode, string> = {
  create: 'Neuer Termin',
  edit: 'Termin bearbeiten',
}

export function EventModal({ initialValue, occurrence = null, onSave, onDelete, onClose }: EventModalProps) {
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = normalizeEventInput(values)
    const nextErrors = validateEventInput(input)
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
      <Modal title={TITLES[mode]} onClose={onClose}>
        <form className="formSection eventForm" noValidate onSubmit={handleSubmit}>
          <FormField label="Titel" error={errors.title}>
            <input
              className="input"
              name="title"
              autoComplete="off"
              maxLength={EVENT_TITLE_MAX_LENGTH}
              value={values.title}
              aria-invalid={Boolean(errors.title)}
              onChange={(event) => setField('title', event.target.value)}
              data-autofocus
            />
          </FormField>

          <DateTimeField
            name="start"
            dateLabel="Startdatum"
            timeLabel="Beginn"
            date={values.startDate}
            time={values.start}
            dateError={errors.startDate}
            timeError={errors.start}
            onDateChange={changeStartDate}
            onTimeChange={(start) => setField('start', start)}
          />

          <DateTimeField
            name="end"
            dateLabel="Enddatum"
            timeLabel="Ende"
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

          <FormField label="Beschreibung" error={errors.description}>
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
            <button type="submit" className="button" disabled={isPending}>
              {isPending ? 'Speichert …' : 'Speichern'}
            </button>
            {onDelete && (
              <button type="button" className="button button--danger" disabled={isPending} onClick={onDelete}>
                Löschen
              </button>
            )}
            <button type="button" className="button button--secondary" onClick={onClose}>
              Abbrechen
            </button>
          </div>
        </form>
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
