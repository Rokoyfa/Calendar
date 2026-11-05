import { useState } from 'react'
import { Button, ButtonLink } from '../../../components/Button.tsx'
import { Link } from 'react-router'
import { calendarSettingsPath, ROUTES } from '../../../config/routes.ts'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { SettingsIcon } from '../../../components/Icons.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { ActionFeedback, ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { getEventColorAttributes } from '../../../utils/event.ts'
import { ROLE_LABELS } from '../constants/calendars.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { canLeaveCalendar, canOpenSettings, getCalendarKindLabel, isPersonalCalendar } from '../utils/permissions.ts'
import { InvitationList } from './InvitationList.tsx'

function LeaveCalendarModal({ calendar, onClose }: { calendar: CalendarSummary; onClose: () => void }) {
  const { leaveCalendar } = useCalendars()
  return (
    <ConfirmModal
      title="Kalender verlassen?"
      confirmLabel="Verlassen"
      pendingLabel="Wird verlassen …"
      onConfirm={async () => {
        await leaveCalendar(calendar.id)
        onClose()
      }}
      onClose={onClose}
    >
      Du verlässt das Team „{calendar.teamName ?? calendar.name}“ und siehst seinen Kalender nicht mehr. Zurück geht es
      nur über eine neue Einladung.
    </ConfirmModal>
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
          <span className="itemRowMeta">{getCalendarKindLabel(calendar)}</span>
          {calendar.description && <span className="itemRowMeta">{calendar.description}</span>}
        </span>
        <span className="badge">{ROLE_LABELS[calendar.role]}</span>
        {canOpenSettings(calendar) && (
          <Link
            to={calendarSettingsPath(calendar.id)}
            className="iconLink"
            aria-label={`Einstellungen für ${calendar.name}`}
            title="Einstellungen"
          >
            <SettingsIcon size={20} />
          </Link>
        )}
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
  const { calendars, error } = useCalendars()
  const [calendarToLeave, setCalendarToLeave] = useState<CalendarSummary | null>(null)

  return (
    <>
      <InvitationList />
      <PageSection
        title="Kalender"
        description="Alle Kalender, auf die du Zugriff hast, mit deiner Rolle. Bei Team-Kalendern legst du fest, ob ihre Termine auch in deinem persönlichen Kalender erscheinen. Verlassen kannst du sie, außer du bist Owner. Dann musst du die Leitung vorher übergeben."
      >
        <ErrorMessage message={error} />
        <ul className="calendarSettingList">
          {calendars.map((calendar) => (
            <CalendarRow key={calendar.id} calendar={calendar} onLeave={() => setCalendarToLeave(calendar)} />
          ))}
        </ul>
        {calendars.every(isPersonalCalendar) && (
          <p className="emptyHint">Noch keine Team-Kalender. Erstelle einen oder tritt über eine Einladung bei.</p>
        )}
        <div className="formActions">
          <ButtonLink to={ROUTES.createCalendar}>Kalender erstellen</ButtonLink>
        </div>
        {calendarToLeave && <LeaveCalendarModal calendar={calendarToLeave} onClose={() => setCalendarToLeave(null)} />}
      </PageSection>
    </>
  )
}
