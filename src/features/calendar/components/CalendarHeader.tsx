import type { ReactNode } from 'react'
import { Button } from '../../../components/Button.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { getViewOptions, withShortcut as addShortcut } from '../constants/views.ts'
import type { CalendarView } from '../types/view.ts'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '../../../components/Icons.tsx'

type CalendarHeaderProps = {
  view: CalendarView
  title: string
  subtitle?: string
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onCreateEvent?: () => void
  onSearch?: () => void
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
  onSearch,
  context,
  accessory,
}: CalendarHeaderProps) {
  const { m } = useI18n()
  const { views, features } = useHost()
  const withShortcut = (label: string, key: string) => (features.shortcuts ? addShortcut(label, key) : label)
  const { previous: previousLabel, next: nextLabel } = m.views[view]
  return (
    <header className="header">
      <div className="headerNav">
        <IconButton label={previousLabel} title={withShortcut(previousLabel, '←')} plain onClick={onPrevious}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton label={nextLabel} title={withShortcut(nextLabel, '→')} plain onClick={onNext}>
          <ChevronRightIcon />
        </IconButton>
        <Button variant="outline" className="todayButton" title={withShortcut(m.calendar.today, 't')} onClick={onToday}>
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
        {views.length > 1 && (
          <SegmentedControl
            label={m.views.label}
            value={view}
            options={getViewOptions(m, views, features.shortcuts)}
            onChange={onViewChange}
          />
        )}
        <span className="headerCreate">
          {onSearch && (
            <IconButton
              label={m.calendar.search.open}
              title={withShortcut(m.calendar.search.open, '/')}
              plain
              onClick={onSearch}
            >
              <SearchIcon size={18} />
            </IconButton>
          )}
          {onCreateEvent && (
            <IconButton
              label={m.calendar.newEvent}
              title={withShortcut(m.calendar.newEvent, 'n')}
              onClick={onCreateEvent}
            >
              <PlusIcon size={16} />
            </IconButton>
          )}
          {accessory}
        </span>
      </div>
    </header>
  )
}
