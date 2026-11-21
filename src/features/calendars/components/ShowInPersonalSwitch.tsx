import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { AsyncSwitch } from '../../../components/AsyncSwitch.tsx'

export function ShowInPersonalSwitch({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  const { setShowInPersonal } = useCalendars()

  return (
    <AsyncSwitch
      label={m.calendars.list.showInPersonal}
      checked={calendar.showInPersonal}
      onChange={(checked) => setShowInPersonal(calendar.id, checked)}
    />
  )
}
