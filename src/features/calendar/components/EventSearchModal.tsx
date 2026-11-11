import { useState } from 'react'
import { Modal } from '../../../components/Modal.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useI18n } from '../../../i18n/index.ts'
import {
  formatEventPeriod,
  getEventColorAttributes,
  moveToStartDate,
  type CalendarEvent,
} from '../../../utils/event.ts'
import { useEventSearch } from '../hooks/useEventSearch.ts'
import { useEventSources } from '../hooks/useEventSource.ts'

type EventSearchModalProps = {
  calendarIds: readonly string[]
  today: string
  onSelect: (event: CalendarEvent, date: string) => void
  onClose: () => void
}

export function EventSearchModal({ calendarIds, today, onSelect, onClose }: EventSearchModalProps) {
  const i18n = useI18n()
  const { search } = i18n.m.calendar
  const [text, setText] = useState('')
  const { results, isSearching, isTooShort, error } = useEventSearch(text, calendarIds, today)
  const sources = useEventSources()

  return (
    <Modal title={search.title} onClose={onClose}>
      <div className="eventSearch">
        <input
          className="input"
          type="text"
          enterKeyHint="search"
          name="search"
          placeholder={search.placeholder}
          aria-label={search.title}
          autoComplete="off"
          value={text}
          onChange={(event) => setText(event.target.value)}
          data-autofocus
        />
        <ErrorMessage message={error} />
        {isTooShort ? (
          <p className="formHint">{search.hint}</p>
        ) : isSearching ? (
          <p className="formHint">{search.searching}</p>
        ) : results.length === 0 ? (
          <p className="formHint">{search.empty}</p>
        ) : (
          <ul className="eventSearchResults">
            {results.map(({ event, date }) => {
              const source = sources.get(event.calendarId)
              return (
                <li key={event.id}>
                  <button type="button" className="eventSearchResult" onClick={() => onSelect(event, date)}>
                    <span {...getEventColorAttributes(event.color, 'eventSearchColor')} aria-hidden="true" />
                    <span className="eventSearchText">
                      <span className="eventSearchTitle">{event.title}</span>
                      <span className="eventSearchMeta">
                        {formatEventPeriod({ ...event, ...moveToStartDate(event, date) }, i18n)}
                        {event.location && ` · ${event.location}`}
                        {source && ` · ${source.name}`}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
