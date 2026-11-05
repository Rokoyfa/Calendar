import { useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { ActionFeedback } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { getEventColorAttributes } from '../../../utils/event.ts'
import { ROLE_LABELS } from '../constants/calendars.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { canLeaveCalendar, isPersonalCalendar } from '../utils/permissions.ts'

type LeaveCalendarModalProps = {
  calendar: CalendarSummary
  onClose: () => void
}

function LeaveCalendarModal({ calendar, onClose }: LeaveCalendarModalProps) {
  const { leaveCalendar } = useCalendars()
  const { run, isPending, error } = useAsyncAction(async () => {
    await leaveCalendar(calendar.id)
    onClose()
  })

  return (
    <Modal title="Kalender verlassen?" variant="danger" onClose={onClose}>
      <div className="formSection">
        <p className="modalMessage">
          Du verlässt das Team „{calendar.teamName ?? calendar.name}“ und siehst seinen Kalender nicht mehr. Zurück geht
          es nur über eine neue Einladung.
        </p>
        <ActionFeedback error={error} />
        <div className="formActions">
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Abbrechen
          </Button>
          <Button variant="danger" isPending={isPending} pendingLabel="Wird verlassen …" onClick={() => void run()}>
            Verlassen
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CalendarRow({ calendar, onLeave }: { calendar: CalendarSummary; onLeave: () => void }) {
  const { setShowInPersonal } = useCalendars()
  const { run, error } = useAsyncAction(setShowInPersonal)

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span {...getEventColorAttributes(calendar.color, 'colorSwatch colorSwatch--large')} aria-hidden="true" />
        <span className="itemRowMain">
          <span className="itemRowTitle">{calendar.name}</span>
          <span className="itemRowMeta">{calendar.teamName ?? 'Persönlicher Kalender'}</span>
        </span>
        <span className="badge">{ROLE_LABELS[calendar.role]}</span>
      </div>
      {isPersonalCalendar(calendar) ? (
        <p className="formHint">Dein eigener Kalender. Er lässt sich nicht verlassen oder entfernen.</p>
      ) : (
        <div className="calendarSettingBody">
          <Switch
            label="Termine auch im persönlichen Kalender anzeigen"
            checked={calendar.showInPersonal}
            onChange={(checked) => void run(calendar.id, checked)}
          />
          <ActionFeedback error={error} />
          {canLeaveCalendar(calendar) ? (
            <div className="formActions">
              <Button variant="outline" onClick={onLeave}>
                Kalender verlassen
              </Button>
            </div>
          ) : (
            <p className="formHint">
              Als Owner kannst du den Kalender erst verlassen, wenn du die Leitung übergeben hast.
            </p>
          )}
        </div>
      )}
    </li>
  )
}

export function CalendarSettings() {
  const { calendars } = useCalendars()
  const [calendarToLeave, setCalendarToLeave] = useState<CalendarSummary | null>(null)

  return (
    <PageSection
      title="Kalender"
      description="Alle Kalender, auf die du Zugriff hast, mit deiner Rolle. Bei Team-Kalendern legst du fest, ob ihre Termine auch in deinem persönlichen Kalender erscheinen. Verlassen kannst du sie, außer du bist Owner. Dann musst du die Leitung vorher übergeben."
    >
      <ul className="calendarSettingList">
        {calendars.map((calendar) => (
          <CalendarRow key={calendar.id} calendar={calendar} onLeave={() => setCalendarToLeave(calendar)} />
        ))}
      </ul>
      {calendars.every((calendar) => calendar.kind === 'personal') && (
        <p className="emptyHint">Noch keine Team-Kalender. Sie erscheinen hier, sobald du einem Team beitrittst.</p>
      )}
      {calendarToLeave && <LeaveCalendarModal calendar={calendarToLeave} onClose={() => setCalendarToLeave(null)} />}
    </PageSection>
  )
}
