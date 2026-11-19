import {
  api,
  createTeamCalendar,
  createUser,
  eventInput,
  expect,
  openAs,
  openEvent,
  showCalendar,
  showView,
  test,
  today,
} from './helpers.ts'

test('lists the next 30 days in the agenda view', async ({ browser }) => {
  const user = await createUser('Ada')
  const calendars = (await api<{ id: string }[]>(user, 'GET', '/calendars')).data
  await api(user, 'POST', '/events', eventInput(calendars[0].id, { title: 'Agenda-Termin', uid: 'agenda@test' }))
  const page = await openAs(browser, user)
  await showView(page, 'Agenda')
  const agenda = page.locator('.agendaView')
  await expect(agenda.locator('.agendaItem', { hasText: 'Agenda-Termin' })).toBeVisible()
  await agenda.locator('.agendaItem', { hasText: 'Agenda-Termin' }).click()
  await expect(page.locator('dialog[open] input[name=title]')).toHaveValue('Agenda-Termin')
})

test('notifies an invited person and opens the event from the bell', async ({ browser }) => {
  const owner = await createUser('Olga')
  const guest = await createUser('Gus')
  const calendarId = await createTeamCalendar(owner, 'Planungsrunde', [guest])
  await api(
    owner,
    'POST',
    '/events',
    eventInput(calendarId, {
      title: 'Planung',
      uid: 'bell@test',
      attendees: [{ email: guest.email, name: guest.name, status: 'needsAction' }],
    }),
  )
  const page = await openAs(browser, guest)
  const bell = page.locator('.notificationButton')
  await expect(bell.locator('.notificationBadge')).toHaveText('1')
  await bell.click()
  const item = page.locator('.notificationItem', { hasText: 'Olga hat dich zu „Planung“ eingeladen' })
  await expect(item).toHaveClass(/isUnread/)
  await page.getByRole('button', { name: 'Alle als gelesen markieren' }).click()
  await expect(item).not.toHaveClass(/isUnread/)
  await expect(bell.locator('.notificationBadge')).toHaveCount(0)
  await item.locator('.notificationOpen').click()
  await expect(page.locator('dialog[open] input[name=title]')).toHaveValue('Planung')
})

test('shows the change history of a team event', async ({ browser }) => {
  const owner = await createUser('Hanna')
  const calendarId = await createTeamCalendar(owner, 'Projekt')
  const created = await api<Record<string, unknown> & { id: string; version: number }>(
    owner,
    'POST',
    '/events',
    eventInput(calendarId, { title: 'Sprint', uid: 'history@test', startDate: today(), endDate: today() }),
  )
  await api(owner, 'PUT', `/events/${created.data.id}`, { ...created.data, title: 'Sprint 2', location: 'Raum 4' })
  const page = await openAs(browser, owner)
  await showCalendar(page, 'Projekt')
  const dialog = await openEvent(page, 'Sprint 2')
  await dialog.getByRole('tab', { name: 'Verlauf' }).click()
  const entries = dialog.locator('.historyEntry')
  await expect(entries).toHaveCount(2)
  await expect(entries.first()).toContainText('Hanna hat den Termin geändert')
  await expect(entries.first()).toContainText('Sprint')
  await expect(entries.first()).toContainText('Sprint 2')
  await expect(entries.first()).toContainText('Raum 4')
  await expect(entries.last()).toContainText('Hanna hat den Termin angelegt')
})
