import { describe, expect, it } from 'vitest'
import {
  isOwnPendingRequest,
  isOwnRequest,
  parsePeerCalendars,
  parsePeerEvent,
  parsePeerEventId,
  parseSharingState,
  peerCalendarId,
  peerEventId,
  shareIdOf,
  toEventRequestInput,
  toPeerCalendarEvent,
  type PeerCalendar,
} from './peerCalendar.ts'

const calendar: PeerCalendar = {
  id: 's1',
  ownerName: 'Ada',
  status: 'accepted',
  color: 'blue',
  shown: true,
  expiresAt: null,
}

const BLOCKER = {
  id: 'b123',
  title: '',
  location: '',
  description: '',
  busy: true,
  request: null,
  startDate: '2026-12-01',
  start: '09:00',
  endDate: '2026-12-01',
  end: '10:00',
  allDay: false,
  timeZone: 'Europe/Berlin',
}

describe('peer calendar ids', () => {
  it('round-trips calendar and event ids', () => {
    expect(peerCalendarId('s1')).toBe('peer:s1')
    expect(shareIdOf('peer:s1')).toBe('s1')
    expect(shareIdOf('cal1')).toBeNull()
    expect(parsePeerEventId(peerEventId('s1', 'e1'))).toEqual({ shareId: 's1', eventId: 'e1' })
  })

  it('rejects malformed event ids', () => {
    expect(parsePeerEventId('e1')).toBeNull()
    expect(parsePeerEventId('peer:s1')).toBeNull()
    expect(parsePeerEventId('peer:s1:e1:x')).toBeNull()
  })
})

describe('parsers', () => {
  it('keeps only valid viewers and calendars', () => {
    expect(
      parseSharingState({
        enabled: true,
        viewers: [
          { id: 'v1', email: 'a@example.com', name: '', status: 'pending', invitedAt: 'x', expiresAt: 'y' },
          { id: 'v2', email: 'b@example.com', status: 'unknown' },
        ],
      }),
    ).toEqual({
      enabled: true,
      viewers: [{ id: 'v1', email: 'a@example.com', name: null, status: 'pending', invitedAt: 'x', expiresAt: 'y' }],
    })
    expect(parsePeerCalendars([{ id: 's1', ownerName: 'Ada', status: 'accepted', color: 'nope' }, {}])).toEqual([
      { ...calendar, color: 'green' },
    ])
  })

  it('treats events as busy unless the server says otherwise', () => {
    expect(parsePeerEvent({ ...BLOCKER, busy: undefined })?.busy).toBe(true)
    expect(parsePeerEvent({ ...BLOCKER, start: 'later' })).toBeNull()
  })
})

describe('toPeerCalendarEvent', () => {
  it('shows blockers with the busy title and without details', () => {
    const event = toPeerCalendarEvent(calendar, parsePeerEvent(BLOCKER)!, 'Busy')
    expect(event).toMatchObject({
      id: 'peer:s1:b123',
      calendarId: 'peer:s1',
      title: 'Busy',
      color: 'blue',
      visibility: 'private',
      request: null,
      attendees: [],
    })
    expect(isOwnRequest(event)).toBe(false)
  })

  it('marks own requests', () => {
    const peer = parsePeerEvent({ ...BLOCKER, id: 'e1', busy: false, title: 'Call', request: { status: 'pending' } })!
    const event = toPeerCalendarEvent(calendar, peer, 'Busy')
    expect(event.title).toBe('Call')
    expect(isOwnPendingRequest(event)).toBe(true)
    expect(isOwnPendingRequest({ ...event, request: { status: 'accepted', requester: null, mine: true } })).toBe(false)
    expect(isOwnRequest({ ...event, calendarId: 'cal1' })).toBe(false)
  })
})

describe('toEventRequestInput', () => {
  it('sends only the fields a request may carry', () => {
    const input = toEventRequestInput({
      title: 'Call',
      location: '',
      description: 'Hi',
      startDate: '2026-12-01',
      start: '09:00',
      endDate: '2026-12-01',
      end: '10:00',
      allDay: false,
      timeZone: null,
      ...{ attendees: [{ email: 'x@example.com' }], color: 'red' },
    } as Parameters<typeof toEventRequestInput>[0])
    expect(Object.keys(input).sort()).toEqual(
      ['allDay', 'description', 'end', 'endDate', 'location', 'start', 'startDate', 'timeZone', 'title'].sort(),
    )
  })
})
