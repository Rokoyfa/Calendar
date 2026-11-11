import { useCallback, useState } from 'react'
import { useI18n } from '../../i18n/index.ts'
import { timeToMinutes } from '../../utils/date.ts'
import { formatEventPeriod } from '../../utils/event.ts'
import { getNotificationState } from '../../utils/notifications.ts'
import type { ScheduledReminder } from '../../utils/reminders.ts'
import { useReminders } from './useReminders.ts'

export function ReminderNotices() {
  const i18n = useI18n()
  const { m, format } = i18n
  const [notices, setNotices] = useState<ScheduledReminder[]>([])

  const notify = useCallback(
    (reminder: ScheduledReminder) => {
      const { occurrence } = reminder
      const body = [formatEventPeriod(occurrence, i18n), occurrence.location].filter(Boolean).join('\n')
      if (getNotificationState() === 'granted') {
        try {
          new Notification(occurrence.title, { body, tag: reminder.key })
          return
        } catch {
          setNotices((current) => [...current, reminder])
          return
        }
      }
      setNotices((current) => [...current, reminder])
    },
    [i18n],
  )

  useReminders(notify)

  if (notices.length === 0) return null

  return (
    <div className="reminderNotices" role="status" aria-live="polite">
      {notices.map(({ key, occurrence }) => (
        <div key={key} className="reminderNotice">
          <span>
            <strong>{m.events.reminder}</strong>{' '}
            {occurrence.allDay
              ? occurrence.title
              : m.events.reminderDue(occurrence.title, format.time(timeToMinutes(occurrence.start)))}
            {occurrence.location && <span className="reminderNoticeLocation">{occurrence.location}</span>}
          </span>
          <button
            type="button"
            className="closeButton"
            aria-label={m.calendar.dismiss}
            onClick={() => setNotices((current) => current.filter((notice) => notice.key !== key))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
