import { fromISODate, toISODate } from '../../../utils/date.ts'
import {
  createRecurrence,
  formatRecurrence,
  isRecurrenceFrequency,
  normalizeWeekdays,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_FREQUENCY_LABELS,
  RECURRENCE_INTERVAL_MAX,
  RECURRENCE_UNIT_LABELS,
  WEEKDAY_SHORT_LABELS,
  type Recurrence,
} from '../../../utils/recurrence.ts'

type RecurrenceFieldsProps = {
  value: Recurrence | null
  startDate: string
  errors: { interval?: string; weekdays?: string; until?: string }
  onChange: (recurrence: Recurrence | null) => void
}

const NEVER = 'never'
const ON_DATE = 'date'

const defaultUntil = (startDate: string) => {
  const start = fromISODate(startDate)
  return toISODate(new Date(start.getFullYear(), start.getMonth() + 3, start.getDate()))
}

export function RecurrenceFields({ value, startDate, errors, onChange }: RecurrenceFieldsProps) {
  const handleFrequencyChange = (frequency: string) => {
    if (!isRecurrenceFrequency(frequency)) return onChange(null)
    onChange(value ? { ...value, frequency } : createRecurrence(frequency, startDate))
  }

  const toggleWeekday = (weekday: number) => {
    if (!value) return
    const weekdays = value.weekdays.includes(weekday)
      ? value.weekdays.filter((day) => day !== weekday)
      : normalizeWeekdays([...value.weekdays, weekday])
    onChange({ ...value, weekdays })
  }

  const unit = value ? RECURRENCE_UNIT_LABELS[value.frequency] : null
  const hasErrors = Boolean(errors.interval || errors.weekdays || errors.until)

  return (
    <div className="recurrence">
      <label className="field">
        <span className="descriptor">Wiederholen</span>
        <select
          className="input"
          name="recurrenceFrequency"
          value={value?.frequency ?? NEVER}
          onChange={(event) => handleFrequencyChange(event.target.value)}
        >
          <option value={NEVER}>Nie</option>
          {RECURRENCE_FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {RECURRENCE_FREQUENCY_LABELS[frequency]}
            </option>
          ))}
        </select>
      </label>

      {value && unit && (
        <>
          <div className="eventFormRow">
            <label className="field">
              <span className="descriptor">Alle</span>
              <span className="recurrenceInterval">
                <input
                  className="input"
                  type="number"
                  name="recurrenceInterval"
                  min={1}
                  max={RECURRENCE_INTERVAL_MAX}
                  step={1}
                  value={Number.isNaN(value.interval) ? '' : value.interval}
                  aria-invalid={Boolean(errors.interval)}
                  onChange={(event) => onChange({ ...value, interval: event.target.valueAsNumber })}
                />
                <span>{value.interval === 1 ? unit.one : unit.many}</span>
              </span>
              {errors.interval && <span className="errorText">{errors.interval}</span>}
            </label>

            <label className="field">
              <span className="descriptor">Endet</span>
              <select
                className="input"
                name="recurrenceEnds"
                value={value.until === null ? NEVER : ON_DATE}
                onChange={(event) =>
                  onChange({ ...value, until: event.target.value === ON_DATE ? defaultUntil(startDate) : null })
                }
              >
                <option value={NEVER}>Nie</option>
                <option value={ON_DATE}>Am Datum</option>
              </select>
            </label>

            {value.until !== null && (
              <label className="field">
                <span className="descriptor">Letzter Termin</span>
                <input
                  className="input"
                  type="date"
                  name="recurrenceUntil"
                  min={startDate}
                  value={value.until}
                  aria-invalid={Boolean(errors.until)}
                  onChange={(event) => onChange({ ...value, until: event.target.value })}
                />
                {errors.until && <span className="errorText">{errors.until}</span>}
              </label>
            )}
          </div>

          {value.frequency === 'weekly' && (
            <fieldset className="weekdayPicker">
              <legend className="descriptor">An diesen Tagen</legend>
              <div className="weekdays">
                {WEEKDAY_SHORT_LABELS.map((label, weekday) => (
                  <label key={label} className={value.weekdays.includes(weekday) ? 'weekday active' : 'weekday'}>
                    <input
                      type="checkbox"
                      className="visuallyHidden"
                      checked={value.weekdays.includes(weekday)}
                      onChange={() => toggleWeekday(weekday)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {errors.weekdays && <span className="errorText">{errors.weekdays}</span>}
            </fieldset>
          )}

          {!hasErrors && Number.isInteger(value.interval) && (
            <p className="recurrenceSummary">{formatRecurrence(value, startDate)}</p>
          )}
        </>
      )}
    </div>
  )
}
