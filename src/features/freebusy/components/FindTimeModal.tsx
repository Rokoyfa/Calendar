import { useCallback, useMemo, useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { Modal } from '../../../components/Modal.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { Switch } from '../../../components/Switch.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import { isUnsupportedEndpoint } from '../../../utils/apiError.ts'
import { addDaysToISODate, timeToMinutes } from '../../../utils/date.ts'
import { fromInstant, toInstant } from '../../../utils/timeZone.ts'
import { usePreferences } from '../../preferences/index.ts'
import { useFreeBusyRepository } from '../hooks/useFreeBusy.ts'
import type { BusyInterval, FreeBusyPerson } from '../types/freeBusy.ts'
import { combineFreeBusy, findCommonSlots } from '../utils/slots.ts'

const WINDOW_DAYS = 14
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240]

export type FindTimePerson = { email: string; name: string }

export type FoundTime = { startDate: string; start: string; endDate: string; end: string }

type FindTimeModalProps = {
  people: readonly FindTimePerson[]
  ownEmail: string | null
  initialDate: string
  durationMinutes: number
  excludeEventId?: string
  onPick: (time: FoundTime) => void
  onClose: () => void
}

const NO_PEOPLE: FreeBusyPerson[] = []

export function FindTimeModal({
  people,
  ownEmail,
  initialDate,
  durationMinutes,
  excludeEventId,
  onPick,
  onClose,
}: FindTimeModalProps) {
  const { m, format } = useI18n()
  const text = m.events.findTime
  const repository = useFreeBusyRepository()
  const timeZone = useViewerTimeZone()
  const { preferences } = usePreferences()
  const [openedAt] = useState(() => Date.now())
  const today = fromInstant(openedAt, timeZone).date
  const [fromDate, setFromDate] = useState(initialDate > today ? initialDate : today)
  const [duration, setDuration] = useState(durationMinutes > 0 ? durationMinutes : 60)
  const [includeWeekends, setIncludeWeekends] = useState(false)
  const toDate = addDaysToISODate(fromDate, WINDOW_DAYS - 1)
  const emails = useMemo(
    () => [...new Set([ownEmail, ...people.map((person) => person.email)].filter(Boolean) as string[])],
    [ownEmail, people],
  )

  const [isNotOffered, setNotOffered] = useState(false)
  const load = useCallback(async () => {
    if (!repository) return NO_PEOPLE
    return repository
      .lookup({
        from: toInstant({ date: fromDate, time: '00:00' }, timeZone),
        to: toInstant({ date: addDaysToISODate(toDate, 1), time: '00:00' }, timeZone),
        emails: emails.map((email) => email.toLowerCase()),
        excludeEventId,
      })
      .catch((error: unknown) => {
        if (!isUnsupportedEndpoint(error)) throw error
        setNotOffered(true)
        return NO_PEOPLE
      })
  }, [repository, fromDate, toDate, timeZone, emails, excludeEventId])
  const { data: found, error, isLoading } = useAsyncResource(load, NO_PEOPLE)

  const slots = useMemo(() => {
    const { busy, blockedDates } = combineFreeBusy(found)
    return findCommonSlots({
      durationMinutes: duration,
      fromDate,
      toDate,
      dayStart: preferences.planningDayStart,
      dayEnd: preferences.planningDayEnd,
      includeWeekends,
      timeZone,
      now: openedAt,
      busy,
      blockedDates,
    })
  }, [found, duration, fromDate, toDate, preferences, includeWeekends, timeZone, openedAt])

  const byEmail = new Map(found.map((person) => [person.email, person]))
  const nameOf = (email: string) =>
    email === ownEmail?.toLowerCase()
      ? text.you
      : (people.find((person) => person.email.toLowerCase() === email)?.name ?? email)
  const unknown = emails.filter((email) => byEmail.get(email.toLowerCase())?.available === false)
  const durations = DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b)
  const timeOf = (instant: number) => timeToMinutes(fromInstant(instant, timeZone).time)

  const pick = ({ start, end }: BusyInterval) => {
    const first = fromInstant(start, timeZone)
    const last = fromInstant(end, timeZone)
    onPick({ startDate: first.date, start: first.time, endDate: last.date, end: last.time })
  }

  return (
    <Modal title={text.title} onClose={onClose}>
      <div className="findTime">
        <SelectField
          label={text.duration}
          name="findTimeDuration"
          value={String(duration)}
          options={durations.map((minutes) => ({ value: String(minutes), label: format.effort(minutes) }))}
          onChange={(value) => setDuration(Number(value))}
        />
        <Switch label={text.weekends} checked={includeWeekends} onChange={setIncludeWeekends} />
        <p className="formHint">
          {text.window(
            format.time(timeToMinutes(preferences.planningDayStart)),
            format.time(timeToMinutes(preferences.planningDayEnd)),
          )}
        </p>
        <section aria-label={m.events.tabs.attendees}>
          <h3 className="formSubtitle">{m.events.tabs.attendees}</h3>
          <ul className="findTimePeople">
            {emails.map((email) => {
              const person = byEmail.get(email.toLowerCase())
              return (
                <li key={email}>
                  <span className="findTimePerson">{nameOf(email.toLowerCase())}</span>
                  <span className="formHint">
                    {person === undefined ? text.checking : person.available ? text.known : text.unknown}
                  </span>
                </li>
              )
            })}
          </ul>
          {unknown.length > 0 && <p className="formHint">{text.unknownHint}</p>}
        </section>
        <section className="findTimeSuggestions" aria-label={text.suggestions}>
          <h3 className="formSubtitle">
            {text.suggestions} · {text.range(format.fullDay(fromDate), format.fullDay(toDate))}
          </h3>
          {isLoading && <p className="formHint">{text.loading}</p>}
          <ErrorMessage message={error} />
          {isNotOffered && <p className="eventNotice">{text.notOffered}</p>}
          {!isLoading && !error && !isNotOffered && slots.length === 0 && <p className="eventNotice">{text.none}</p>}
          {!isLoading && !isNotOffered && slots.length > 0 && (
            <ul className="findTimeSlots">
              {slots.map((slot) => (
                <li key={slot.start}>
                  <Button variant="outline" block onClick={() => pick(slot)}>
                    {text.slot(
                      format.longDate(fromInstant(slot.start, timeZone).date),
                      format.time(timeOf(slot.start)),
                      format.time(timeOf(slot.end)),
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="modalActions">
          <Button
            variant="outline"
            disabled={fromDate <= today}
            onClick={() => {
              const previous = addDaysToISODate(fromDate, -WINDOW_DAYS)
              setFromDate(previous > today ? previous : today)
            }}
          >
            {text.earlier}
          </Button>
          <Button variant="outline" onClick={() => setFromDate(addDaysToISODate(fromDate, WINDOW_DAYS))}>
            {text.later}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {m.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
