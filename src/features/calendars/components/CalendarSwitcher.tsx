import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { PlusIcon } from '../../../components/Icons.tsx'
import { ROUTES, SETTINGS_CALENDARS_PATH } from '../../../config/routes.ts'
import { getDistinctTeamName, isPersonalCalendar } from '../utils/permissions.ts'
import { Button } from '../../../components/Button.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { classNames } from '../../../utils/classNames.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { CalendarPreview } from './CalendarPreview.tsx'

type CalendarCardProps = {
  calendar: CalendarSummary
  isActive: boolean
  onSelect: () => void
}

function CalendarCard({ calendar, isActive, onSelect }: CalendarCardProps) {
  const { m } = useI18n()
  return (
    <li>
      <button
        type="button"
        className={classNames('calendarCard', isActive && 'active')}
        aria-current={isActive}
        onClick={onSelect}
      >
        <CalendarPreview color={calendar.color} />
        <span className="calendarCardInfo">
          <span className="calendarCardName">{calendar.name}</span>
          <span className="calendarCardMeta">
            {[getDistinctTeamName(calendar), m.calendars.roles[calendar.role]].filter(Boolean).join(' · ')}
          </span>
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
  const { calendars, invitations, activeCalendar, selectCalendar } = useCalendars()
  const personal = calendars.filter(isPersonalCalendar)
  const teams = calendars.filter((calendar) => !isPersonalCalendar(calendar))

  const renderCards = (list: readonly CalendarSummary[], extra?: ReactNode) => (
    <ul className="calendarCards">
      {list.map((calendar) => (
        <CalendarCard
          key={calendar.id}
          calendar={calendar}
          isActive={calendar.id === activeCalendar.id}
          onSelect={() => {
            selectCalendar(calendar.id)
            onClose()
          }}
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
        {invitations.length > 0 && (
          <p className="formHint">
            {switcher.openInvitations(invitations.length)}{' '}
            <Link to={SETTINGS_CALENDARS_PATH} onClick={onClose}>
              {switcher.view}
            </Link>
          </p>
        )}
        <section className="calendarGroup">
          <h3 className="calendarGroupTitle">{switcher.teams}</h3>
          {teams.length === 0 && (
            <p className="emptyHint">{switcher.noTeams}</p>
          )}
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
