import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { withoutPropagation } from '../../../utils/dom.ts'
import type { EventOccurrence } from '../../../utils/event.ts'
import { useHolidayMap } from '../context/HolidaysContext.ts'
import { useSegmentAttributes } from '../hooks/useSegmentAttributes.ts'
import { EVENT_NAVIGATION_KEYS } from '../hooks/useEventNavigation.ts'
import type { EventSegment } from '../types/eventLayout.ts'
import type { CalendarViewProps } from '../types/view.ts'
import { sortSegments } from '../utils/layoutEvents.ts'
import { EventTitle } from './EventTitle.tsx'
import { UnreadBadge } from '../../chat/index.ts'
import { getChatKey } from '../../../utils/chat.ts'
import { DayTasks, useTasksContext } from '../../tasks/index.ts'

const MINUTES_PER_DAY = 24 * 60

type AgendaItemProps = {
  segment: EventSegment
  onSelect: (event: EventOccurrence) => void
}

function AgendaItem({ segment, onSelect }: AgendaItemProps) {
  const { m } = useI18n()
  const { i18n, source, style, attributes, details } = useSegmentAttributes(segment, 'agendaItem')
  const { event, start, end, continuesBefore, continuesAfter } = segment
  const isWholeDay = event.allDay || (continuesBefore && continuesAfter)
  const time = isWholeDay
    ? m.views.agenda.allDay
    : `${continuesBefore ? '' : i18n.format.time(start)} – ${continuesAfter ? '' : i18n.format.time(Math.min(end, MINUTES_PER_DAY))}`.trim()

  return (
    <li>
      <button
        type="button"
        {...attributes}
        style={style}
        aria-keyshortcuts={EVENT_NAVIGATION_KEYS}
        data-event-target=""
        onClick={withoutPropagation(() => onSelect(event))}
      >
        <span className="agendaTime">{time}</span>
        <span className="agendaColor" aria-hidden="true" />
        <EventTitle event={event} source={source} withLocation />
        {!continuesBefore && <UnreadBadge chatKey={getChatKey(event)} />}
        <span className="visuallyHidden">, {details}</span>
      </button>
    </li>
  )
}

export function AgendaView({ dates, today, segmentsByDate, onEventSelect, onShowDay }: CalendarViewProps) {
  const i18n = useI18n()
  const { m, format } = i18n
  const holidays = useHolidayMap()
  const tasksByDate = useTasksContext()?.byDate
  const days = dates
    .map((date) => ({
      date,
      segments: sortSegments(segmentsByDate.get(date) ?? []),
      holiday: holidays.get(date) ?? [],
      hasTasks: (tasksByDate?.get(date)?.length ?? 0) > 0,
    }))
    .filter(({ segments, holiday, hasTasks }) => segments.length > 0 || holiday.length > 0 || hasTasks)

  if (days.length === 0) return <p className="agendaEmpty">{m.views.agenda.empty}</p>

  return (
    <div className="agendaView">
      {days.map(({ date, segments, holiday, hasTasks }) => (
        <section key={date} className={classNames('agendaDay', date === today && 'today')} data-date={date}>
          <h3 className="agendaDate">
            <button type="button" title={m.calendar.openDay(format.longDate(date))} onClick={() => onShowDay(date)}>
              {format.longDate(date)}
            </button>
            {date === today && <span className="agendaToday">{m.calendar.todayMark}</span>}
          </h3>
          {holiday.length > 0 && (
            <p className="holidayLabel" title={m.calendar.holiday(holiday.join(' · '))}>
              {holiday.join(' · ')}
            </p>
          )}
          {hasTasks && (
            <div className="agendaTasks">
              <DayTasks date={date} />
            </div>
          )}
          {segments.length > 0 && (
            <ul className="agendaList">
              {segments.map((segment) => (
                <AgendaItem key={segment.event.occurrenceKey} segment={segment} onSelect={onEventSelect} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
