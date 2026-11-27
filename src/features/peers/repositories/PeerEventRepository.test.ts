import { describe, expect, it, vi } from 'vitest'
import type { PeerCalendar, PeerEvent } from '../utils/peerCalendar.ts'
import { eventInput } from '../../../test/fixtures.ts'
import type { EventRepository, PersonalSharingRepository } from '../../storage/index.ts'
import { PeerEventRepository, withPeerEvents } from './PeerEventRepository.ts'

const calendar: PeerCalendar = {
  id: 's1',
  ownerName: 'Ada',
  status: 'accepted',
  color: 'blue',
  shown: true,
  expiresAt: null,
}

const blocker: PeerEvent = {
  id: 'b1',
  title: '',
  location: '',
  description: '',
  busy: true,
  request: null,
  event: {
    startDate: '2026-12-01',
    start: '09:00',
    endDate: '2026-12-01',
    end: '10:00',
    allDay: false,
    timeZone: null,
    recurrence: null,
    excludedDates: [],
    seriesId: null,
    originalDate: null,
  },
}

const request: PeerEvent = { ...blocker, id: 'e1', busy: false, title: 'Call', request: { status: 'pending' } }

const createApi = () =>
  ({
    listPeerEvents: vi.fn(async () => [blocker]),
    createRequest: vi.fn(async () => request),
    updateRequest: vi.fn(async () => request),
    withdrawRequest: vi.fn(async () => undefined),
  }) as unknown as PersonalSharingRepository & {
    listPeerEvents: ReturnType<typeof vi.fn>
    createRequest: ReturnType<typeof vi.fn>
    updateRequest: ReturnType<typeof vi.fn>
    withdrawRequest: ReturnType<typeof vi.fn>
  }

const createMain = () =>
  ({
    list: vi.fn(async () => []),
    listSeries: vi.fn(async () => []),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    move: vi.fn(),
    restore: vi.fn(),
    search: vi.fn(async () => []),
  }) as unknown as EventRepository & Record<'list' | 'move' | 'restore' | 'search', ReturnType<typeof vi.fn>>

const setup = () => {
  const api = createApi()
  const main = createMain()
  const peers = new PeerEventRepository(api)
  peers.setBusyTitle('Busy')
  peers.setCalendars([calendar, { ...calendar, id: 's2', status: 'pending' }])
  return { api, main, repository: withPeerEvents(main, peers) }
}

describe('withPeerEvents', () => {
  it('lists peer events only for accepted calendars and keeps them out of the main repository', async () => {
    const { api, main, repository } = setup()
    const events = await repository.list({
      from: '2026-12-01',
      to: '2026-12-07',
      calendarIds: ['cal1', 'peer:s1', 'peer:s2'],
    })
    expect(main.list).toHaveBeenCalledWith({ from: '2026-12-01', to: '2026-12-07', calendarIds: ['cal1'] })
    expect(api.listPeerEvents).toHaveBeenCalledTimes(1)
    expect(events).toEqual([expect.objectContaining({ id: 'peer:s1:b1', title: 'Busy', calendarId: 'peer:s1' })])
  })

  it('routes requests to the sharing api', async () => {
    const { api, repository } = setup()
    const input = eventInput()
    const created = await repository.create('peer:s1', input)
    expect(created).toMatchObject({ id: 'peer:s1:e1', title: 'Call', request: { status: 'pending', mine: true } })
    await repository.update('peer:s1:e1', input)
    expect(api.updateRequest).toHaveBeenCalledWith('s1', 'e1', input)
    await repository.remove('peer:s1:e1')
    expect(api.withdrawRequest).toHaveBeenCalledWith('s1', 'e1')
  })

  it('refuses unknown calendars, moves and restores', async () => {
    const { main, repository } = setup()
    const input = eventInput()
    await expect(repository.create('peer:s2', input)).rejects.toMatchObject({ code: 'sharedCalendarNotFound' })
    await expect(repository.move!('cal1:e1', 'peer:s1')).rejects.toMatchObject({ code: 'forbidden' })
    await expect(repository.restore!('peer:s1:e1')).rejects.toMatchObject({ code: 'eventNotFound' })
    expect(main.move).not.toHaveBeenCalled()
    expect(main.restore).not.toHaveBeenCalled()
  })

  it('searches only own calendars', async () => {
    const { main, repository } = setup()
    expect(await repository.search!({ text: 'x', calendarIds: ['peer:s1'] })).toEqual([])
    expect(main.search).not.toHaveBeenCalled()
  })
})
