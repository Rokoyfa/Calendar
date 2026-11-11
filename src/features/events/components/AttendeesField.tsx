import { useState } from 'react'
import { SegmentedField } from '../../../components/SegmentedField.tsx'
import { SelectField } from '../../../components/SelectField.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import { MAX_ATTENDEES, type Attendee, type AttendeeStatus } from '../../../utils/event.ts'

export type AttendeeCandidate = { email: string; name: string }

type Response = Exclude<AttendeeStatus, 'needsAction'>

const RESPONSES: readonly Response[] = ['accepted', 'tentative', 'declined']
const ADD = ''

const isResponse = (value: string): value is Response => (RESPONSES as readonly string[]).includes(value)

type AttendeesFieldProps = {
  attendees: readonly Attendee[]
  candidates: readonly AttendeeCandidate[]
  ownEmail: string | null
  onChange: (attendees: Attendee[]) => void
  onRespond?: (status: Response) => Promise<void>
}

export function AttendeesField({ attendees, candidates, ownEmail, onChange, onRespond }: AttendeesFieldProps) {
  const { m } = useI18n()
  const [responseError, setResponseError] = useState<string | null>(null)
  const invited = new Set(attendees.map(({ email }) => email))
  const available = candidates.filter(({ email }) => !invited.has(email.toLowerCase()))
  const own = ownEmail ? attendees.find(({ email }) => email === ownEmail.toLowerCase()) : undefined
  const accepted = attendees.filter(({ status }) => status === 'accepted').length

  const add = (email: string) => {
    const candidate = available.find((entry) => entry.email === email)
    if (candidate && attendees.length < MAX_ATTENDEES)
      onChange([...attendees, { email: candidate.email.toLowerCase(), name: candidate.name, status: 'needsAction' }])
  }

  const respond = async (status: Response) => {
    if (!own || !onRespond) return
    setResponseError(null)
    const previous = [...attendees]
    onChange(attendees.map((attendee) => (attendee === own ? { ...attendee, status } : attendee)))
    try {
      await onRespond(status)
    } catch (error) {
      onChange(previous)
      setResponseError(getErrorMessage(error, m))
    }
  }

  return (
    <fieldset className="attendees">
      <legend className="label">
        {m.events.attendees}
        {attendees.length > 0 && (
          <span className="attendeesSummary"> · {m.events.attendeeSummary(accepted, attendees.length)}</span>
        )}
      </legend>

      {own && onRespond && (
        <SegmentedField
          label={m.events.yourResponse}
          value={own.status === 'needsAction' ? ADD : own.status}
          options={[
            ...(own.status === 'needsAction' ? [{ value: ADD, label: m.events.attendeeStatus.needsAction }] : []),
            ...RESPONSES.map((status) => ({ value: status, label: m.events.respond[status] })),
          ]}
          onChange={(status) => {
            if (isResponse(status)) void respond(status)
          }}
        />
      )}
      <ErrorMessage message={responseError} />

      {attendees.length > 0 && (
        <ul className="attendeeList">
          {attendees.map((attendee) => (
            <li key={attendee.email} className="attendee">
              <span className="attendeeName">
                {attendee.name || attendee.email}
                {attendee.name && <span className="attendeeEmail">{attendee.email}</span>}
              </span>
              <span className={`attendeeStatus attendeeStatus--${attendee.status}`}>
                {m.events.attendeeStatus[attendee.status]}
              </span>
              <button
                type="button"
                className="closeButton"
                aria-label={m.events.removeAttendee(attendee.name || attendee.email)}
                onClick={() => onChange(attendees.filter((entry) => entry !== attendee))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 &&
        (available.length > 0 ? (
          <SelectField
            label={m.events.addAttendee}
            name="addAttendee"
            value={ADD}
            options={[
              { value: ADD, label: '…' },
              ...available.map(({ email, name }) => ({ value: email, label: name ? `${name} (${email})` : email })),
            ]}
            onChange={add}
          />
        ) : (
          <p className="formHint">{m.events.allMembersInvited}</p>
        ))}
    </fieldset>
  )
}
