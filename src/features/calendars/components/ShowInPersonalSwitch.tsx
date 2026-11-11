import { Switch } from '../../../components/Switch.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'

export function ShowInPersonalSwitch({ calendar }: { calendar: CalendarSummary }) {
  const { m } = useI18n()
  const { setShowInPersonal } = useCalendars()
  const { run, error } = useAsyncAction(setShowInPersonal)

  return (
    <>
      <Switch
        label={m.calendars.list.showInPersonal}
        checked={calendar.showInPersonal}
        onChange={(checked) => void run(calendar.id, checked)}
      />
      <ActionFeedback error={error} />
    </>
  )
}
