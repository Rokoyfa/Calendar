import { api, createUser, expect, openAs, showCalendar, showView, test, today, type TestUser } from './helpers.ts'

type ListedTask = {
  id: string
  title: string
  dueDate: string | null
  estimateMinutes: number | null
  version: number
  completedAt: string | null
  assignee: { id: string; name: string } | null
}

const tasksOf = async (user: TestUser, calendarId: string) =>
  (await api<ListedTask[]>(user, 'GET', `/tasks?calendarId=${calendarId}`)).data

const personalCalendarId = async (user: TestUser) => (await api<{ id: string }[]>(user, 'GET', '/calendars')).data[0].id

test('adds a task in the list, gives it a due date and checks it off in the week', async ({ browser }) => {
  const user = await createUser('Tina')
  const calendarId = await personalCalendarId(user)
  const page = await openAs(browser, user)
  await showView(page, 'Aufgaben')
  await expect(page.locator('.headerTitle')).toHaveText('Aufgaben')
  await expect(page.getByRole('button', { name: 'Heute', exact: true })).toHaveCount(0)
  await expect(page.getByText('Keine offenen Aufgaben.')).toBeVisible()

  await page.getByLabel('Aufgabe hinzufügen').fill('Steuererklärung')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  const row = page.locator('.taskRow', { hasText: 'Steuererklärung' })
  await expect(row).toBeVisible()
  await expect(page.locator('.taskGroup--someday')).toContainText('Steuererklärung')

  await row.locator('.taskRowOpen').click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog.locator('.modalTitle')).toHaveText('Aufgabe bearbeiten')
  await dialog.locator('input[name=dueDate]').fill(today())
  await dialog.locator('input[name=dueTime]').fill('16:30')
  await dialog.getByLabel('Minuten').fill('75')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog.getByText('Bitte ganze Stunden von 0 bis 99 und Minuten von 0 bis 59 eingeben.')).toBeVisible()
  await dialog.getByLabel('Stunden').fill('1')
  await dialog.getByLabel('Minuten').fill('30')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog).toHaveCount(0)
  const todayGroup = page.locator('.taskGroup--today')
  await expect(todayGroup).toContainText('Steuererklärung')
  await expect(todayGroup.locator('.taskRow')).toContainText('Aufwand 1 Std., 30 Min.')
  await expect(todayGroup.locator('.taskGroupEffort')).toContainText('1 Std., 30 Min.')
  expect((await tasksOf(user, calendarId))[0].estimateMinutes).toBe(90)

  await showView(page, 'Woche')
  const chip = page.locator(`.day[data-date="${today()}"] .taskChip`, { hasText: 'Steuererklärung' })
  await expect(chip).toContainText('16:30')
  await chip.getByRole('checkbox').click()
  await expect(chip.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  await expect.poll(async () => (await tasksOf(user, calendarId))[0]?.completedAt).not.toBeNull()

  await showView(page, 'Aufgaben')
  await expect(page.getByText('Keine offenen Aufgaben.')).toBeVisible()
  await page.getByRole('button', { name: 'Erledigte anzeigen (1)' }).click()
  await expect(page.locator('.taskGroup--done')).toContainText('Steuererklärung')
})

test('switches a new event into a task and deletes it again', async ({ browser }) => {
  const user = await createUser('Theo')
  const calendarId = await personalCalendarId(user)
  const page = await openAs(browser, user)
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Geschenk kaufen')
  await dialog.getByRole('button', { name: 'Aufgabe', exact: true }).click()
  await expect(dialog.locator('.modalTitle')).toHaveText('Neue Aufgabe')
  await expect(dialog.locator('input[name=title]')).toHaveValue('Geschenk kaufen')
  await expect(dialog.locator('input[name=dueDate]')).toHaveValue(today())
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator(`.day[data-date="${today()}"] .taskChip`, { hasText: 'Geschenk kaufen' })).toBeVisible()
  expect((await tasksOf(user, calendarId)).map(({ title }) => title)).toEqual(['Geschenk kaufen'])

  await showView(page, 'Monat')
  await page.locator('.monthCell .taskChipTitle', { hasText: 'Geschenk kaufen' }).click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Löschen' }).click()
  const confirm = page.locator('dialog[open]', { hasText: 'Aufgabe löschen?' })
  await confirm.getByRole('button', { name: 'Löschen' }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expect(page.locator('.taskChip')).toHaveCount(0)
  expect(await tasksOf(user, calendarId)).toEqual([])
})

test('assigns a team task to a viewer who is notified and may only check it off', async ({ browser }) => {
  const owner = await createUser('Olivia')
  const member = await createUser('Moritz')
  const { data: team } = await api<{ id: string }>(owner, 'POST', '/calendars', {
    name: 'Haushalt',
    invitations: [{ email: member.email, role: 'viewer' }],
  })
  const invitations = (await api<{ id: string }[]>(member, 'GET', '/invitations')).data
  for (const invitation of invitations) await api(member, 'POST', `/invitations/${invitation.id}/accept`)

  const page = await openAs(browser, owner)
  await showCalendar(page, 'Haushalt')
  await showView(page, 'Aufgaben')
  await page.getByRole('button', { name: 'Neue Aufgabe' }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Müll rausbringen')
  await dialog.locator('input[name=dueDate]').fill(today())
  await dialog.getByLabel('Zuständig').selectOption({ label: 'Moritz' })
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('.taskRow', { hasText: 'Müll rausbringen' })).toContainText('Zuständig: Moritz')
  const [created] = await tasksOf(owner, team.id)
  expect(created.assignee?.name).toBe('Moritz')

  const assigned = await openAs(browser, member)
  await assigned.locator('.notificationButton').click()
  await assigned
    .locator('.notificationItem', { hasText: 'Olivia hat dir die Aufgabe „Müll rausbringen“ zugewiesen' })
    .locator('.notificationOpen')
    .click()
  const view = assigned.locator('dialog[open]')
  await expect(view.locator('.modalTitle')).toHaveText('Aufgabe')
  await expect(view.locator('input[name=title]')).toBeDisabled()
  await expect(view.getByRole('button', { name: 'Löschen' })).toHaveCount(0)
  await view.getByRole('button', { name: 'Als erledigt markieren' }).click()
  await expect(view).toHaveCount(0)
  await expect.poll(async () => (await tasksOf(owner, team.id))[0]?.completedAt).not.toBeNull()

  const { status } = await api(member, 'PUT', `/tasks/${created.id}`, {
    title: 'Übernommen',
    notes: '',
    dueDate: null,
    dueTime: null,
    assigneeId: null,
  })
  expect(status).toBe(403)
})

test('hides tasks when the backend does not offer them', async ({ browser }) => {
  const user = await createUser('Udo')
  const page = await openAs(browser, user)
  await expect(page.locator('.segment', { hasText: 'Aufgaben' })).toBeVisible()
  await page.route(/\/api\/tasks(\?|$)/, (route) =>
    route.fulfill({ status: 404, contentType: 'application/problem+json', body: '{"status":404}' }),
  )
  await page.reload()
  await expect(page.locator('.headerTitle')).toBeVisible()
  await expect(page.locator('.segment', { hasText: 'Aufgaben' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  await expect(page.locator('dialog[open]').getByRole('button', { name: 'Aufgabe', exact: true })).toHaveCount(0)
})
