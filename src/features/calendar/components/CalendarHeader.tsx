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
  views: readonly CalendarView[]
  onViewChange: (view: CalendarView) => void
  navigation?: { onPrevious: () => void; onNext: () => void; onToday: () => void }
  onCreate?: () => void
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
  views,
  title,
  subtitle,
  onViewChange,
  navigation,
  onCreate,
  onSearch,
  onFilter,
  onPrint,
  isFiltered = false,
  menuItems = [],
  context,
  accessory,
}: CalendarHeaderProps) {
  const { m } = useI18n()
  const { features } = useHost()
  const withShortcut = (label: string, key: string) => (features.shortcuts ? addShortcut(label, key) : label)
  const labels = m.views[view]
  const steps = navigation && 'previous' in labels ? { ...navigation, ...labels } : null
  const newLabel = m.calendar.newEvent
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
        {steps && (
          <>
            <IconButton
              label={steps.previous}
              title={withShortcut(steps.previous, '←')}
              plain
              onClick={steps.onPrevious}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton label={steps.next} title={withShortcut(steps.next, '→')} plain onClick={steps.onNext}>
              <ChevronRightIcon />
            </IconButton>
            <Button
              variant="outline"
              className="todayButton"
              title={withShortcut(m.calendar.today, 't')}
              onClick={steps.onToday}
            >
              {m.calendar.today}
            </Button>
          </>
        )}
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
          {onCreate && (
            <IconButton label={newLabel} title={withShortcut(newLabel, 'n')} onClick={onCreate}>
              <PlusIcon size={16} />
            </IconButton>
          )}
          {accessory}
        </span>
      </div>
    </header>
  )
}
