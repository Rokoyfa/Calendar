import {
  api,
  createTeamCalendar,
  createUser,
  eventInput,
  openAs,
  openEvent,
  showCalendar,
  showView,
  expect,
  test,
} from './helpers.ts'

test('shows changes of other members at once', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  const calendarId = await createTeamCalendar(anna, 'Verein', [ben])
  const page = await openAs(browser, ben)
  await showCalendar(page, 'Verein')
  await showView(page, 'Woche')

  const { data: event } = await api<{ id: string }>(
    anna,
    'POST',
    '/events',
    eventInput(calendarId, { title: 'Training' }),
  )
  await expect(page.locator('.eventOpen[aria-label^="Training,"]')).toHaveCount(1)

  const dialog = await openEvent(page, 'Training')
  await api(anna, 'PUT', `/events/${event.id}`, eventInput(calendarId, { title: 'Training (verlegt)' }))
  await expect(dialog.locator('.eventConflict[role=status]')).toBeVisible()
  await dialog.getByRole('button', { name: 'Neu laden' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Training (verlegt),"]')).toHaveCount(1)
})

test('protects against overwriting a change made in the meantime', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  const calendarId = await createTeamCalendar(anna, 'Verein', [ben])
  const { data: event } = await api<{ id: string }>(
    anna,
    'POST',
    '/events',
    eventInput(calendarId, { title: 'Sitzung' }),
  )
  const page = await openAs(browser, ben)
  await showCalendar(page, 'Verein')
  await showView(page, 'Woche')
  const dialog = await openEvent(page, 'Sitzung')

  const anna2 = { ...anna }
  await api(anna2, 'PUT', `/events/${event.id}`, eventInput(calendarId, { title: 'Sitzung (Anna)' }))
  await dialog.locator('input[name=title]').fill('Sitzung (Ben)')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog.locator('.eventConflict[role=alert]')).toBeVisible()
  await dialog.getByRole('button', { name: 'Trotzdem speichern' }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  const { data } = await api<{ title: string; version: number }[]>(
    anna,
    'GET',
    `/events?from=2000-01-01&to=2099-01-01&calendarId=${calendarId}`,
  )
  expect(data.map((entry) => entry.title)).toEqual(['Sitzung (Ben)'])
})
