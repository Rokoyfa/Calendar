import { createHmac } from 'node:crypto'
import { test as base, expect, type Browser, type Page } from '@playwright/test'
import { API_URL } from './env.ts'

export const PASSWORD = 'Passwort123!'

export type TestUser = { name: string; email: string; cookie: string }

type Mail = { to: string; link: string; subject: string }

export const api = async <T = unknown>(user: TestUser | null, method: string, path: string, body?: unknown) => {
  const response = await fetch(API_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(user ? { Cookie: user.cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  return { status: response.status, data: (text ? JSON.parse(text) : null) as T }
}

const uniqueEmail = (name: string) =>
  `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`

export const createUser = async (name: string): Promise<TestUser> => {
  const email = uniqueEmail(name)
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: PASSWORD }),
  })
  expect(response.status).toBe(201)
  const cookie = response.headers.get('set-cookie')!.split(';')[0]
  const user = { name, email, cookie }
  const mails = (await api<Mail[]>(null, 'GET', '/dev/mails')).data
  const token = mails.find((mail) => mail.to === email && mail.link.includes('token='))!.link.match(/token=([^&]+)/)![1]
  await api(null, 'POST', '/auth/verify-email', { token })
  await api(user, 'PATCH', '/preferences', { locale: 'de-DE' })
  return user
}

const openPages = new Set<Page>()

export const openAs = async (browser: Browser, user: TestUser) => {
  const context = await browser.newContext({ acceptDownloads: true })
  const [name, value] = user.cookie.split('=')
  await context.addCookies([{ name, value, domain: 'localhost', path: '/' }])
  const page = await context.newPage()
  openPages.add(page)
  await page.goto('/')
  await expect(page.locator('.headerTitle')).toBeVisible()
  return page
}

const leave = async (page: Page) => {
  if (!page.isClosed()) await page.goto('about:blank').catch(() => undefined)
}

export const test = base.extend({
  page: async ({ page }, provide) => {
    await provide(page)
    await leave(page)
  },
})

test.afterEach(async () => {
  for (const page of openPages) {
    await leave(page)
    await page.context().close()
  }
  openPages.clear()
})

export { expect }

export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' })

export const eventInput = (calendarId: string, values: Record<string, unknown> = {}) => ({
  calendarId,
  title: 'Termin',
  description: '',
  location: '',
  links: [],
  timeZone: 'Europe/Berlin',
  startDate: today(),
  endDate: today(),
  start: '10:00',
  end: '11:00',
  allDay: false,
  color: 'blue',
  recurrence: null,
  excludedDates: [],
  seriesId: null,
  originalDate: null,
  attendees: [],
  reminders: [],
  ...values,
})

export const createTeamCalendar = async (owner: TestUser, name: string, members: TestUser[] = []) => {
  const { data } = await api<{ id: string }>(owner, 'POST', '/calendars', {
    name,
    invitations: members.map((member) => ({ email: member.email, role: 'editor' })),
  })
  for (const member of members) {
    const invitations = (await api<{ id: string }[]>(member, 'GET', '/invitations')).data
    for (const invitation of invitations) await api(member, 'POST', `/invitations/${invitation.id}/accept`)
  }
  return data.id
}

export const showCalendar = async (page: Page, name: string) => {
  await page.locator('.accountButton').click()
  await page.getByRole('button', { name: 'Kalender wechseln', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  const card = dialog.locator('.calendarCardName').getByText(name, { exact: true })
  for (const tab of await dialog.getByRole('tab').all()) {
    if (await card.isVisible()) break
    await tab.click()
  }
  await card.click()
  await expect(dialog).toHaveCount(0)
}

export const showView = async (page: Page, view: 'Tag' | 'Woche' | 'Monat' | 'Jahr' | 'Agenda' | 'Aufgaben') => {
  await page.locator('.segment', { hasText: view }).click()
}

export const openEvent = async (page: Page, title: string) => {
  await page.locator(`.eventOpen[aria-label^="${title},"]`).first().click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  return dialog
}

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const totp = (secret: string, time = Date.now()) => {
  const bits = [...secret.replace(/\s/g, '')].map((char) => BASE32.indexOf(char).toString(2).padStart(5, '0')).join('')
  const key = Buffer.from(bits.match(/.{8}/g)!.map((byte) => parseInt(byte, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30_000)))
  const digest = createHmac('sha1', key).update(counter).digest()
  const offset = digest[digest.length - 1] & 0x0f
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0')
}
