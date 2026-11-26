import { api, createUser, expect, openAs, showCalendar, showView, test, today, type TestUser } from './helpers.ts'

type ListedTask = {
  id: string
  title: string
  dueDate: string | null
  estimateMinutes: number | null
  status: string
  priority: string
  notes: string
  categoryIds: string[]
  checklist: { id: string; title: string; done: boolean }[]
  version: number
  completedAt: string | null
  assignee: { id: string; name: string } | null
}

const tasksOf = async (user: TestUser, calendarId: string) =>
  (await api<ListedTask[]>(user, 'GET', `/tasks?calendarId=${calendarId}`)).data

const personalCalendarId = async (user: TestUser) => (await api<{ id: string }[]>(user, 'GET', '/calendars')).data[0].id

test('creates a task with all fields in the dialog and moves it on the board', async ({ browser }) => {
  const user = await createUser('Tina')
  const calendarId = await personalCalendarId(user)
  await api(user, 'POST', `/calendars/${calendarId}/categories`, { name: 'Finanzen' })
  const page = await openAs(browser, user)
  await showView(page, 'Aufgaben')
  await expect(page.locator('.headerTitle')).toHaveText('Aufgaben')
  await expect(page.getByRole('button', { name: 'Heute', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Neuer Termin', exact: true })).toHaveCount(0)
  await expect(page.getByText('Noch keine Aufgaben. Erstell die erste.')).toBeVisible()

  await page.getByRole('button', { name: 'Erstellen' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog.locator('.modalTitle')).toHaveText('Neue Aufgabe')
  await dialog.locator('input[name=title]').fill('Steuererklärung')
  await dialog.getByLabel('Status').selectOption({ label: 'In Bearbeitung' })
  await dialog.getByLabel('Priorität').selectOption({ label: 'Hoch' })
  await dialog.locator('input[name=dueDate]').fill(today())
  await dialog.locator('input[name=dueTime]').fill('16:30')
  await dialog.getByLabel('Minuten', { exact: true }).fill('75')
  await dialog.getByRole('tab', { name: 'Checkliste' }).click()
  await dialog.getByLabel('Punkt hinzufügen').fill('Belege sammeln')
  await dialog.getByLabel('Punkt hinzufügen').press('Enter')
  await dialog.getByLabel('Punkt hinzufügen').fill('Formular ausfüllen')
  await dialog.getByRole('button', { name: 'Punkt hinzufügen' }).click()
  await dialog.getByRole('checkbox', { name: 'Erledigt: Belege sammeln' }).check()
  await expect(dialog.getByRole('tab', { name: 'Checkliste (2)' })).toBeVisible()
  await dialog.getByRole('tab', { name: 'Details' }).click()
  await dialog.locator('textarea[name=notes]').fill('Alles für das Finanzamt')
  await dialog.getByText('Finanzen').click()
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog.getByRole('tab', { name: 'Allgemein' })).toHaveAttribute('aria-selected', 'true')
  await expect(dialog.getByText('Bitte ganze Stunden von 0 bis 99 und Minuten von 0 bis 59 eingeben.')).toBeVisible()
  await dialog.getByLabel('Stunden', { exact: true }).fill('1')
  await dialog.getByLabel('Minuten', { exact: true }).fill('30')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog).toHaveCount(0)

  const group = page.locator('.taskGroup--inProgress')
  await expect(group.locator('.taskGroupTitle')).toContainText('In Bearbeitung')
  await expect(group.locator('.taskGroupEffort')).toContainText('1 Std., 30 Min.')
  const row = group.locator('.taskRow', { hasText: 'Steuererklärung' })
  for (const badge of ['Hoch', 'Aufwand 1 Std., 30 Min.', '1 von 2 erledigt', 'Finanzen'])
    await expect(row.locator('.taskBadge', { hasText: badge })).toBeVisible()
  const [created] = await tasksOf(user, calendarId)
  expect(created).toMatchObject({
    status: 'inProgress',
    priority: 'high',
    estimateMinutes: 90,
    notes: 'Alles für das Finanzamt',
    checklist: [
      { title: 'Belege sammeln', done: true },
      { title: 'Formular ausfüllen', done: false },
    ],
  })
  expect(created.categoryIds).toHaveLength(1)

  await page.getByRole('button', { name: 'Board', exact: true }).click()
  const card = page.locator('.taskColumn--inProgress .taskCard', { hasText: 'Steuererklärung' })
  await expect(card).toBeVisible()
  await expect(page.locator('.taskColumn--open')).toContainText('Keine Aufgaben')
  await card.dragTo(page.locator('.taskColumn--waiting'))
  await expect(page.locator('.taskColumn--waiting .taskCard', { hasText: 'Steuererklärung' })).toBeVisible()
  await expect.poll(async () => (await tasksOf(user, calendarId))[0]?.status).toBe('waiting')

  await page.reload()
  await showView(page, 'Aufgaben')
  await expect(page.locator('.taskColumn--waiting .taskCard', { hasText: 'Steuererklärung' })).toBeVisible()

  await showView(page, 'Woche')
  const chip = page.locator(`.day[data-date="${today()}"] .taskChip`, { hasText: 'Steuererklärung' })
  await expect(chip).toContainText('16:30')
  await chip.getByRole('checkbox').click()
  await expect(chip.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  await expect.poll(async () => (await tasksOf(user, calendarId))[0]?.completedAt).not.toBeNull()

  await showView(page, 'Aufgaben')
  await expect(page.locator('.taskColumn--done .taskCard', { hasText: 'Steuererklärung' })).toBeVisible()
  await page.getByRole('button', { name: 'Liste', exact: true }).click()
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

test('assigns a team task to a viewer who is notified and may only move it forward', async ({ browser }) => {
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
  await page.getByRole('button', { name: 'Erstellen' }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Müll rausbringen')
  await dialog.getByRole('tab', { name: 'Checkliste' }).click()
  await dialog.getByLabel('Punkt hinzufügen').fill('Gelber Sack')
  await dialog.getByLabel('Punkt hinzufügen').press('Enter')
  await dialog.getByRole('tab', { name: 'Allgemein' }).click()
  await dialog.locator('input[name=dueDate]').fill(today())
  await dialog.getByRole('tab', { name: 'Details' }).click()
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
  await expect(view.getByLabel('Priorität')).toBeDisabled()
  await expect(view.getByRole('button', { name: 'Löschen' })).toHaveCount(0)
  await expect(view.getByRole('button', { name: 'Speichern' })).toHaveCount(0)
  await view.getByRole('tab', { name: 'Checkliste (1)' }).click()
  await view.getByRole('checkbox', { name: 'Erledigt: Gelber Sack' }).check()
  await expect(view.getByText('1 von 1 erledigt')).toBeVisible()
  await view.getByRole('tab', { name: 'Allgemein' }).click()
  await view.getByLabel('Status').selectOption({ label: 'Erledigt' })
  await expect(view.getByText('Erledigt von Moritz am')).toBeVisible()
  await view.locator('.modalActions').getByRole('button', { name: 'Schließen' }).click()
  await expect(view).toHaveCount(0)
  const [done] = await tasksOf(owner, team.id)
  expect(done).toMatchObject({ status: 'done', checklist: [{ title: 'Gelber Sack', done: true }] })
  expect(done.completedAt).not.toBeNull()

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

test('repeats a task weekly and creates the next one when it is done', async ({ browser }) => {
  const user = await createUser('Rena')
  const calendarId = await personalCalendarId(user)
  const page = await openAs(browser, user)
  await showView(page, 'Aufgaben')
  await page.getByRole('button', { name: 'Erstellen' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog.getByText('Gib eine Fälligkeit an, um die Aufgabe zu wiederholen.')).toBeVisible()
  await dialog.locator('input[name=title]').fill('Wochenbericht')
  await dialog.locator('input[name=dueDate]').fill('2099-01-05')
  await dialog.getByLabel('Wiederholen').selectOption({ label: 'Wöchentlich' })
  await expect(
    dialog.getByText('Erledigst du die Aufgabe, wird die nächste mit der nächsten Fälligkeit angelegt.'),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('.taskRow', { hasText: 'Wochenbericht' }).locator('.taskRecurrence')).toBeVisible()

  await page.locator('.taskRow', { hasText: 'Wochenbericht' }).getByRole('checkbox').click()
  await expect
    .poll(async () => (await tasksOf(user, calendarId)).map(({ dueDate, status }) => `${dueDate} ${status}`).sort())
    .toEqual(['2099-01-05 done', '2099-01-12 open'])
  await expect(page.locator('.taskRow:not(.isDone)', { hasText: 'Wochenbericht' })).toContainText('12.01.2099')
})
