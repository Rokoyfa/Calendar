import { ChoiceChip } from '../../../components/ChoiceChip.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { NumberField } from '../../../components/NumberField.tsx'
import { SelectField, type SelectOption } from '../../../components/SelectField.tsx'
import { addMonthsToISODate, isISODate, WEEKDAY_SHORT_LABELS } from '../../../utils/date.ts'
import { isIntegerInRange } from '../../../utils/number.ts'
import {
  createRecurrence,
  formatMonthlyMode,
  formatRecurrence,
  getMonthlyModeOptions,
  hasRecurrenceErrors,
  normalizeWeekdays,
  RECURRENCE_COUNT_MAX,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_FREQUENCY_LABELS,
  RECURRENCE_INTERVAL_MAX,
  RECURRENCE_UNIT_LABELS,
  type Recurrence,
  type RecurrenceFrequency,
  type RecurrenceValidationErrors,
} from '../../../utils/recurrence.ts'

type RecurrenceFieldsProps = {
  value: Recurrence | null
  startDate: string
  errors: RecurrenceValidationErrors
  onChange: (recurrence: Recurrence | null) => void
}

type EndMode = 'never' | 'date' | 'count'

const DEFAULT_COUNT = 10
const DEFAULT_UNTIL_MONTHS = 3

const FREQUENCY_OPTIONS: SelectOption<RecurrenceFrequency | 'never'>[] = [
  { value: 'never', label: 'Nie' },
  ...RECURRENCE_FREQUENCIES.map((frequency) => ({ value: frequency, label: RECURRENCE_FREQUENCY_LABELS[frequency] })),
]

const END_OPTIONS: SelectOption<EndMode>[] = [
  { value: 'never', label: 'Nie' },
  { value: 'date', label: 'Am Datum' },
  { value: 'count', label: 'Nach Anzahl' },
]

const getEndMode = ({ until, count }: Recurrence): EndMode =>
  until !== null ? 'date' : count !== null ? 'count' : 'never'

const pluralize = (count: number | null, one: string, many: string) => (count === 1 ? one : many)

const canSummarize = (recurrence: Recurrence, startDate: string, errors: RecurrenceValidationErrors) =>
  isISODate(startDate) &&
  !hasRecurrenceErrors(errors) &&
  isIntegerInRange(recurrence.interval, 1) &&
  (recurrence.count === null || isIntegerInRange(recurrence.count, 1))

export function RecurrenceFields({ value, startDate, errors, onChange }: RecurrenceFieldsProps) {
  const hasValidStart = isISODate(startDate)

  const changeFrequency = (frequency: RecurrenceFrequency | 'never') => {
    if (frequency === 'never') onChange(null)
    else if (value) onChange({ ...value, frequency })
    else if (hasValidStart) onChange(createRecurrence(frequency, startDate))
  }

  const changeEndMode = (mode: EndMode) => {
    if (!value) return
    onChange({
      ...value,
      until: mode === 'date' && hasValidStart ? addMonthsToISODate(startDate, DEFAULT_UNTIL_MONTHS) : null,
      count: mode === 'count' ? DEFAULT_COUNT : null,
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
  const endMode = value ? getEndMode(value) : 'never'

  return (
    <div className="formSection">
      <div className="formRow">
        <SelectField
          label="Wiederholen"
          name="recurrenceFrequency"
          value={value?.frequency ?? 'never'}
          options={FREQUENCY_OPTIONS}
          onChange={changeFrequency}
        />
        {value && unit && (
          <NumberField
            label="Alle"
            name="recurrenceInterval"
            value={value.interval}
            min={1}
            max={RECURRENCE_INTERVAL_MAX}
            unit={pluralize(value.interval, unit.one, unit.many)}
            error={errors.interval}
            onChange={(interval) => onChange({ ...value, interval })}
          />
        )}
      </div>

      {value?.frequency === 'weekly' && (
        <FormField as="fieldset" label="An diesen Tagen" error={errors.weekdays}>
          <div className="choiceList">
            {WEEKDAY_SHORT_LABELS.map((label, weekday) => (
              <ChoiceChip
                key={label}
                type="checkbox"
                label={label}
                checked={value.weekdays.includes(weekday)}
                onChange={() => toggleWeekday(weekday)}
                className="weekday"
              >
                {label}
              </ChoiceChip>
            ))}
          </div>
        </FormField>
      )}

      {value?.frequency === 'monthly' && hasValidStart && (
        <SelectField
          label="Im Monat"
          name="recurrenceMonthlyMode"
          value={value.monthlyMode}
          options={getMonthlyModeOptions(startDate).map((mode) => ({
            value: mode,
            label: formatMonthlyMode(mode, startDate),
          }))}
          onChange={(monthlyMode) => onChange({ ...value, monthlyMode })}
        />
      )}

      {value && (
        <div className="formRow">
          <SelectField
            label="Endet"
            name="recurrenceEnds"
            value={endMode}
            options={END_OPTIONS}
            onChange={changeEndMode}
          />

          {endMode === 'date' && (
            <FormField label="Letzter Termin" error={errors.until}>
              <input
                className="input"
                type="date"
                name="recurrenceUntil"
                min={startDate}
                value={value.until ?? ''}
                aria-invalid={Boolean(errors.until)}
                onChange={(event) => onChange({ ...value, until: event.target.value })}
              />
            </FormField>
          )}

          {endMode === 'count' && (
            <NumberField
              label="Nach"
              name="recurrenceCount"
              value={value.count}
              min={1}
              max={RECURRENCE_COUNT_MAX}
              unit={pluralize(value.count, 'Termin', 'Terminen')}
              error={errors.count}
              onChange={(count) => onChange({ ...value, count })}
            />
          )}
        </div>
      )}

      {value && canSummarize(value, startDate, errors) && (
        <p className="formHint">{formatRecurrence(value, startDate)}</p>
      )}
    </div>
  )
}
