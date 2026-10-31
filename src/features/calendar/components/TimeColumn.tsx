import { formatHour } from '../../../utils/date.ts'
import { HOURS } from '../constants/grid.ts'

export function TimeColumn() {
  return (
    <div className="dayTime" aria-hidden="true">
      <div className="columnHeader" />
      <div className="slots">
        {HOURS.map((hour) => (
          <div key={hour} className="time">
            <span className="compactHidden">{formatHour(hour)}</span>
            <span className="compactOnly">{hour}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
