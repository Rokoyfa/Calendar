import { FormField } from './FormField.tsx'

type DateTimeFieldProps = {
  name: string
  dateLabel: string
  timeLabel: string
  date: string
  time: string
  minDate?: string
  dateError?: string
  timeError?: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

export function DateTimeField({
  name,
  dateLabel,
  timeLabel,
  date,
  time,
  minDate,
  dateError,
  timeError,
  onDateChange,
  onTimeChange,
}: DateTimeFieldProps) {
  return (
    <div className="formRow">
      <FormField label={dateLabel} error={dateError}>
        <input
          className="input"
          type="date"
          name={`${name}Date`}
          min={minDate}
          value={date}
          aria-invalid={Boolean(dateError)}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </FormField>
      <FormField label={timeLabel} error={timeError}>
        <input
          className="input"
          type="time"
          name={name}
          value={time}
          aria-invalid={Boolean(timeError)}
          onChange={(event) => onTimeChange(event.target.value)}
        />
      </FormField>
    </div>
  )
}
