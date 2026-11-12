import { describe, expect, it } from 'vitest'
import { calendarEvent, recurrence } from '../test/fixtures.ts'
import { expandEvents } from './event.ts'
import { getChatId, getChatKey, parseChatEvent, parseChatUnread, toSocketUrl } from './chat.ts'

describe('chat', () => {
  it('uses one chat per single event and one per occurrence of a series', () => {
    const single = calendarEvent({ id: 'single', startDate: '2026-11-10', endDate: '2026-11-10' })
    const series = calendarEvent({
      id: 'series',
      startDate: '2026-11-09',
      endDate: '2026-11-09',
      recurrence: recurrence(),
    })
    const detached = calendarEvent({
      id: 'detached',
      startDate: '2026-11-11',
      endDate: '2026-11-11',
      start: '18:00',
      end: '19:00',
      seriesId: 'series',
      originalDate: '2026-11-10',
    })
    const [occurrence] = expandEvents([single], '2026-11-10', '2026-11-10')
    expect(getChatKey(occurrence)).toEqual({ eventId: 'single', occurrenceDate: null })
    const days = expandEvents([series], '2026-11-09', '2026-11-10').map(getChatKey)
    expect(days.map(getChatId)).toEqual(['series|2026-11-09', 'series|2026-11-10'])
    const [moved] = expandEvents([detached], '2026-11-11', '2026-11-11')
    expect(getChatKey(moved)).toEqual({ eventId: 'series', occurrenceDate: '2026-11-10' })
  })

  it('reads socket events and unread counts defensively', () => {
    expect(
      parseChatEvent({ type: 'message.deleted', id: 'm', calendarId: 'c', eventId: 'e', occurrenceDate: null }),
    ).toEqual({
      type: 'message.deleted',
      id: 'm',
      calendarId: 'c',
      eventId: 'e',
      occurrenceDate: null,
    })
    expect(parseChatEvent({ type: 'message.created', message: { id: 'x' } })).toBeNull()
    expect(
      parseChatUnread([
        { eventId: 'e', occurrenceDate: '2026-11-10', count: 2 },
        { eventId: 'f', count: 0 },
      ]),
    ).toEqual([{ eventId: 'e', occurrenceDate: '2026-11-10', count: 2 }])
  })

  it('derives the socket address from the API address', () => {
    expect(toSocketUrl('/api/', '/chat/socket', 'https://host.example/calendar')).toBe(
      'wss://host.example/api/chat/socket',
    )
    expect(toSocketUrl('http://localhost:3000/api', '/chat/socket')).toBe('ws://localhost:3000/api/chat/socket')
  })
})
