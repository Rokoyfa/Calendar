import type { Locator } from '@playwright/test'
import { API_URL } from './env.ts'
import {
  api,
  createTeamCalendar,
  createUser,
  eventInput,
  expect,
  openAs,
  openEvent,
  showView,
  test,
  today,
  type TestUser,
} from './helpers.ts'

type ListedEvent = { id: string; title: string; calendarId: string; recurrence: { rule: string | null } | null }

const eventsOf = async (user: TestUser, calendarId: string) =>
  (await api<ListedEvent[]>(user, 'GET', `/events?from=2000-01-01&to=2100-01-01&calendarId=${calendarId}`)).data

const chooseCalendar = async (dialog: Locator, name: string) => {
  const field = dialog.locator('select[name=calendarId]')
  const label = (await field.locator('option', { hasText: name }).first().textContent())!.trim()
  await field.selectOption({ label })
}

test('creates an event in another calendar chosen in the dialog', async ({ browser }) => {
  const user = await createUser('Paula')
  const teamId = await createTeamCalendar(user, 'Projekt')
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Planung')
  await chooseCalendar(dialog, 'Projekt')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog).toHaveCount(0)
  await expect.poll(async () => (await eventsOf(user, teamId)).map((event) => event.title)).toEqual(['Planung'])
  expect((await eventsOf(user, 'personal')).map((event) => event.title)).toEqual([])
})

test('moves an event to another calendar and back with undo', async ({ browser }) => {
  const user = await createUser('Moritz')
  const teamId = await createTeamCalendar(user, 'Verein')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Sitzung' }))
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  const dialog = await openEvent(page, 'Sitzung')
  await chooseCalendar(dialog, 'Verein')
  await dialog.locator('input[name=title]').fill('Sitzung (Verein)')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog).toHaveCount(0)
  await expect
    .poll(async () => (await eventsOf(user, teamId)).map((event) => event.title))
    .toEqual(['Sitzung (Verein)'])
  expect(await eventsOf(user, 'personal')).toEqual([])

  await page.locator('.undoNoticeAction').click()
  await expect
    .poll(async () => (await eventsOf(user, 'personal')).map((event) => event.title))
    .toEqual(['Sitzung (Verein)'])
  expect(await eventsOf(user, teamId)).toEqual([])
})

test('keeps a custom repetition from another program when the title changes', async ({ browser }) => {
  const user = await createUser('Rita')
  const { id } = (await api<{ id: string }>(user, 'GET', '/auth/me')).data
  const { password } = (await api<{ password: string }>(user, 'POST', '/auth/app-passwords', { name: 'E2E' })).data
  const [personal] = (await api<{ id: string }[]>(user, 'GET', '/calendars')).data
  const start = today().replaceAll('-', '')
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//E2E//EN',
    'BEGIN:VEVENT',
    'UID:custom-rule-e2e@test',
    'DTSTAMP:20260101T000000Z',
    `DTSTART;TZID=Europe/Berlin:${start}T090000`,
    `DTEND;TZID=Europe/Berlin:${start}T100000`,
    'SUMMARY:Monatsabschluss',
    'RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=6',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
  const put = await fetch(`${API_URL}/dav/calendars/${id}/${personal.id}/custom-rule-e2e.ics`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${Buffer.from(`${user.email}:${password}`).toString('base64')}`,
      'Content-Type': 'text/calendar',
      'If-None-Match': '*',
    },
    body,
  })
  expect(put.status).toBe(201)
  const [created] = await eventsOf(user, 'personal')
  expect(created.recurrence?.rule).toBe('FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1')

  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  const dialog = await openEvent(page, 'Monatsabschluss')
  await dialog.getByRole('tab', { name: 'Wiederholung' }).click()
  await expect(dialog).toContainText('Eigene Regel')
  await dialog.getByRole('tab', { name: 'Allgemein' }).click()
  await dialog.locator('input[name=title]').fill('Monatsabschluss (Team)')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Alle Termine' }).click()
  await expect
    .poll(async () => (await eventsOf(user, 'personal')).map((event) => [event.title, event.recurrence?.rule]))
    .toEqual([['Monatsabschluss (Team)', 'FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1']])
})
