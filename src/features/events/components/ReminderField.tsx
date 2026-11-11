import { useState } from 'react'
import { SelectField, type SelectOption } from '../../../components/SelectField.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { getNotificationState, requestNotifications } from '../../../utils/notifications.ts'

const NONE = 'none'
const PRESETS = [0, 5, 10, 15, 30, 60, 120, 1440, 2880, 10080]

type ReminderFieldProps = {
  value: readonly number[]
  onChange: (reminders: number[]) => void
}

export function ReminderField({ value, onChange }: ReminderFieldProps) {
  const { m, format } = useI18n()
  const [notificationState, setNotificationState] = useState(getNotificationState)
  const current = value[0]
  const presets = current === undefined || PRESETS.includes(current) ? PRESETS : [...PRESETS, current].sort((a, b) => a - b)
  const options: SelectOption<string>[] = [
    { value: NONE, label: m.events.noReminder },
    ...presets.map((minutes) => ({
      value: String(minutes),
      label: minutes === 0 ? m.events.reminderAtStart : m.events.reminderBefore(format.duration(minutes)),
    })),
  ]

  const change = (next: string) => {
    if (next === NONE) return onChange([])
    onChange([Number(next), ...value.slice(1)])
    void requestNotifications().then(setNotificationState)
  }

  return (
    <>
      <SelectField
        label={m.events.reminder}
        name="reminder"
        value={current === undefined ? NONE : String(current)}
        options={options}
        onChange={change}
      />
      {value.length > 0 && (notificationState === 'denied' || notificationState === 'unsupported') && (
        <p className="formHint">{m.events.reminderBlocked}</p>
      )}
    </>
  )
}
