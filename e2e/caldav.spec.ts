import { API_URL } from './env.ts'
import { api, createUser, eventInput, expect, openAs, openEvent, test, type TestUser } from './helpers.ts'

const propfind = (user: TestUser, password: string) =>
  fetch(`${API_URL}/dav/`, {
    method: 'PROPFIND',
    headers: {
      Authorization: `Basic ${Buffer.from(`${user.email}:${password}`).toString('base64')}`,
      Depth: '0',
    },
  })

test('creates and revokes an app password for CalDAV programs', async ({ browser }) => {
  const user = await createUser('Clara')
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=connections')
  const section = page.locator('section', { hasText: 'In anderen Programmen nutzen (CalDAV)' })
  await expect(section.locator('.copyValueText').first()).toHaveText(`${API_URL}/dav/`)
  await expect(section.locator('.copyValueText').nth(1)).toHaveText(user.email)
  await section.getByLabel('Programm oder Gerät').fill('Thunderbird')
  await section.getByRole('button', { name: 'App-Passwort anlegen' }).click()
  const created = section.locator('.newAppPassword')
  await expect(created).toContainText('Dein neues App-Passwort')
  const password = (await created.locator('.copyValueText').textContent())!.trim()
  expect(password).toMatch(/^[a-z0-9]{6}(-[a-z0-9]{6}){3}$/)
  expect((await propfind(user, password)).status).toBe(207)
  expect((await propfind(user, 'Passwort123!')).status).toBe(401)
  await section.getByRole('button', { name: 'Fertig' }).click()
  await expect(created).toHaveCount(0)
  await page.reload()
  await expect(section.locator('.sessionItem', { hasText: 'Thunderbird' })).toContainText('Zuletzt benutzt')
  await section.locator('.sessionItem', { hasText: 'Thunderbird' }).getByRole('button', { name: 'Widerrufen' }).click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Widerrufen' }).click()
  await expect(section.locator('.sessionItem')).toHaveCount(0)
  expect((await propfind(user, password)).status).toBe(401)
})

test('shows and edits the events of a connected CalDAV account', async ({ browser }) => {
  const owner = await createUser('Olivia')
  const guest = await createUser('Gregor')
  const calendars = (await api<{ id: string }[]>(owner, 'GET', '/calendars')).data
  await api(owner, 'POST', '/events', eventInput(calendars[0].id, { title: 'Fremdtermin', uid: 'caldav-e2e@test' }))
  const appPassword = (await api<{ password: string }>(owner, 'POST', '/auth/app-passwords', { name: 'E2E' })).data
  const connected = await api<{ calendars: { name: string }[] }>(guest, 'POST', '/caldav-accounts', {
    name: 'Olivias Kalender',
    serverUrl: `${API_URL.replace('/api', '')}/`,
    username: owner.email,
    password: appPassword.password,
  })
  expect(connected.status).toBe(201)

  const page = await openAs(browser, guest)
  const dialog = await openEvent(page, 'Fremdtermin')
  await expect(dialog).toContainText('Aus dem CalDAV-Kalender „Persönlich“. Änderungen werden dort gespeichert.')
  await dialog.locator('input[name=title]').fill('Fremdtermin geändert')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Fremdtermin geändert,"]').first()).toBeVisible()
  const ownEvents = await api<{ title: string }[]>(
    owner,
    'GET',
    `/events?from=2000-01-01&to=2100-01-01&calendarId=${calendars[0].id}`,
  )
  expect(ownEvents.data.map((event) => event.title)).toEqual(['Fremdtermin geändert'])

  await page.goto('/settings?tab=connections')
  const section = page.locator('section', { hasText: 'CalDAV-Konten' })
  const card = section.locator('.calendarSettingCard', { hasText: 'Olivias Kalender' })
  await expect(card).toContainText(owner.email)
  const row = card.locator('.caldavCalendar', { hasText: 'Persönlich' })
  await row.getByText('Im Kalender anzeigen').click()
  await expect(row.getByRole('switch')).not.toBeChecked()
  await page.goto('/')
  await expect(page.locator('.headerTitle')).toBeVisible()
  await expect(page.locator('.eventOpen[aria-label^="Fremdtermin geändert,"]')).toHaveCount(0)
})

test('refuses server addresses without https in the form', async ({ browser }) => {
  const user = await createUser('Hugo')
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=connections')
  const section = page.locator('section', { hasText: 'CalDAV-Konten' })
  await section.getByLabel('Serveradresse').fill('http://cloud.example.com/')
  await section.getByLabel('Benutzername').fill('hugo')
  await section.locator('input[name=caldavPassword]').fill('geheim')
  await section.getByRole('button', { name: 'Verbinden' }).click()
  await expect(section).toContainText('Bitte gib eine https://-Adresse ein.')
})

test('shows a task added in a reminders app and sends changes back', async ({ browser }) => {
  const user = await createUser('Rita')
  const { data: created } = await api<{ password: string }>(user, 'POST', '/auth/app-passwords', { name: 'iPhone' })
  const calendars = (await api<{ id: string }[]>(user, 'GET', '/calendars')).data
  const userId = (await api<{ user?: { id: string }; id?: string }>(user, 'GET', '/auth/me')).data
  const ownerId = userId.user?.id ?? userId.id
  const resource = `${API_URL}/dav/calendars/${ownerId}/${calendars[0].id}/reminder-1.ics`
  const authorization = `Basic ${Buffer.from(`${user.email}:${created.password}`).toString('base64')}`
  const put = await fetch(resource, {
    method: 'PUT',
    headers: { Authorization: authorization, 'Content-Type': 'text/calendar; charset=utf-8', 'If-None-Match': '*' },
    body: [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Test//Reminders//EN',
      'BEGIN:VTODO',
      'UID:reminder-1@test',
      'DTSTAMP:20261126T100000Z',
      'SUMMARY:Blumen gießen',
      'PRIORITY:1',
      'STATUS:NEEDS-ACTION',
      'END:VTODO',
      'END:VCALENDAR',
      '',
    ].join('\r\n'),
  })
  expect(put.status).toBe(201)

  const page = await openAs(browser, user)
  await page.locator('.segment', { hasText: 'Aufgaben' }).click()
  const row = page.locator('.taskRow', { hasText: 'Blumen gießen' })
  await expect(row).toBeVisible()
  await row.getByRole('checkbox', { name: 'Erledigt: Blumen gießen' }).click()
  await expect
    .poll(async () => {
      const response = await fetch(resource, { headers: { Authorization: authorization } })
      return (await response.text()).includes('STATUS:COMPLETED')
    })
    .toBe(true)
})
