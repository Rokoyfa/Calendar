import { describe, expect, it } from 'vitest'
import { parseNotification, parseNotificationPage } from './notification.ts'

describe('notifications', () => {
  it('parses a page', () => {
    const page = parseNotificationPage({
      notifications: [
        {
          id: 'n1',
          kind: 'eventChanged',
          actor: { id: 'u1', name: 'Anna' },
          event: { id: 'e1', calendarId: 'c1', title: 'Plan', startDate: '2026-12-01', occurrenceDate: null },
          team: null,
          invitationId: null,
          createdAt: '2026-11-19T10:00:00.000Z',
          readAt: null,
        },
        { id: 'n2', kind: 'unknown', createdAt: '2026-11-19T10:00:00.000Z' },
      ],
      unread: 3.7,
      hasMore: false,
    })
    expect(page.notifications).toHaveLength(1)
    expect(page.unread).toBe(3)
    expect(page.notifications[0].event).toEqual({
      id: 'e1',
      calendarId: 'c1',
      title: 'Plan',
      startDate: '2026-12-01',
      occurrenceDate: null,
    })
  })

  it('keeps a team invitation without event', () => {
    expect(
      parseNotification({
        id: 'n3',
        kind: 'teamInvitation',
        actor: null,
        team: { id: 't1', name: 'Projekt' },
        invitationId: 'i1',
        createdAt: '2026-11-19T10:00:00.000Z',
        readAt: '2026-11-19T11:00:00.000Z',
      }),
    ).toMatchObject({ event: null, team: { id: 't1', name: 'Projekt' }, invitationId: 'i1' })
  })
})
