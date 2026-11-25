import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { PlusIcon } from '../../../components/Icons.tsx'
import { ROUTES, SETTINGS_INVITATIONS_PATH } from '../../../config/routes.ts'
import { getDistinctTeamName, isPersonalCalendar } from '../utils/permissions.ts'
import { Button } from '../../../components/Button.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { classNames } from '../../../utils/classNames.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useHost } from '../../../context/HostContext.ts'
import { useAuth } from '../../authorization/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import type { EventColor } from '../../../utils/event.ts'
import { peerCalendarId } from '../../../utils/peerCalendar.ts'
import { usePeerCalendars } from '../../peers/index.ts'
import { CalendarPreview } from './CalendarPreview.tsx'

type CalendarCardProps = {
  name: string
  meta: string
  color: EventColor
  isActive: boolean
  onSelect: () => void
}

function CalendarCard({ name, meta, color, isActive, onSelect }: CalendarCardProps) {
  const { m } = useI18n()
  return (
    <li>
      <button
        type="button"
        className={classNames('calendarCard', isActive && 'active')}
        aria-current={isActive}
        onClick={onSelect}
      >
        <CalendarPreview color={color} />
        <span className="calendarCardInfo">
          <span className="calendarCardName">{name}</span>
          <span className="calendarCardMeta">{meta}</span>
        </span>
        {isActive && (
          <span className="calendarCardBadge" aria-label={m.calendars.switcher.active}>
            ✓
          </span>
        )}
      </button>
    </li>
  )
}

function CalendarSwitcherModal({ onClose }: { onClose: () => void }) {
  const { m } = useI18n()
  const { switcher } = m.calendars
  const { calendars, invitations, activeId, activeCalendar, selectCalendar } = useCalendars()
  const peers = usePeerCalendars()
  const { features } = useHost()
  const { user } = useAuth()
  const activePeerId = peers.calendars.some(({ id }) => peerCalendarId(id) === activeId) ? activeId : null
  const select = (id: string) => {
    selectCalendar(id)
    onClose()
  }
  const personal = calendars.filter(isPersonalCalendar)
  const teams = calendars.filter((calendar) => !isPersonalCalendar(calendar))

  const renderCards = (list: readonly CalendarSummary[], extra?: ReactNode) => (
    <ul className="calendarCards">
      {list.map((calendar) => (
        <CalendarCard
          key={calendar.id}
          name={calendar.name}
          meta={[getDistinctTeamName(calendar), m.calendars.roles[calendar.role]].filter(Boolean).join(' · ')}
          color={calendar.color}
          isActive={activePeerId === null && calendar.id === activeCalendar.id}
          onSelect={() => select(calendar.id)}
        />
      ))}
      {extra}
    </ul>
  )

  return (
    <Modal title={switcher.title} size="large" onClose={onClose}>
      <div className="formSection">
        <section className="calendarGroup">
          <h3 className="calendarGroupTitle">{switcher.personal}</h3>
          {renderCards(personal)}
        </section>
        {user?.emailVerified && invitations.length > 0 && (
          <p className="formHint">
            {switcher.openInvitations(invitations.length)}{' '}
            <Link to={SETTINGS_INVITATIONS_PATH} onClick={onClose}>
              {switcher.view}
            </Link>
          </p>
        )}
        {features.teams && (
          <section className="calendarGroup">
            <h3 className="calendarGroupTitle">{switcher.teams}</h3>
            {teams.length === 0 && <p className="emptyHint">{switcher.noTeams}</p>}
            {renderCards(
              teams,
              <li>
                <Link to={ROUTES.createCalendar} className="calendarCard calendarCardNew">
                  <PlusIcon size={28} />
                  <span className="calendarCardName">{switcher.newCalendar}</span>
                </Link>
              </li>,
            )}
          </section>
        )}
        {peers.calendars.length > 0 && (
          <section className="calendarGroup">
            <h3 className="calendarGroupTitle">{switcher.shared}</h3>
            <ul className="calendarCards">
              {peers.calendars.map((calendar) => (
                <CalendarCard
                  key={calendar.id}
                  name={m.peers.calendarName(calendar.ownerName)}
                  meta={m.calendars.indicator.shared}
                  color={calendar.color}
                  isActive={activePeerId === peerCalendarId(calendar.id)}
                  onSelect={() => select(peerCalendarId(calendar.id))}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  )
}

export function CalendarSwitcher() {
  const { m } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button variant="outline" block onClick={() => setIsOpen(true)}>
        {m.calendars.switcher.open}
      </Button>
      {isOpen && <CalendarSwitcherModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
