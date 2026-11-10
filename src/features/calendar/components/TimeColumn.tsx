import { useI18n } from '../../../i18n/index.ts'
import { HOURS } from '../constants/grid.ts'

export function TimeColumn() {
  const { m, format } = useI18n()
  return (
    <div className="dayTime" aria-hidden="true">
      <div className="columnHeader" />
      <div className="allDayLane allDayLabel">{m.events.allDay}</div>
      <div className="slots">
        {HOURS.map((hour) => (
          <div key={hour} className="time">
            <span className="compactHidden">{format.hour(hour)}</span>
            <span className="compactOnly">{format.compactHour(hour)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
