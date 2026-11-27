import { FormField } from '../../../components/FormField.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { MINUTES_PER_HOUR } from '../../../utils/date.ts'
import { MAX_ESTIMATE_HOURS, type EstimateParts } from '../utils/taskForm.ts'
import { Input } from '../../../components/Input.tsx'

type TaskEstimateFieldProps = {
  value: EstimateParts
  error?: string
  onChange: (changes: Partial<EstimateParts>) => void
}

export function TaskEstimateField({ value, error, onChange }: TaskEstimateFieldProps) {
  const text = useI18n().m.tasks
  return (
    <FormField label={text.estimate} as="fieldset" error={error}>
      <span className="inlineField taskEstimate">
        <Input
          className="numberInput"
          type="number"
          name="estimateHours"
          inputMode="numeric"
          min={0}
          max={MAX_ESTIMATE_HOURS}
          step={1}
          placeholder="0"
          aria-label={text.hours}
          aria-invalid={Boolean(error)}
          value={value.hours}
          onChange={(event) => onChange({ hours: event.target.value })}
        />
        <span aria-hidden="true">{text.hoursUnit}</span>
        <Input
          className="numberInput"
          type="number"
          name="estimateMinutes"
          inputMode="numeric"
          min={0}
          max={MINUTES_PER_HOUR - 1}
          step={5}
          placeholder="0"
          aria-label={text.minutes}
          aria-invalid={Boolean(error)}
          value={value.minutes}
          onChange={(event) => onChange({ minutes: event.target.value })}
        />
        <span aria-hidden="true">{text.minutesUnit}</span>
      </span>
    </FormField>
  )
}
