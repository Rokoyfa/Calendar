import type { ReactNode } from 'react'
import { Button } from '../../../components/Button.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { VIEW_DEFINITIONS, VIEW_OPTIONS } from '../constants/views.ts'
import type { CalendarView } from '../types/view.ts'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../../../components/Icons.tsx'

type CalendarHeaderProps = {
  view: CalendarView
  title: string
  subtitle?: string
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onCreateEvent: () => void
  accessory?: ReactNode
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
  accessory,
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
        <Button variant="outline" className="todayButton" onClick={onToday}>
          Heute
        </Button>
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
          {accessory}
        </span>
      </div>
    </header>
  )
}
