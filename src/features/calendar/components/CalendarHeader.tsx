import { IconButton } from '../../../components/IconButton.tsx'
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
        <IconButton label="Vorherige Woche" title="Vorherige Woche (←)" plain onClick={onPreviousWeek}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton label="Nächste Woche" title="Nächste Woche (→)" plain onClick={onNextWeek}>
          <ChevronRightIcon />
        </IconButton>
        <span className="weekDisplay text-muted">KW {weekNumber}</span>
      </div>

      <h1>
        <button type="button" className="headerTitle" title="Zur aktuellen Woche" onClick={onCurrentWeek}>
          {formatWeekTitle(weekStart)}
        </button>
      </h1>

      <div className="generalControls">
        <IconButton label="Neuer Termin" onClick={onCreateEvent}>
          <PlusIcon size={16} />
        </IconButton>
      </div>
    </header>
  )
}
