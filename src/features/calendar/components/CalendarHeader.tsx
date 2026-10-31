import { IconButton } from '../../../components/IconButton.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { VIEW_DEFINITIONS } from '../constants/views.ts'
import { CALENDAR_VIEWS, type CalendarView } from '../types/view.ts'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './Icons.tsx'

const VIEW_OPTIONS = CALENDAR_VIEWS.map((view) => ({ value: view, label: VIEW_DEFINITIONS[view].label }))

type CalendarHeaderProps = {
  view: CalendarView
  title: string
  subtitle?: string
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onCreateEvent: () => void
}

export function CalendarHeader({
  view,
  title,
  subtitle,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onCreateEvent,
}: CalendarHeaderProps) {
  const { previousLabel, nextLabel } = VIEW_DEFINITIONS[view]
  return (
    <header className="header">
      <div className="headerNav">
        <IconButton label={previousLabel} title={`${previousLabel} (←)`} plain onClick={onPrevious}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton label={nextLabel} title={`${nextLabel} (→)`} plain onClick={onNext}>
          <ChevronRightIcon />
        </IconButton>
        <button type="button" className="button button--outline todayButton" onClick={onToday}>
          Heute
        </button>
      </div>

      <h1 className="headerTitle">
        {title}
        {subtitle && <span className="headerSubtitle">{subtitle}</span>}
      </h1>

      <div className="headerActions">
        <SegmentedControl label="Ansicht" value={view} options={VIEW_OPTIONS} onChange={onViewChange} />
        <span className="headerCreate">
          <IconButton label="Neuer Termin" onClick={onCreateEvent}>
            <PlusIcon size={16} />
          </IconButton>
        </span>
      </div>
    </header>
  )
}
