import { useState } from 'react'
import { Modal } from '../../../components/Modal.tsx'
import { classNames } from '../../../utils/classNames.ts'
import { ROLE_LABELS } from '../constants/calendars.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import type { CalendarSummary } from '../types/calendar.ts'
import { CalendarPreview } from './CalendarPreview.tsx'

type CalendarCardProps = {
  calendar: CalendarSummary
  isActive: boolean
  onSelect: () => void
}

function CalendarCard({ calendar, isActive, onSelect }: CalendarCardProps) {
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
            {calendar.teamName ? `${calendar.teamName} · ` : ''}
            {ROLE_LABELS[calendar.role]}
          </span>
        </span>
        {isActive && (
          <span className="calendarCardBadge" aria-label="Aktiv">
            ✓
          </span>
        )}
      </button>
    </li>
  )
}

function CalendarSwitcherModal({ onClose }: { onClose: () => void }) {
  const { calendars, activeCalendar, selectCalendar } = useCalendars()
  const personal = calendars.filter((calendar) => calendar.kind === 'personal')
  const teams = calendars.filter((calendar) => calendar.kind === 'team')

  const renderCards = (list: readonly CalendarSummary[]) => (
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
    </ul>
  )

  return (
    <Modal title="Kalender wechseln" size="large" onClose={onClose}>
      <div className="formSection">
        <section className="calendarGroup">
          <h3 className="calendarGroupTitle">Persönlich</h3>
          {renderCards(personal)}
        </section>
        <section className="calendarGroup">
          <h3 className="calendarGroupTitle">Teams</h3>
          {teams.length > 0 ? (
            renderCards(teams)
          ) : (
            <p className="emptyHint">
              Du bist noch in keinem Team. Sobald du einem Team beitrittst, kannst du hier zu dessen Kalender wechseln.
            </p>
          )}
        </section>
      </div>
    </Modal>
  )
}

export function CalendarSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button type="button" className="button button--outline button--block" onClick={() => setIsOpen(true)}>
        Kalender wechseln
      </button>
      {isOpen && <CalendarSwitcherModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
