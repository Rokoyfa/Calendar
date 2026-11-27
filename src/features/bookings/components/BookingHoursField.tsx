import { Button } from '../../../components/Button.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { CloseIcon } from '../../../components/Icons.tsx'
import { useI18n } from '../../../i18n/index.ts'
import {
  BOOKING_DAY_END,
  MAX_BOOKING_HOURS,
  sortBookingHours,
  toBookingEndTime,
  toTimeInput,
  type BookingHours,
} from '../utils/booking.ts'
import { minutesToTime, MINUTES_PER_DAY, MINUTES_PER_HOUR, timeToMinutes } from '../../../utils/date.ts'
import { Input } from '../../../components/Input.tsx'

type BookingHoursFieldProps = {
  value: readonly BookingHours[]
  error?: string
  onChange: (hours: BookingHours[]) => void
}

const DEFAULT_WINDOW = { start: '09:00', end: '17:00' }

const nextWindow = (day: readonly BookingHours[]) => {
  const last = day.at(-1)
  if (!last) return DEFAULT_WINDOW
  const start = timeToMinutes(last.end)
  if (start >= MINUTES_PER_DAY) return null
  const end = Math.min(start + MINUTES_PER_HOUR, MINUTES_PER_DAY)
  return { start: minutesToTime(start), end: end === MINUTES_PER_DAY ? BOOKING_DAY_END : minutesToTime(end) }
}

export function BookingHoursField({ value, error, onChange }: BookingHoursFieldProps) {
  const i18n = useI18n()
  const text = i18n.m.bookings.form
  const sorted = sortBookingHours(value)
  const isFull = value.length >= MAX_BOOKING_HOURS

  const replace = (target: BookingHours, changes: Partial<BookingHours>) =>
    onChange(sorted.map((entry) => (entry === target ? { ...entry, ...changes } : entry)))

  return (
    <FormField label={text.hours} as="fieldset" error={error}>
      <p className="formHint">{text.hoursHint}</p>
      <ul className="bookingHours">
        {i18n.format.longWeekdays.map(({ weekday, label }) => {
          const day = sorted.filter((entry) => entry.weekday === weekday)
          const next = nextWindow(day)
          return (
            <li key={weekday} className="bookingHoursDay">
              <span className="bookingHoursName">{label}</span>
              <span className="bookingHoursWindows">
                {day.length === 0 && <span className="formHint">{text.unavailable}</span>}
                {day.map((entry, index) => (
                  <span key={index} className="bookingHoursWindow">
                    <Input
                      type="time"
                      step={300}
                      aria-label={text.hoursFrom(label)}
                      value={entry.start}
                      onChange={(event) => event.target.value && replace(entry, { start: event.target.value })}
                    />
                    <span aria-hidden="true">–</span>
                    <Input
                      type="time"
                      step={300}
                      aria-label={text.hoursTo(label)}
                      value={toTimeInput(entry.end)}
                      onChange={(event) =>
                        event.target.value && replace(entry, { end: toBookingEndTime(event.target.value) })
                      }
                    />
                    <IconButton
                      plain
                      label={text.removeHours(label)}
                      onClick={() => onChange(sorted.filter((candidate) => candidate !== entry))}
                    >
                      <CloseIcon size={16} />
                    </IconButton>
                  </span>
                ))}
                {next && !isFull && (
                  <Button variant="outline" onClick={() => onChange([...sorted, { weekday, ...next }])}>
                    {text.addHours}
                  </Button>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </FormField>
  )
}
