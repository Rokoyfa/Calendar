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
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { canLeaveCalendar, canOpenSettings, getCalendarKindLabel, isPersonalCalendar } from '../utils/permissions.ts'
import { InvitationList } from './InvitationList.tsx'

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
  const { setShowInPersonal } = useCalendars()
  const { run, error } = useAsyncAction(setShowInPersonal)

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
        {canOpenSettings(calendar) && (
          <Link
            to={calendarSettingsPath(calendar.id)}
            className="iconLink"
            aria-label={list.settingsFor(calendar.name)}
            title={m.common.settings}
          >
            <SettingsIcon size={20} />
          </Link>
        )}
      </div>
      {isPersonalCalendar(calendar) ? (
        <p className="formHint">{list.personalHint}</p>
      ) : (
        <div className="calendarSettingBody">
          <Switch
            label={list.showInPersonal}
            checked={calendar.showInPersonal}
            onChange={(checked) => void run(calendar.id, checked)}
          />
          <ActionFeedback error={error} />
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
  const { calendars, error } = useCalendars()
  const [calendarToLeave, setCalendarToLeave] = useState<CalendarSummary | null>(null)

  return (
    <>
      <InvitationList />
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
        {calendars.every(isPersonalCalendar) && (
          <p className="emptyHint">{list.noTeamCalendars}</p>
        )}
        <div className="formActions">
          <ButtonLink to={ROUTES.createCalendar}>{list.create}</ButtonLink>
        </div>
        {calendarToLeave && <LeaveCalendarModal calendar={calendarToLeave} onClose={() => setCalendarToLeave(null)} />}
      </PageSection>
    </>
  )
}
