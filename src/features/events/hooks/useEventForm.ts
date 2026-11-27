import { useState } from 'react'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { ALL_DAY_TIME, moveToStartDate, type EventInput, type EventValidationErrors } from '../../../domain/event.ts'
import { adaptRecurrenceToStart, type Recurrence } from '../../../domain/recurrence.ts'
import { isISODate } from '../../../utils/date.ts'

const DEFAULT_START = '09:00'
const DEFAULT_END = '10:00'

export type EventFieldSetter = <K extends Exclude<keyof EventInput, 'recurrence'>>(
  field: K,
  value: EventInput[K],
) => void

export function useEventForm(initialValue: EventInput) {
  const viewerTimeZone = useViewerTimeZone()
  const [values, setValues] = useState(initialValue)
  const [errors, setErrors] = useState<EventValidationErrors>({})

  const update = (changes: Partial<EventInput>, clearedErrors: readonly (keyof EventValidationErrors)[]) => {
    setValues((current) => ({ ...current, ...changes }))
    setErrors((current) => ({
      ...current,
      ...Object.fromEntries(clearedErrors.map((key) => [key, undefined])),
    }))
  }

  const setField: EventFieldSetter = (field, value) => update({ [field]: value }, [field])

  const [timedValues, setTimedValues] = useState(() =>
    initialValue.allDay
      ? { start: DEFAULT_START, end: DEFAULT_END, timeZone: viewerTimeZone }
      : {
          start: initialValue.start,
          end: initialValue.end,
          timeZone: initialValue.timeZone,
        },
  )

  const setAllDay = (allDay: boolean) => {
    if (allDay) {
      setTimedValues({
        start: values.start,
        end: values.end,
        timeZone: values.timeZone,
      })
      update({ allDay, start: ALL_DAY_TIME, end: ALL_DAY_TIME, timeZone: null }, ['start', 'end', 'endDate'])
    } else update({ allDay, ...timedValues }, ['start', 'end', 'endDate'])
  }

  const changeStartDate = (startDate: string) =>
    update(
      {
        ...(isISODate(values.startDate) && isISODate(values.endDate) && isISODate(startDate)
          ? moveToStartDate(values, startDate)
          : { startDate }),
        recurrence: adaptRecurrenceToStart(values.recurrence, values.startDate, startDate),
      },
      ['startDate', 'endDate'],
    )

  const setRecurrence = (recurrence: Recurrence | null) => update({ recurrence }, ['recurrence'])

  return { values, errors, setErrors, update, setField, setAllDay, changeStartDate, setRecurrence }
}
