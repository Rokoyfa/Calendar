import { useId, useRef, useState, type KeyboardEvent, type ToggleEvent } from 'react'
import { Link } from 'react-router'
import { CheckIcon, ChevronDownIcon, PlusIcon } from '../../../components/Icons.tsx'
import { ROUTES } from '../../../config/routes.ts'
import { useAuth } from '../../authorization/index.ts'
import { getEventColorAttributes, type EventColor } from '../../../domain/event.ts'
import { useI18n } from '../../../i18n/index.ts'
import { placeBelowTriggerStart } from '../../../utils/popover.ts'
import { withShortcut } from '../../../utils/shortcutLabel.ts'
import { useHost } from '../../../context/HostContext.ts'
import { useCalendarOptions, type CalendarOption } from '../hooks/useCalendarOptions.ts'
import { useCalendars } from '../hooks/useCalendars.ts'
import { isPersonalCalendar } from '../utils/permissions.ts'
import { CalendarSwitcherModal } from './CalendarSwitcher.tsx'
import { Checkbox, Input } from '../../../components/Input.tsx'

type SharedCalendar = { name: string; color: EventColor }

type OverlayToggleProps = {
  color: EventColor
  label: string
  shown: boolean
  onChange: (shown: boolean) => Promise<void>
}

function OverlayToggle({ color, label, shown, onChange }: OverlayToggleProps) {
  const [pending, setPending] = useState<boolean | null>(null)
  const checked = pending ?? shown
  const toggle = async () => {
    const next = !checked
    setPending(next)
    try {
      await onChange(next)
    } finally {
      setPending(null)
    }
  }
  return (
    <Checkbox
      {...getEventColorAttributes(color, 'quickSwitcherOverlay')}
      aria-label={label}
      title={label}
      checked={checked}
      disabled={pending !== null}
      onChange={() => void toggle()}
    />
  )
}

const SEARCH_FROM = 8
const ITEM_SELECTOR = '.quickSwitcherItem'
const STEP_BY_KEY: Partial<Record<string, number>> = { ArrowDown: 1, ArrowUp: -1 }

const matches = (option: CalendarOption, query: string) =>
  `${option.name} ${option.meta}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())

export function ActiveCalendarIndicator({ shared }: { shared?: SharedCalendar }) {
  const { m } = useI18n()
  const { features } = useHost()
  const { user } = useAuth()
  const { activeCalendar } = useCalendars()
  const options = useCalendarOptions()
  const popoverId = useId()
  const popoverRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { indicator, roles, switcher, quickSwitcher } = m.calendars
  const current = shared ?? activeCalendar
  const meta = shared
    ? indicator.shared
    : isPersonalCalendar(activeCalendar)
      ? indicator.onlyYou
      : indicator.team(roles[activeCalendar.role])
  const total = options.personal.length + options.teams.length + options.shared.length
  const canCreate = options.hasTeams && user !== null
  const content = (
    <>
      <span className="activeCalendarDot" aria-hidden="true" />
      <span className="activeCalendarName">{current.name}</span>
      <span className="activeCalendarMeta">{meta}</span>
    </>
  )

  if (total < 2 && !canCreate)
    return (
      <p {...getEventColorAttributes(current.color, 'activeCalendar')} aria-label={indicator.current(current.name)}>
        {content}
      </p>
    )

  const close = () => popoverRef.current?.hidePopover()
  const select = (id: string) => {
    options.select(id)
    close()
  }
  const items = () => [...(popoverRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])]
  const handleToggle = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState !== 'open') {
      setQuery('')
      return
    }
    const popover = event.currentTarget
    const target =
      popover.querySelector<HTMLElement>('.quickSwitcherSearch') ??
      popover.querySelector<HTMLElement>(`${ITEM_SELECTOR}[aria-current="true"]`) ??
      items()[0]
    target?.focus()
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items()
    if (list.length === 0) return
    const index = list.indexOf(event.target as HTMLElement)
    const step = STEP_BY_KEY[event.key]
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? list.length - 1
          : step === undefined
            ? null
            : index === -1
              ? step > 0
                ? 0
                : list.length - 1
              : (index + step + list.length) % list.length
    if (next === null) return
    event.preventDefault()
    event.stopPropagation()
    list[next].focus()
  }

  const groups = [
    { key: 'personal', label: switcher.personal, list: options.personal },
    { key: 'teams', label: switcher.teams, list: options.hasTeams ? options.teams : [] },
    { key: 'shared', label: switcher.shared, list: options.shared },
  ]
    .map((group) => ({ ...group, list: group.list.filter((option) => matches(option, query)) }))
    .filter((group) => group.list.length > 0)

  return (
    <>
      <button
        type="button"
        {...getEventColorAttributes(current.color, 'activeCalendar', 'activeCalendarButton')}
        popoverTarget={popoverId}
        title={features.shortcuts ? withShortcut(switcher.open, 's') : switcher.open}
        aria-keyshortcuts={features.shortcuts ? 'S' : undefined}
      >
        {content}
        <span className="visuallyHidden">{quickSwitcher.hint}</span>
        <span className="activeCalendarChevron" aria-hidden="true">
          <ChevronDownIcon size={14} />
        </span>
      </button>
      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="quickSwitcher surface"
        onBeforeToggle={placeBelowTriggerStart}
        onToggle={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {total >= SEARCH_FROM && (
          <Input
            type="search"
            className="quickSwitcherSearch"
            placeholder={quickSwitcher.search}
            aria-label={quickSwitcher.search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
        {groups.some((group) => group.list.some((option) => option.overlay)) && (
          <p className="quickSwitcherHint">{quickSwitcher.overlayHint}</p>
        )}
        <div className="quickSwitcherList">
          {groups.length === 0 && <p className="emptyHint">{quickSwitcher.noMatch}</p>}
          {groups.map((group) => (
            <section key={group.key} className="quickSwitcherGroup" aria-label={group.label}>
              <p className="quickSwitcherGroupTitle" aria-hidden="true">
                {group.label}
              </p>
              <ul>
                {group.list.map((option) => (
                  <li key={option.id} className="quickSwitcherRow">
                    <button
                      type="button"
                      {...getEventColorAttributes(option.color, 'quickSwitcherItem', option.isActive && 'active')}
                      aria-current={option.isActive}
                      onClick={() => select(option.id)}
                    >
                      <span className="activeCalendarDot" aria-hidden="true" />
                      <span className="quickSwitcherName">{option.name}</span>
                      <span className="quickSwitcherMeta">{option.meta}</span>
                      {option.isActive && (
                        <span className="quickSwitcherCheck" aria-hidden="true">
                          <CheckIcon size={14} />
                        </span>
                      )}
                    </button>
                    {option.overlay && (
                      <OverlayToggle
                        color={option.color}
                        label={quickSwitcher.overlay(option.name)}
                        shown={option.overlay.shown}
                        onChange={option.overlay.set}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="quickSwitcherFooter">
          <button
            type="button"
            className="quickSwitcherItem quickSwitcherAction"
            onClick={() => {
              close()
              setIsModalOpen(true)
            }}
          >
            {quickSwitcher.all}
          </button>
          {canCreate && (
            <Link to={ROUTES.createCalendar} className="quickSwitcherItem quickSwitcherAction" onClick={close}>
              <PlusIcon size={14} />
              {switcher.newCalendar}
            </Link>
          )}
        </div>
      </div>
      {isModalOpen && <CalendarSwitcherModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
