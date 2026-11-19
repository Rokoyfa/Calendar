import { encodePathSegment, type ApiClient } from '../../../utils/api.ts'
import { AppError } from '../../../utils/appError.ts'
import {
  parseCaldavAccount,
  parseCaldavAccounts,
  parseCaldavCalendar,
  parseCaldavObject,
  parseCaldavObjects,
  type CaldavAccountChanges,
  type CaldavAccountInput,
  type CaldavCalendarChanges,
} from '../../../utils/caldav.ts'
import type { CaldavRepository } from '../types/storage.ts'

const ACCOUNTS = '/caldav-accounts'
const CALENDARS = '/caldav-calendars'

const required = <T>(value: T | null) => {
  if (value === null) throw new AppError('unknown')
  return value
}

export class RemoteCaldavRepository implements CaldavRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  #account = (id: string) => `${ACCOUNTS}/${encodePathSegment(id)}`

  #objects = (calendarId: string) => `${CALENDARS}/${encodePathSegment(calendarId)}/objects`

  async list() {
    return parseCaldavAccounts(await this.#api.get<unknown>(ACCOUNTS))
  }

  async create(input: CaldavAccountInput) {
    return required(parseCaldavAccount(await this.#api.post<unknown>(ACCOUNTS, input)))
  }

  async update(id: string, changes: CaldavAccountChanges) {
    return required(parseCaldavAccount(await this.#api.patch<unknown>(this.#account(id), changes)))
  }

  remove(id: string) {
    return this.#api.delete(this.#account(id))
  }

  async sync(id: string) {
    return required(parseCaldavAccount(await this.#api.post<unknown>(`${this.#account(id)}/sync`)))
  }

  async updateCalendar(id: string, changes: CaldavCalendarChanges) {
    return required(
      parseCaldavCalendar(await this.#api.patch<unknown>(`${CALENDARS}/${encodePathSegment(id)}`, changes)),
    )
  }

  async listObjects(calendarId: string) {
    return parseCaldavObjects(await this.#api.get<unknown>(this.#objects(calendarId)))
  }

  async createObject(calendarId: string, data: string) {
    return required(parseCaldavObject(await this.#api.post<unknown>(this.#objects(calendarId), { data })))
  }

  async updateObject(calendarId: string, objectId: string, data: string, etag: string) {
    return required(
      parseCaldavObject(
        await this.#api.put<unknown>(
          `${this.#objects(calendarId)}/${encodePathSegment(objectId)}`,
          { data },
          { headers: { 'If-Match': etag } },
        ),
      ),
    )
  }

  removeObject(calendarId: string, objectId: string, etag: string) {
    return this.#api.delete(`${this.#objects(calendarId)}/${encodePathSegment(objectId)}`, {
      headers: { 'If-Match': etag },
    })
  }
}
