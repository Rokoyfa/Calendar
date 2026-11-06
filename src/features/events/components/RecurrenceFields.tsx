import { useI18n } from '../../../i18n/index.ts'
import { ChoiceChip } from '../../../components/ChoiceChip.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { NumberField } from '../../../components/NumberField.tsx'
import { SelectField, type SelectOption } from '../../../components/SelectField.tsx'
import { addMonthsToISODate, isISODate } from '../../../utils/date.ts'
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
  RECURRENCE_INTERVAL_MAX,
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

const getEndMode = ({ until, count }: Recurrence): EndMode =>
  until !== null ? 'date' : count !== null ? 'count' : 'never'

const pluralize = (count: number | null, one: string, many: string) => (count === 1 ? one : many)

const canSummarize = (recurrence: Recurrence, startDate: string, errors: RecurrenceValidationErrors) =>
  isISODate(startDate) &&
  !hasRecurrenceErrors(errors) &&
  isIntegerInRange(recurrence.interval, 1) &&
  (recurrence.count === null || isIntegerInRange(recurrence.count, 1))

export function RecurrenceFields({ value, startDate, errors, onChange }: RecurrenceFieldsProps) {
  const i18n = useI18n()
  const { m, format } = i18n
  const hasValidStart = isISODate(startDate)

  const frequencyOptions: SelectOption<RecurrenceFrequency | 'never'>[] = [
    { value: 'never', label: m.events.never },
    ...RECURRENCE_FREQUENCIES.map((frequency) => ({ value: frequency, label: m.recurrence.frequency[frequency] })),
  ]

  const endOptions: SelectOption<EndMode>[] = [
    { value: 'never', label: m.events.never },
    { value: 'date', label: m.events.endsOnDate },
    { value: 'count', label: m.events.endsAfterCount },
  ]

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

  const unit = value ? m.recurrence.units[value.frequency] : null
  const endMode = value ? getEndMode(value) : 'never'

  return (
    <div className="formSection">
      <div className="formRow">
        <SelectField
          label={m.events.repeat}
          name="recurrenceFrequency"
          value={value?.frequency ?? 'never'}
          options={frequencyOptions}
          onChange={changeFrequency}
        />
        {value && unit && (
          <NumberField
            label={m.events.every}
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
        <FormField as="fieldset" label={m.events.onTheseDays} error={errors.weekdays}>
          <div className="choiceList">
            {format.shortWeekdays.map(({ weekday, label }) => (
              <ChoiceChip
                key={weekday}
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
          label={m.events.inMonth}
          name="recurrenceMonthlyMode"
          value={value.monthlyMode}
          options={getMonthlyModeOptions(startDate).map((mode) => ({
            value: mode,
            label: formatMonthlyMode(mode, startDate, i18n),
          }))}
          onChange={(monthlyMode) => onChange({ ...value, monthlyMode })}
        />
      )}

      {value && (
        <div className="formRow">
          <SelectField
            label={m.events.ends}
            name="recurrenceEnds"
            value={endMode}
            options={endOptions}
            onChange={changeEndMode}
          />

          {endMode === 'date' && (
            <FormField label={m.events.lastOccurrence} error={errors.until}>
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
              label={m.events.after}
              name="recurrenceCount"
              value={value.count}
              min={1}
              max={RECURRENCE_COUNT_MAX}
              unit={pluralize(value.count, m.events.occurrences.one, m.events.occurrences.many)}
              error={errors.count}
              onChange={(count) => onChange({ ...value, count })}
            />
          )}
        </div>
      )}

      {value && canSummarize(value, startDate, errors) && (
        <p className="formHint">{formatRecurrence(value, startDate, i18n)}</p>
      )}
    </div>
  )
}
