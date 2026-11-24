import type { ReactNode } from 'react'
import { Button } from '../../../components/Button.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { SegmentedControl } from '../../../components/SegmentedControl.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { getViewOptions, withShortcut as addShortcut } from '../constants/views.ts'
import type { CalendarView } from '../types/view.ts'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
} from '../../../components/Icons.tsx'
import { compact } from '../../../utils/list.ts'
import { CalendarMenu, type CalendarMenuItem } from './CalendarMenu.tsx'

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
  onFilter?: () => void
  onPrint?: () => void
  isFiltered?: boolean
  menuItems?: readonly CalendarMenuItem[]
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
  onFilter,
  onPrint,
  isFiltered = false,
  menuItems = [],
  context,
  accessory,
}: CalendarHeaderProps) {
  const { m } = useI18n()
  const { views, features } = useHost()
  const withShortcut = (label: string, key: string) => (features.shortcuts ? addShortcut(label, key) : label)
  const { previous: previousLabel, next: nextLabel } = m.views[view]
  const items = compact<CalendarMenuItem>([
    onSearch && {
      key: 'search',
      label: m.calendar.search.open,
      icon: <SearchIcon size={18} />,
      shortcut: features.shortcuts ? '/' : undefined,
      onSelect: onSearch,
    },
    onFilter && {
      key: 'filter',
      label: m.calendar.filter.title,
      icon: <FilterIcon size={18} />,
      badge: isFiltered ? m.calendar.menu.active : undefined,
      onSelect: onFilter,
    },
    onPrint && { key: 'print', label: m.calendar.print.open, icon: <PrinterIcon size={18} />, onSelect: onPrint },
    ...menuItems,
  ])
  return (
    <header className="header">
      <div className="headerNav">
        <CalendarMenu items={items} isMarked={isFiltered} />
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
        <h1 className="headerTitle" aria-live="polite">
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
