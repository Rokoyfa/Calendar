import { useRef, type ReactNode } from 'react'
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
  CompassIcon,
  KeyboardIcon,
  PrinterIcon,
  SearchIcon,
} from '../../../components/Icons.tsx'
import { compact } from '../../../utils/list.ts'
import { CalendarMenu, type CalendarMenuItem } from './CalendarMenu.tsx'
import { DateJump } from './DateJump.tsx'
import { useHeaderFit } from '../hooks/useHeaderFit.ts'
import { classNames } from '../../../utils/classNames.ts'

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
  onShortcuts?: () => void
  onTour?: () => void
  isFiltered?: boolean
  menuItems?: readonly CalendarMenuItem[]
  context?: ReactNode
  accessory?: ReactNode
  jump?: { anchor: string; today: string; range: { from: string; to: string }; onSelect: (date: string) => void }
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
  onShortcuts,
  onTour,
  isFiltered = false,
  menuItems = [],
  context,
  accessory,
  jump,
}: CalendarHeaderProps) {
  const { m } = useI18n()
  const { features } = useHost()
  const headerRef = useRef<HTMLElement>(null)
  const { isStacked, isSubtitleBelow } = useHeaderFit(headerRef)
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
    onShortcuts && {
      key: 'shortcuts',
      label: m.calendar.shortcutHelp.title,
      icon: <KeyboardIcon size={18} />,
      shortcut: '?',
      onSelect: onShortcuts,
    },
    onTour && { key: 'tour', label: m.calendar.tour.label, icon: <CompassIcon size={18} />, onSelect: onTour },
    ...menuItems,
  ])
  return (
    <header ref={headerRef} className={classNames('header', isStacked && 'header--stacked')}>
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
        <h1 className="headerTitle" aria-live="polite" data-subtitle={isSubtitleBelow ? 'below' : 'side'}>
          {jump ? <DateJump title={title} {...jump} /> : <span className="headerTitleText">{title}</span>}
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
