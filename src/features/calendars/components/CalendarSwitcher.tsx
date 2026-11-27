import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../../components/Button.tsx'
import { PlusIcon } from '../../../components/Icons.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { Tabs, type TabDefinition } from '../../../components/Tabs.tsx'
import { ROUTES, SETTINGS_INVITATIONS_PATH } from '../../../config/routes.ts'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { compact } from '../../../utils/list.ts'
import { useAuth } from '../../authorization/index.ts'
import { useCalendarOptions, type CalendarGroup, type CalendarOption } from '../hooks/useCalendarOptions.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import { CalendarPreview } from './CalendarPreview.tsx'

type CalendarCardProps = {
  option: CalendarOption
  onSelect: () => void
}

function CalendarCard({ option, onSelect }: CalendarCardProps) {
  const { m } = useI18n()
  return (
    <li>
      <button
        type="button"
        className={classNames('calendarCard', option.isActive && 'active')}
        aria-current={option.isActive}
        onClick={onSelect}
      >
        <CalendarPreview color={option.color} />
        <span className="calendarCardInfo">
          <span className="calendarCardName">{option.name}</span>
          <span className="calendarCardMeta">{option.meta}</span>
        </span>
        {option.isActive && (
          <span className="calendarCardBadge" aria-label={m.calendars.switcher.active}>
            ✓
          </span>
        )}
      </button>
    </li>
  )
}

const withCount = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label)

export function CalendarSwitcherModal({ onClose }: { onClose: () => void }) {
  const { m } = useI18n()
  const { switcher } = m.calendars
  const { invitations } = useCalendars()
  const { user } = useAuth()
  const options = useCalendarOptions()
  const [tab, setTab] = useState<CalendarGroup>(options.activeGroup)
  const select = (id: string) => {
    options.select(id)
    onClose()
  }

  const renderCards = (list: readonly CalendarOption[], withNew = false) => (
    <ul className="calendarCards">
      {list.map((option) => (
        <CalendarCard key={option.id} option={option} onSelect={() => select(option.id)} />
      ))}
      {withNew && (
        <li>
          <Link to={ROUTES.createCalendar} className="calendarCard calendarCardNew">
            <PlusIcon size={28} />
            <span className="calendarCardName">{switcher.newCalendar}</span>
          </Link>
        </li>
      )}
    </ul>
  )

  const tabs = compact<TabDefinition<CalendarGroup>>([
    { value: 'personal', label: switcher.personal, content: renderCards(options.personal) },
    options.hasTeams && {
      value: 'teams',
      label: withCount(switcher.teams, options.teams.length),
      content: (
        <div className="calendarGroup">
          {options.teams.length === 0 && <p className="emptyHint">{switcher.noTeams}</p>}
          {renderCards(options.teams, true)}
        </div>
      ),
    },
    options.hasShared && {
      value: 'shared',
      label: withCount(switcher.shared, options.shared.length),
      content:
        options.shared.length === 0 ? <p className="emptyHint">{switcher.noShared}</p> : renderCards(options.shared),
    },
  ])

  return (
    <Modal title={switcher.title} size="large" onClose={onClose}>
      <div className="formSection calendarSwitcher">
        {user?.emailVerified && invitations.length > 0 && (
          <p className="formHint">
            {switcher.openInvitations(invitations.length)}{' '}
            <Link to={SETTINGS_INVITATIONS_PATH} onClick={onClose}>
              {switcher.view}
            </Link>
          </p>
        )}
        {tabs.length > 1 ? (
          <Tabs label={switcher.tabsLabel} tabs={tabs} value={tab} onChange={setTab} />
        ) : (
          tabs[0].content
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
