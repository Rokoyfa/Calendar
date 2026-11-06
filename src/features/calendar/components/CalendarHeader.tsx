import type { ReactNode } from 'react'
import { Button } from '../../../components/Button.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { useI18n } from '../../../i18n/index.ts'
import { getViewOptions } from '../constants/views.ts'
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
  onCreateEvent?: () => void
  context?: ReactNode
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
  context,
  accessory,
}: CalendarHeaderProps) {
  const { m } = useI18n()
  const { previous: previousLabel, next: nextLabel } = m.views[view]
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
          {m.calendar.today}
        </Button>
      </div>

      <div className="headerCenter">
        <h1 className="headerTitle">
          {title}
          {subtitle && <span className="headerSubtitle">{subtitle}</span>}
        </h1>
        {context}
      </div>

      <div className="headerActions">
        <SegmentedControl label={m.views.label} value={view} options={getViewOptions(m)} onChange={onViewChange} />
        <span className="headerCreate">
          {onCreateEvent && (
            <IconButton label={m.calendar.newEvent} onClick={onCreateEvent}>
              <PlusIcon size={16} />
            </IconButton>
          )}
          {accessory}
        </span>
      </div>
    </header>
  )
}
