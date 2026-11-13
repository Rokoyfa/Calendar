import { useState } from 'react'
import { Button, ButtonLink } from '../../../components/Button.tsx'
import { Link } from 'react-router'
import { calendarSettingsPath, ROUTES } from '../../../config/routes.ts'
import { ConfirmModal } from '../../../components/ConfirmModal.tsx'
import { SettingsIcon } from '../../../components/Icons.tsx'
import { PageSection } from '../../../components/PageSection.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { getEventColorAttributes } from '../../../utils/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { ShowInPersonalSwitch } from './ShowInPersonalSwitch.tsx'
import { canLeaveCalendar, getCalendarKindLabel, isPersonalCalendar } from '../utils/permissions.ts'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAuth } from '../../authorization/index.ts'

function LeaveCalendarModal({ calendar, onClose }: { calendar: CalendarSummary; onClose: () => void }) {
  const { m } = useI18n()
  const { leaveCalendar } = useCalendars()
  return (
    <ConfirmModal
      title={m.calendars.leave.title}
      confirmLabel={m.calendars.leave.confirm}
      pendingLabel={m.calendars.leave.pending}
      onConfirm={async () => {
        await leaveCalendar(calendar.id)
        onClose()
      }}
      onClose={onClose}
    >
      {m.calendars.leave.message(calendar.teamName ?? calendar.name)}
    </ConfirmModal>
  )
}

function CalendarRow({ calendar, onLeave }: { calendar: CalendarSummary; onLeave: () => void }) {
  const { m } = useI18n()
  const { list, roles } = m.calendars

  return (
    <li className="calendarSettingCard">
      <div className="calendarSettingHeader">
        <span {...getEventColorAttributes(calendar.color, 'colorSwatch colorSwatch--large')} aria-hidden="true" />
        <span className="itemRowMain">
          <span className="itemRowTitle">{calendar.name}</span>
          <span className="itemRowMeta">{getCalendarKindLabel(calendar, m)}</span>
          {calendar.description && <span className="itemRowMeta">{calendar.description}</span>}
        </span>
        <span className="badge">{roles[calendar.role]}</span>
        <Link
          to={calendarSettingsPath(calendar.id)}
          className="iconLink"
          aria-label={list.settingsFor(calendar.name)}
          title={m.common.settings}
        >
          <SettingsIcon size={20} />
        </Link>
      </div>
      {isPersonalCalendar(calendar) ? (
        <p className="formHint">{list.personalHint}</p>
      ) : (
        <div className="calendarSettingBody">
          <ShowInPersonalSwitch calendar={calendar} />
          {canLeaveCalendar(calendar) ? (
            <div className="formActions">
              <Button variant="outline" onClick={onLeave}>
                {list.leave}
              </Button>
            </div>
          ) : (
            <p className="formHint">{list.ownerCannotLeave}</p>
          )}
        </div>
      )}
    </li>
  )
}

export function CalendarSettings() {
  const { m } = useI18n()
  const { list } = m.calendars
  const { teams } = useFeatures()
  const { calendars, error } = useCalendars()
  const { user } = useAuth()
  const canUseTeams = teams && user !== null
  const [calendarToLeave, setCalendarToLeave] = useState<CalendarSummary | null>(null)

  return (
    <PageSection
      title={list.title}
      description={list.description}
    >
      <ErrorMessage message={error} />
      <ul className="calendarSettingList">
        {calendars.map((calendar) => (
          <CalendarRow key={calendar.id} calendar={calendar} onLeave={() => setCalendarToLeave(calendar)} />
        ))}
      </ul>
      {canUseTeams && calendars.every(isPersonalCalendar) && (
        <p className="emptyHint">{list.noTeamCalendars}</p>
      )}
      {canUseTeams && (
        <div className="formActions">
          <ButtonLink to={ROUTES.createCalendar}>{list.create}</ButtonLink>
        </div>
      )}
      {calendarToLeave && <LeaveCalendarModal calendar={calendarToLeave} onClose={() => setCalendarToLeave(null)} />}
    </PageSection>
  )
}
