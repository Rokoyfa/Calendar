import { useState, type FormEvent } from 'react'
import { Modal } from '../../../components/Modal.tsx'
import { addDaysToISODate, daysBetween, ISO_DATE_PATTERN } from '../../../utils/date.ts'
import { getErrorMessage } from '../../../utils/error.ts'
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  hasValidationErrors,
  normalizeEventInput,
  validateEventInput,
  type EventInput,
  type EventValidationErrors,
} from '../../../utils/event.ts'
import type { EventModalMode } from '../types/eventModal.ts'
import { ColorPicker } from './ColorPicker.tsx'

type EventModalProps = {
  mode: EventModalMode
  initialValue: EventInput
  onSave: (input: EventInput) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}

export function EventModal({ mode, initialValue, onSave, onDelete, onClose }: EventModalProps) {
  const [values, setValues] = useState(initialValue)
  const [errors, setErrors] = useState<EventValidationErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const setField = <K extends keyof EventInput>(field: K, value: EventInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  const changeStartDate = (startDate: string) => {
    setValues((current) => {
      const canShift = ISO_DATE_PATTERN.test(current.startDate) && ISO_DATE_PATTERN.test(current.endDate)
      const endDate =
        canShift && ISO_DATE_PATTERN.test(startDate)
          ? addDaysToISODate(startDate, daysBetween(current.startDate, current.endDate))
          : current.endDate
      return { ...current, startDate, endDate }
    })
    setErrors((current) =>
      current.startDate || current.endDate ? { ...current, startDate: undefined, endDate: undefined } : current,
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = normalizeEventInput(values)
    const nextErrors = validateEventInput(input)
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    setIsSaving(true)
    setSubmitError(null)
    try {
      await onSave(input)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
      setIsSaving(false)
    }
  }

  return (
    <Modal title={mode === 'create' ? 'Neuer Termin' : 'Termin bearbeiten'} onClose={onClose}>
      <form className="eventForm" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span className="descriptor">Titel</span>
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
          {errors.title && <span className="errorText">{errors.title}</span>}
        </label>

        <div className="eventFormRow">
          <label className="field">
            <span className="descriptor">Startdatum</span>
            <input
              className="input"
              type="date"
              name="startDate"
              value={values.startDate}
              aria-invalid={Boolean(errors.startDate)}
              onChange={(event) => changeStartDate(event.target.value)}
            />
            {errors.startDate && <span className="errorText">{errors.startDate}</span>}
          </label>
          <label className="field">
            <span className="descriptor">Beginn</span>
            <input
              className="input"
              type="time"
              name="start"
              value={values.start}
              aria-invalid={Boolean(errors.start)}
              onChange={(event) => setField('start', event.target.value)}
            />
            {errors.start && <span className="errorText">{errors.start}</span>}
          </label>
        </div>

        <div className="eventFormRow">
          <label className="field">
            <span className="descriptor">Enddatum</span>
            <input
              className="input"
              type="date"
              name="endDate"
              min={values.startDate}
              value={values.endDate}
              aria-invalid={Boolean(errors.endDate)}
              onChange={(event) => setField('endDate', event.target.value)}
            />
            {errors.endDate && <span className="errorText">{errors.endDate}</span>}
          </label>
          <label className="field">
            <span className="descriptor">Ende</span>
            <input
              className="input"
              type="time"
              name="end"
              value={values.end}
              aria-invalid={Boolean(errors.end)}
              onChange={(event) => setField('end', event.target.value)}
            />
            {errors.end && <span className="errorText">{errors.end}</span>}
          </label>
        </div>

        <label className="field">
          <span className="descriptor">Beschreibung</span>
          <textarea
            className="textarea eventDescription"
            name="description"
            maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
          />
          {errors.description && <span className="errorText">{errors.description}</span>}
        </label>

        <ColorPicker value={values.color} onChange={(color) => setField('color', color)} />

        {submitError && (
          <p className="errorText" role="alert">
            {submitError}
          </p>
        )}

        <div className="modalActions">
          <button type="submit" className="button" disabled={isSaving}>
            {isSaving ? 'Speichert …' : 'Speichern'}
          </button>
          {onDelete && (
            <button type="button" className="button button--danger" disabled={isSaving} onClick={onDelete}>
              Löschen
            </button>
          )}
          <button type="button" className="button button--secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Modal>
  )
}
