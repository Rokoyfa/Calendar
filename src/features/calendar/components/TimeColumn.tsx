import { formatHour } from '../../../utils/date.ts'
import { HOURS } from '../constants/grid.ts'

type TimeColumnProps = {
  currentHour: number
}

export function TimeColumn({ currentHour }: TimeColumnProps) {
  return (
    <div className="dayTime" aria-hidden="true">
      <div className="columnHeader" />
      <div className="slots">
        {HOURS.map((hour) => (
          <div key={hour} className={hour === currentHour ? 'time currentTime' : 'time'}>
            {formatHour(hour)}
          </div>
        ))}
      </div>
    </div>
  )
}
