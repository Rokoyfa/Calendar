import { formatWeekTitle } from '../../../utils/date.ts'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './Icons.tsx'

type CalendarHeaderProps = {
  weekStart: Date
  weekNumber: number
  onPreviousWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
  onCreateEvent: () => void
}

export function CalendarHeader({
  weekStart,
  weekNumber,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onCreateEvent,
}: CalendarHeaderProps) {
  return (
    <header className="header">
      <div className="weekControls">
        <button
          type="button"
          className="iconButton iconButton--plain"
          aria-label="Vorherige Woche"
          title="Vorherige Woche (←)"
          onClick={onPreviousWeek}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="iconButton iconButton--plain"
          aria-label="Nächste Woche"
          title="Nächste Woche (→)"
          onClick={onNextWeek}
        >
          <ChevronRightIcon />
        </button>
        <span className="weekDisplay text-muted">KW {weekNumber}</span>
      </div>

      <h1>
        <button type="button" className="headerTitle" title="Zur aktuellen Woche" onClick={onCurrentWeek}>
          {formatWeekTitle(weekStart)}
        </button>
      </h1>

      <div className="generalControls">
        <button
          type="button"
          className="iconButton"
          aria-label="Neuer Termin"
          title="Neuer Termin"
          onClick={onCreateEvent}
        >
          <PlusIcon size={16} />
        </button>
      </div>
    </header>
  )
}
