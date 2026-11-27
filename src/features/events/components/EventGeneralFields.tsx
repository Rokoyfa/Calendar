import type { ReactNode } from 'react'
import { DateTimeField } from '../../../components/DateTimeField.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { useFeatures } from '../../../context/HostContext.ts'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import {
  EVENT_TITLE_MAX_LENGTH,
  formatEventPeriod,
  toViewerPeriod,
  type EventInput,
  type EventOccurrence,
  type EventValidationErrors,
} from '../../../domain/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import type { EventFieldSetter } from '../hooks/useEventForm.ts'
import { isValidPeriod } from '../utils/eventForm.ts'
import type { CalendarFieldOptions } from './EventModal.tsx'
import { OverlapNotice, type OverlapCheck } from './OverlapNotice.tsx'
import { PlanConflictNotice, type PlanConflictCheck } from './PlanConflictNotice.tsx'
import { ReminderField } from './ReminderField.tsx'
import { TimeZoneField } from './TimeZoneField.tsx'

type EventGeneralFieldsProps = {
  values: EventInput
  errors: EventValidationErrors
  occurrence: EventOccurrence | null
  calendarField?: CalendarFieldOptions
  readOnly: boolean
  isRequest: boolean
  isMoving: boolean
  isPending: boolean
  showVisibility: boolean
  checkOverlaps?: OverlapCheck
  planConflicts?: { check: PlanConflictCheck }
  findTime: ReactNode
  setField: EventFieldSetter
  setAllDay: (allDay: boolean) => void
  changeStartDate: (startDate: string) => void
}

export function EventGeneralFields({
  values,
  errors,
  occurrence,
  calendarField,
  readOnly,
  isRequest,
  isMoving,
  isPending,
  showVisibility,
  checkOverlaps,
  planConflicts,
  findTime,
  setField,
  setAllDay,
  changeStartDate,
}: EventGeneralFieldsProps) {
  const i18n = useI18n()
  const { m } = i18n
  const features = useFeatures()
  const viewerTimeZone = useViewerTimeZone()
  const viewerHint =
    !values.allDay && values.timeZone && values.timeZone !== viewerTimeZone && isValidPeriod(values)
      ? m.events.inYourTimeZone(formatEventPeriod(toViewerPeriod(values, values.timeZone, viewerTimeZone), i18n))
      : null

  return (
    <>
      <TextField
        label={m.events.title}
        name="title"
        autoComplete="off"
        maxLength={EVENT_TITLE_MAX_LENGTH}
        value={values.title}
        error={errors.title}
        onChange={(title) => setField('title', title)}
        data-autofocus
      />

      {calendarField && calendarField.options.length > 1 && !readOnly && (
        <SelectField
          label={m.events.calendar}
          name="calendarId"
          value={calendarField.value}
          options={calendarField.options.map(({ id, name }) => ({ value: id, label: name }))}
          onChange={(calendarId) => {
            calendarField.onChange(calendarId)
            setField('categoryIds', [])
          }}
        />
      )}
      {isMoving && occurrence?.recurrence && <p className="formHint">{m.events.moveSeriesHint}</p>}

      <Switch label={m.events.allDay} checked={values.allDay} onChange={setAllDay} />

      <DateTimeField
        name="start"
        dateLabel={m.events.startDate}
        timeLabel={m.events.startTime}
        date={values.startDate}
        time={values.start}
        showTime={!values.allDay}
        dateError={errors.startDate}
        timeError={errors.start}
        onDateChange={changeStartDate}
        onTimeChange={(start) => setField('start', start)}
      />

      <DateTimeField
        name="end"
        dateLabel={m.events.endDate}
        timeLabel={m.events.endTime}
        date={values.endDate}
        time={values.end}
        showTime={!values.allDay}
        minDate={values.startDate}
        dateError={errors.endDate}
        timeError={errors.end}
        onDateChange={(endDate) => setField('endDate', endDate)}
        onTimeChange={(end) => setField('end', end)}
      />

      {!values.allDay && features.timeZones && (
        <TimeZoneField value={values.timeZone} onChange={(timeZone) => setField('timeZone', timeZone)} />
      )}
      {viewerHint && <p className="formHint">{viewerHint}</p>}
      {checkOverlaps && !readOnly && <OverlapNotice values={values} check={checkOverlaps} />}
      {planConflicts && !readOnly && !isRequest && !values.taskId && (
        <PlanConflictNotice values={values} check={planConflicts.check} canReplan={!isMoving} isPending={isPending} />
      )}
      {findTime}

      {features.reminders && !readOnly && !isRequest && (
        <ReminderField value={values.reminders} onChange={(reminders) => setField('reminders', reminders)} />
      )}
      {showVisibility && !isRequest && (
        <>
          <Switch
            label={m.peers.visibility}
            checked={values.visibility === 'public'}
            onChange={(shown) => setField('visibility', shown ? 'public' : 'private')}
          />
          <p className="formHint">{m.peers.visibilityHint}</p>
        </>
      )}
    </>
  )
}
