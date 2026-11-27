import { useId, useRef, useState, type ToggleEvent } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../components/Icons.tsx'
import { IconButton } from '../../../components/IconButton.tsx'
import { useHost } from '../../../context/HostContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { addMonthsToISODate, startOfMonthISO } from '../../../utils/date.ts'
import { placeBelowTriggerCenter } from '../../../utils/popover.ts'
import { withShortcut } from '../../../utils/shortcutLabel.ts'
import { MiniMonth } from './MiniMonth.tsx'

type DateJumpProps = {
  title: string
  anchor: string
  today: string
  range: { from: string; to: string }
  onSelect: (date: string) => void
}

export function DateJump({ title, anchor, today, range, onSelect }: DateJumpProps) {
  const { m, format } = useI18n()
  const { features } = useHost()
  const popoverId = useId()
  const popoverRef = useRef<HTMLDivElement>(null)
  const [month, setMonth] = useState(() => startOfMonthISO(anchor))
  const text = m.calendar.jump
  const select = (date: string) => {
    onSelect(date)
    popoverRef.current?.hidePopover()
  }
  const handleBeforeToggle = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState === 'open') setMonth(startOfMonthISO(anchor))
    placeBelowTriggerCenter(event)
  }
  const handleToggle = (event: ToggleEvent<HTMLDivElement>) => {
    if (event.newState !== 'open') return
    event.currentTarget.querySelector<HTMLElement>('.miniDay[aria-current="true"], .miniDay.today, .miniDay')?.focus()
  }

  return (
    <>
      <button
        type="button"
        className="headerTitleButton"
        popoverTarget={popoverId}
        title={features.shortcuts ? withShortcut(text.open, 'g') : text.open}
        aria-keyshortcuts={features.shortcuts ? 'G' : undefined}
      >
        {title}
        <span className="headerTitleChevron" aria-hidden="true">
          <ChevronDownIcon size={16} />
        </span>
        <span className="visuallyHidden">{`, ${text.open}`}</span>
      </button>
      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="dateJump surface"
        onBeforeToggle={handleBeforeToggle}
        onToggle={handleToggle}
      >
        <div className="dateJumpHeader">
          <IconButton label={text.previousMonth} plain onClick={() => setMonth(addMonthsToISODate(month, -1))}>
            <ChevronLeftIcon size={18} />
          </IconButton>
          <span className="dateJumpMonth" aria-live="polite">
            {format.monthYear(month)}
          </span>
          <IconButton label={text.nextMonth} plain onClick={() => setMonth(addMonthsToISODate(month, 1))}>
            <ChevronRightIcon size={18} />
          </IconButton>
        </div>
        <MiniMonth
          month={month}
          today={today}
          className="dateJumpMonthGrid"
          isSelected={(date) => date >= range.from && date <= range.to}
          onSelectDay={select}
        />
        <Button variant="outline" block onClick={() => select(today)}>
          {m.calendar.today}
        </Button>
      </div>
    </>
  )
}
