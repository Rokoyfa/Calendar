import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../../utils/appError.ts'
import type { CaldavCalendar, CaldavObject } from '../utils/caldav.ts'
import { toEventInput } from '../../../domain/event.ts'
import type { CaldavRepository, EventRepository } from '../../storage/index.ts'
import { CaldavEventRepository, withCaldavEvents } from './CaldavEventRepository.ts'

const calendar: CaldavCalendar = {
  id: 'c1',
  name: 'Cloud',
  color: 'blue',
  shown: true,
  readOnly: false,
  position: 0,
  syncedAt: null,
}

const SERIES = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:weekly@example.com',
  'DTSTART;TZID=Europe/Berlin:20261123T100000',
  'DTEND;TZID=Europe/Berlin:20261123T110000',
  'SUMMARY:Weekly',
  'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4',
  'ATTENDEE;CN=Me;PARTSTAT=NEEDS-ACTION:mailto:me@example.com',
  'END:VEVENT',
  'END:VCALENDAR',
  '',
].join('\r\n')

const createApi = () => {
  const objects = new Map<string, CaldavObject>([['o1', { id: 'o1', etag: '"1"', data: SERIES }]])
  let counter = 1
  const api = {
    list: vi.fn(async () => [
      {
        id: 'a1',
        name: 'Cloud',
        serverHost: 'x',
        username: 'u',
        syncedAt: null,
        syncError: null,
        calendars: [calendar],
      },
    ]),
    listObjects: vi.fn(async () => [...objects.values()]),
    createObject: vi.fn(async (_calendarId: string, data: string) => {
      const object = { id: `o${++counter}`, etag: '"1"', data }
      objects.set(object.id, object)
      return object
    }),
    updateObject: vi.fn(async (_calendarId: string, objectId: string, data: string, etag: string) => {
      const current = objects.get(objectId)!
      if (current.etag !== etag) throw new AppError('eventChanged')
      const object = { id: objectId, etag: `"${Number(etag.slice(1, -1)) + 1}"`, data }
      objects.set(objectId, object)
      return object
    }),
    removeObject: vi.fn(async (_calendarId: string, objectId: string) => {
      objects.delete(objectId)
    }),
  }
  return { api: api as unknown as CaldavRepository, calls: api, objects }
}

const query = { from: '2026-11-01', to: '2026-12-31', calendarIds: ['caldav:c1'] }

describe('CaldavEventRepository', () => {
  it('lists events of the shown calendars and caches the objects', async () => {
    const { api, calls } = createApi()
    const repository = new CaldavEventRepository(api)
    repository.setCalendars([calendar])
    const events = await repository.list(query)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ id: 'caldav:c1:o1', calendarId: 'caldav:c1', title: 'Weekly' })
    await repository.list(query)
    expect(calls.listObjects).toHaveBeenCalledTimes(1)
    repository.forget(['c1'])
    await repository.list(query)
    expect(calls.listObjects).toHaveBeenCalledTimes(2)
  })

  it('detaches an occurrence into the same object and removes it again', async () => {
    const { api, objects } = createApi()
    const repository = new CaldavEventRepository(api)
    repository.setCalendars([calendar])
    const [series] = await repository.list(query)
    await repository.update(series.id, { ...toEventInput(series), excludedDates: ['2026-11-30'] })
    const detached = await repository.create('caldav:c1', {
      ...toEventInput(series),
      title: 'Moved',
      startDate: '2026-11-30',
      endDate: '2026-11-30',
      start: '12:00',
      end: '13:00',
      recurrence: null,
      excludedDates: [],
      seriesId: series.id,
      originalDate: '2026-11-30',
    })
    expect(detached).toMatchObject({ id: 'caldav:c1:o1:2026-11-30', seriesId: series.id, title: 'Moved' })
    expect(objects.get('o1')!.data).toContain('RECURRENCE-ID;TZID=Europe/Berlin:20261130T100000')
    expect(objects.get('o1')!.data).not.toContain('EXDATE')
    await repository.remove(detached.id)
    expect(objects.get('o1')!.data).not.toContain('RECURRENCE-ID')
    expect(objects.get('o1')!.data).toContain('EXDATE;TZID=Europe/Berlin:20261130T100000')
  })

  it('loads the calendars when it does not know them yet', async () => {
    const { api, calls } = createApi()
    const repository = new CaldavEventRepository(api)
    expect(await repository.list(query)).toHaveLength(1)
    expect(calls.list).toHaveBeenCalledTimes(1)
  })

  it('creates and deletes whole objects', async () => {
    const { api, objects } = createApi()
    const repository = new CaldavEventRepository(api)
    repository.setCalendars([calendar])
    const [series] = await repository.list(query)
    const created = await repository.create('caldav:c1', {
      ...toEventInput(series),
      uid: '',
      title: 'Single',
      recurrence: null,
    })
    expect(created.title).toBe('Single')
    expect(objects.size).toBe(2)
    await repository.remove(created.id)
    expect(objects.size).toBe(1)
  })

  it('answers for the own address and forgets the cache after a conflict', async () => {
    const { api, objects, calls } = createApi()
    const repository = new CaldavEventRepository(api)
    repository.setCalendars([calendar])
    repository.setEmail('ME@example.com')
    const [series] = await repository.list(query)
    const answered = await repository.respond(series.id, 'accepted')
    expect(answered.attendees[0].status).toBe('accepted')
    objects.set('o1', { ...objects.get('o1')!, etag: '"99"' })
    calls.listObjects.mockClear()
    await expect(repository.update(series.id, { ...toEventInput(series), title: 'x' })).rejects.toMatchObject({
      code: 'eventChanged',
    })
    await repository.list(query)
    expect(calls.listObjects).toHaveBeenCalledTimes(1)
  })

  it('routes by calendar id', async () => {
    const { api } = createApi()
    const caldav = new CaldavEventRepository(api)
    caldav.setCalendars([calendar])
    const main = {
      list: vi.fn(async () => []),
      listSeries: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    } as unknown as EventRepository
    const routed = withCaldavEvents(main, caldav)
    const events = await routed.list({ ...query, calendarIds: ['own', 'caldav:c1'] })
    expect(main.list).toHaveBeenCalledWith({ ...query, calendarIds: ['own'] })
    expect(events).toHaveLength(1)
    await routed.list(query)
    expect(main.list).toHaveBeenCalledTimes(1)
    expect(routed.respond).toBeUndefined()
  })
})
