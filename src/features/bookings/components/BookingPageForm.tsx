import { useMemo } from 'react'
import { Form } from '../../../components/Form.tsx'
import { FormActions } from '../../../components/FormActions.tsx'
import { FormField } from '../../../components/FormField.tsx'
import { NumberField } from '../../../components/NumberField.tsx'
import { SelectField, type SelectOption } from '../../../components/SelectField.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useForm } from '../../../hooks/useForm.ts'
import { useI18n } from '../../../i18n/index.ts'
import {
  BOOKING_DESCRIPTION_MAX_LENGTH,
  BOOKING_LIMITS,
  BOOKING_LOCATION_MAX_LENGTH,
  BOOKING_TITLE_MAX_LENGTH,
  findBookingHoursProblem,
  MAX_BOOKING_HOURS,
  sortBookingHours,
  type BookingPageSettings,
} from '../../../utils/booking.ts'
import { formatTimeZoneLabel, listTimeZones } from '../../../utils/timeZone.ts'
import { BookingHoursField } from './BookingHoursField.tsx'

export type BookingFormValues = Omit<BookingPageSettings, 'active'>

type BookingPageFormProps = {
  initialValues: BookingFormValues
  submitLabel: string
  pendingLabel: string
  successText: string
  resetOnSuccess?: boolean
  onSubmit: (values: BookingFormValues) => Promise<void>
  onCancel?: () => void
}

const STEP_CHOICES = [5, 10, 15, 20, 30, 45, 60, 90, 120]
const BUFFER_CHOICES = [0, 5, 10, 15, 30, 45, 60, 90, 120]
const NOTICE_CHOICES = [0, 30, 60, 120, 240, 480, 720, 1440, 2880, 4320, 10080]

type Limit = { min: number; max: number; step: number }

const fits = (value: number | null, { min, max, step }: Limit) =>
  value !== null && Number.isInteger(value) && value >= min && value <= max && value % step === 0

const withCurrent = (choices: readonly number[], current: number) =>
  choices.includes(current) ? choices : [...choices, current].sort((a, b) => a - b)

const zoneOptions = (current: string): SelectOption<string>[] => {
  const zones = listTimeZones()
  return (zones.includes(current) ? zones : [current, ...zones]).map((zone) => ({
    value: zone,
    label: formatTimeZoneLabel(zone),
  }))
}

function TimeZoneSelect({ value, onChange }: { value: string; onChange: (timeZone: string) => void }) {
  const { m } = useI18n()
  const options = useMemo(() => zoneOptions(value), [value])
  return (
    <SelectField
      label={m.bookings.form.timeZone}
      name="bookingTimeZone"
      value={value}
      options={options}
      onChange={onChange}
    />
  )
}

export function BookingPageForm({
  initialValues,
  submitLabel,
  pendingLabel,
  successText,
  resetOnSuccess,
  onSubmit,
  onCancel,
}: BookingPageFormProps) {
  const i18n = useI18n()
  const { m, format } = i18n
  const text = m.bookings.form
  const form = useForm<BookingFormValues>({
    initialValues,
    prepare: (values) => ({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      location: values.location.trim(),
      hours: sortBookingHours(values.hours),
    }),
    validate: (values) => {
      const problem = findBookingHoursProblem(values.hours)
      return {
        title: values.title ? undefined : text.titleRequired,
        durationMinutes: fits(values.durationMinutes, BOOKING_LIMITS.durationMinutes)
          ? undefined
          : text.durationInvalid(BOOKING_LIMITS.durationMinutes.max),
        horizonDays: fits(values.horizonDays, BOOKING_LIMITS.horizonDays)
          ? undefined
          : text.horizonInvalid(BOOKING_LIMITS.horizonDays.max),
        maxPerDay:
          values.maxPerDay === null || fits(values.maxPerDay, BOOKING_LIMITS.maxPerDay)
            ? undefined
            : text.maxPerDayInvalid(BOOKING_LIMITS.maxPerDay.max),
        hours:
          values.hours.length === 0
            ? text.hoursEmpty
            : problem === 'tooMany'
              ? text.hoursTooMany(MAX_BOOKING_HOURS)
              : problem
                ? text.hoursProblems[problem]
                : undefined,
      }
    },
    onSubmit: async (values) => {
      await onSubmit(values)
      if (resetOnSuccess) form.reset()
    },
  })
  const { values, setField } = form

  const durationOptions = (choices: readonly number[], current: number, zeroLabel?: string) =>
    withCurrent(choices, current).map<SelectOption<string>>((minutes) => ({
      value: String(minutes),
      label: minutes === 0 && zeroLabel ? zeroLabel : format.duration(minutes),
    }))

  return (
    <Form onSubmit={form.handleSubmit}>
      <TextField
        label={text.title}
        name="bookingTitle"
        autoComplete="off"
        maxLength={BOOKING_TITLE_MAX_LENGTH}
        placeholder={text.titlePlaceholder}
        {...form.bind('title')}
      />
      <FormField label={text.description}>
        <textarea
          className="textarea"
          name="bookingDescription"
          maxLength={BOOKING_DESCRIPTION_MAX_LENGTH}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
        />
      </FormField>
      <TextField
        label={text.location}
        name="bookingLocation"
        autoComplete="off"
        maxLength={BOOKING_LOCATION_MAX_LENGTH}
        {...form.bind('location')}
      />
      <div className="formRow">
        <NumberField
          label={text.duration}
          name="bookingDuration"
          min={BOOKING_LIMITS.durationMinutes.min}
          max={BOOKING_LIMITS.durationMinutes.max}
          unit={text.minutes}
          value={values.durationMinutes}
          error={form.errors.durationMinutes}
          onChange={(minutes) => setField('durationMinutes', minutes)}
        />
        <SelectField
          label={text.step}
          name="bookingStep"
          value={String(values.stepMinutes)}
          options={durationOptions(STEP_CHOICES, values.stepMinutes)}
          onChange={(minutes) => setField('stepMinutes', Number(minutes))}
        />
      </div>
      <div className="formRow">
        <SelectField
          label={text.buffer}
          name="bookingBuffer"
          value={String(values.bufferMinutes)}
          options={durationOptions(BUFFER_CHOICES, values.bufferMinutes, text.noBuffer)}
          onChange={(minutes) => setField('bufferMinutes', Number(minutes))}
        />
        <SelectField
          label={text.minNotice}
          name="bookingNotice"
          value={String(values.minNoticeMinutes)}
          options={durationOptions(NOTICE_CHOICES, values.minNoticeMinutes, text.noNotice)}
          onChange={(minutes) => setField('minNoticeMinutes', Number(minutes))}
        />
      </div>
      <div className="formRow">
        <NumberField
          label={text.horizon}
          name="bookingHorizon"
          min={BOOKING_LIMITS.horizonDays.min}
          max={BOOKING_LIMITS.horizonDays.max}
          unit={text.days}
          value={values.horizonDays}
          error={form.errors.horizonDays}
          onChange={(days) => setField('horizonDays', days)}
        />
        <NumberField
          label={text.maxPerDay}
          name="bookingMaxPerDay"
          min={BOOKING_LIMITS.maxPerDay.min}
          max={BOOKING_LIMITS.maxPerDay.max}
          value={values.maxPerDay}
          error={form.errors.maxPerDay}
          onChange={(count) => setField('maxPerDay', Number.isNaN(count) ? null : count)}
        />
      </div>
      <p className="formHint">{text.maxPerDayHint}</p>
      <TimeZoneSelect value={values.timeZone} onChange={(timeZone) => setField('timeZone', timeZone)} />
      <BookingHoursField
        value={values.hours}
        error={form.errors.hours}
        onChange={(hours) => setField('hours', hours)}
      />
      <ActionFeedback error={form.error} success={form.isSuccess && successText} />
      <FormActions
        isPending={form.isPending}
        submitLabel={submitLabel}
        pendingLabel={pendingLabel}
        onCancel={onCancel}
      />
    </Form>
  )
}
