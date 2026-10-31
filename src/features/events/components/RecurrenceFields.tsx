import { fromISODate, ISO_DATE_PATTERN, toISODate } from '../../../utils/date.ts'
import {
  createRecurrence,
  formatMonthlyMode,
  formatRecurrence,
  getMonthlyModeOptions,
  isMonthlyMode,
  isRecurrenceFrequency,
  normalizeWeekdays,
  RECURRENCE_COUNT_MAX,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_FREQUENCY_LABELS,
  RECURRENCE_INTERVAL_MAX,
  RECURRENCE_UNIT_LABELS,
  WEEKDAY_SHORT_LABELS,
  type Recurrence,
} from '../../../utils/recurrence.ts'

type RecurrenceErrors = { interval?: string; weekdays?: string; until?: string; count?: string }

type RecurrenceFieldsProps = {
  value: Recurrence | null
  startDate: string
  errors: RecurrenceErrors
  onChange: (recurrence: Recurrence | null) => void
}

const NEVER = 'never'
const ON_DATE = 'date'
const AFTER_COUNT = 'count'
const DEFAULT_COUNT = 10

const defaultUntil = (startDate: string) => {
  const start = fromISODate(startDate)
  return toISODate(new Date(start.getFullYear(), start.getMonth() + 3, start.getDate()))
}

const getEndMode = ({ until, count }: Recurrence) => (until !== null ? ON_DATE : count !== null ? AFTER_COUNT : NEVER)

const numberValue = (value: number | null) => (value === null || Number.isNaN(value) ? '' : value)

export function RecurrenceFields({ value, startDate, errors, onChange }: RecurrenceFieldsProps) {
  const hasValidStart = ISO_DATE_PATTERN.test(startDate)

  const handleFrequencyChange = (frequency: string) => {
    if (!isRecurrenceFrequency(frequency)) return onChange(null)
    if (value) return onChange({ ...value, frequency })
    if (hasValidStart) onChange(createRecurrence(frequency, startDate))
  }

  const handleEndModeChange = (mode: string) => {
    if (!value) return
    onChange({
      ...value,
      until: mode === ON_DATE && hasValidStart ? defaultUntil(startDate) : null,
      count: mode === AFTER_COUNT ? DEFAULT_COUNT : null,
    })
  }

  const toggleWeekday = (weekday: number) => {
    if (!value) return
    const weekdays = value.weekdays.includes(weekday)
      ? value.weekdays.filter((day) => day !== weekday)
      : normalizeWeekdays([...value.weekdays, weekday])
    onChange({ ...value, weekdays })
  }

  const unit = value ? RECURRENCE_UNIT_LABELS[value.frequency] : null
  const hasErrors = Object.values(errors).some(Boolean)
  const endMode = value ? getEndMode(value) : NEVER

  return (
    <div className="recurrence">
      <div className="eventFormRow">
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
          <label className="field">
            <span className="descriptor">Alle</span>
            <span className="recurrenceInline">
              <input
                className="input recurrenceNumber"
                type="number"
                name="recurrenceInterval"
                min={1}
                max={RECURRENCE_INTERVAL_MAX}
                step={1}
                value={numberValue(value.interval)}
                aria-invalid={Boolean(errors.interval)}
                onChange={(event) => onChange({ ...value, interval: event.target.valueAsNumber })}
              />
              <span>{value.interval === 1 ? unit.one : unit.many}</span>
            </span>
            {errors.interval && <span className="errorText">{errors.interval}</span>}
          </label>
        )}
      </div>

      {value?.frequency === 'weekly' && (
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

      {value?.frequency === 'monthly' && hasValidStart && (
        <label className="field">
          <span className="descriptor">Im Monat</span>
          <select
            className="input"
            name="recurrenceMonthlyMode"
            value={value.monthlyMode}
            onChange={(event) => {
              if (isMonthlyMode(event.target.value)) onChange({ ...value, monthlyMode: event.target.value })
            }}
          >
            {getMonthlyModeOptions(startDate).map((mode) => (
              <option key={mode} value={mode}>
                {formatMonthlyMode(mode, startDate)}
              </option>
            ))}
          </select>
        </label>
      )}

      {value && (
        <div className="eventFormRow">
          <label className="field">
            <span className="descriptor">Endet</span>
            <select
              className="input"
              name="recurrenceEnds"
              value={endMode}
              onChange={(event) => handleEndModeChange(event.target.value)}
            >
              <option value={NEVER}>Nie</option>
              <option value={ON_DATE}>Am Datum</option>
              <option value={AFTER_COUNT}>Nach Anzahl</option>
            </select>
          </label>

          {endMode === ON_DATE && (
            <label className="field">
              <span className="descriptor">Letzter Termin</span>
              <input
                className="input"
                type="date"
                name="recurrenceUntil"
                min={startDate}
                value={value.until ?? ''}
                aria-invalid={Boolean(errors.until)}
                onChange={(event) => onChange({ ...value, until: event.target.value })}
              />
              {errors.until && <span className="errorText">{errors.until}</span>}
            </label>
          )}

          {endMode === AFTER_COUNT && (
            <label className="field">
              <span className="descriptor">Nach</span>
              <span className="recurrenceInline">
                <input
                  className="input recurrenceNumber"
                  type="number"
                  name="recurrenceCount"
                  min={1}
                  max={RECURRENCE_COUNT_MAX}
                  step={1}
                  value={numberValue(value.count)}
                  aria-invalid={Boolean(errors.count)}
                  onChange={(event) => onChange({ ...value, count: event.target.valueAsNumber })}
                />
                <span>{value.count === 1 ? 'Termin' : 'Terminen'}</span>
              </span>
              {errors.count && <span className="errorText">{errors.count}</span>}
            </label>
          )}
        </div>
      )}

      {value && hasValidStart && !hasErrors &&
        Number.isInteger(value.interval) &&
        (value.count === null || Number.isInteger(value.count)) && (
        <p className="recurrenceSummary">{formatRecurrence(value, startDate)}</p>
      )}
    </div>
  )
}
