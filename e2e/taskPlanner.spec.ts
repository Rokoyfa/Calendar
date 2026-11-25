import { api, createUser, expect, openAs, showView, test, today, type TestUser } from './helpers.ts'

type ListedEvent = {
  id: string
  title: string
  startDate: string
  start: string
  end: string
  visibility: string
  builtinCategories: string[]
  taskId: string | null
}

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const personalCalendarId = async (user: TestUser) => (await api<{ id: string }[]>(user, 'GET', '/calendars')).data[0].id

const blocksOf = async (user: TestUser, calendarId: string, taskId: string) =>
  (
    await api<ListedEvent[]>(
      user,
      'GET',
      `/events?from=${addDays(today(), -1)}&to=${addDays(today(), 400)}&calendarId=${calendarId}`,
    )
  ).data.filter((event) => event.taskId === taskId)

const totalMinutes = (events: readonly ListedEvent[]) =>
  events.reduce((sum, event) => sum + minutesOf(event.end) - minutesOf(event.start), 0)

const createTask = async (user: TestUser, calendarId: string, values: Record<string, unknown>) =>
  (await api<{ id: string; version: number }>(user, 'POST', '/tasks', { calendarId, ...values })).data

test('plans a task into free time and replaces future blocks when planning again', async ({ browser }) => {
  const user = await createUser('Pia')
  const calendarId = await personalCalendarId(user)
  const task = await createTask(user, calendarId, {
    title: 'Präsentation',
    estimateMinutes: 240,
    dueDate: addDays(today(), 14),
    dueTime: '12:00',
  })
  const page = await openAs(browser, user)
  await showView(page, 'Aufgaben')
  await page.locator('.taskRow', { hasText: 'Präsentation' }).locator('.taskTitle').click()
  const taskDialog = page.locator('dialog[open]')
  await taskDialog.getByRole('button', { name: 'Einplanen' }).click()

  const planDialog = page.locator('dialog[open]', { hasText: 'Aufgabe einplanen' })
  await expect(planDialog.getByText('Geplante Blöcke')).toBeVisible()
  await expect(planDialog.getByText('Arbeitszeitregeln: Deutschland')).toBeVisible()
  await expect(planDialog.getByRole('button', { name: 'Gleichmäßig bis zur Fälligkeit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await planDialog.getByRole('button', { name: 'Anlegen' }).click()
  await expect(planDialog).toHaveCount(0)

  const blocks = await blocksOf(user, calendarId, task.id)
  expect(totalMinutes(blocks)).toBe(240)
  expect(new Set(blocks.map((block) => block.startDate)).size).toBeGreaterThan(1)
  for (const block of blocks) {
    expect(block).toMatchObject({ title: 'Präsentation', visibility: 'private', builtinCategories: ['work'] })
    expect(minutesOf(block.end) - minutesOf(block.start)).toBeGreaterThanOrEqual(30)
    expect(minutesOf(block.start)).toBeGreaterThanOrEqual(8 * 60)
    expect(minutesOf(block.end)).toBeLessThanOrEqual(20 * 60)
  }

  await expect(taskDialog.getByRole('button', { name: 'Einplanen' })).toHaveCount(0)
  await taskDialog
    .getByRole('button', { name: 'Schließen' })
    .or(taskDialog.getByRole('button', { name: 'Abbrechen' }))
    .first()
    .click()
  await page.locator('.taskRow', { hasText: 'Präsentation' }).locator('.taskTitle').click()
  await taskDialog.getByRole('button', { name: 'Neu planen' }).click()
  await expect(planDialog.getByText(/Ersetzt \d+ künftigen? Blöcke?\./)).toBeVisible()
  await planDialog.getByRole('button', { name: 'So früh wie möglich' }).click()
  await planDialog.getByRole('button', { name: 'Anlegen' }).click()
  await expect(planDialog).toHaveCount(0)
  const replanned = await blocksOf(user, calendarId, task.id)
  expect(totalMinutes(replanned)).toBe(240)
  expect(replanned.some((block) => blocks.some((old) => old.id === block.id))).toBe(false)

  await api(user, 'POST', `/tasks/${task.id}/status`, { status: 'done' })
  expect(await blocksOf(user, calendarId, task.id)).toHaveLength(0)
})

test('offers a later due date when the effort does not fit', async ({ browser }) => {
  const user = await createUser('Ole')
  const calendarId = await personalCalendarId(user)
  const task = await createTask(user, calendarId, {
    title: 'Abschlussbericht',
    estimateMinutes: 25 * 60,
    dueDate: addDays(today(), 1),
    builtinCategories: ['learning'],
  })
  const page = await openAs(browser, user)
  await showView(page, 'Aufgaben')
  await page.locator('.taskRow', { hasText: 'Abschlussbericht' }).locator('.taskTitle').click()
  const taskDialog = page.locator('dialog[open]')
  await taskDialog.getByRole('button', { name: 'Einplanen' }).click()
  const planDialog = page.locator('dialog[open]', { hasText: 'Aufgabe einplanen' })
  await expect(planDialog.locator('.taskPlanMissing')).toBeVisible()
  await expect(planDialog.getByRole('button', { name: 'Anlegen', exact: true })).toHaveCount(0)
  await planDialog.getByRole('button', { name: /^Fälligkeit auf .* verschieben$/ }).click()
  await expect(planDialog.locator('.taskPlanMissing')).toHaveCount(0)
  await planDialog.getByRole('button', { name: 'Anlegen', exact: true }).click()
  await expect(planDialog).toHaveCount(0)

  const blocks = await blocksOf(user, calendarId, task.id)
  expect(totalMinutes(blocks)).toBe(25 * 60)
  expect(blocks.every((block) => block.builtinCategories.join() === 'learning')).toBe(true)
  const [moved] = (await api<{ id: string; dueDate: string }[]>(user, 'GET', `/tasks?calendarId=${calendarId}`)).data
  expect(moved.dueDate > addDays(today(), 1)).toBe(true)
  const perDay = new Map<string, number>()
  for (const block of blocks)
    perDay.set(block.startDate, (perDay.get(block.startDate) ?? 0) + minutesOf(block.end) - minutesOf(block.start))
  expect(Math.max(...perDay.values())).toBeLessThanOrEqual(8 * 60)
})

test('saves the planning settings per profile', async ({ browser }) => {
  const user = await createUser('Rita')
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=planning')
  await page.getByRole('button', { name: 'So früh wie möglich' }).click()
  await page.getByLabel('Arbeitszeitregeln').selectOption({ label: 'Saudi-Arabien' })
  await expect(page.locator('.planningRules')).toContainText('Ruhetage: Freitag')
  await page.locator('input[name=planningDayStart]').fill('09:00')
  await page.locator('input[name=planningDayEnd]').fill('09:30')
  await expect(page.getByText('Die Planungszeiten müssen mindestens eine Stunde umfassen.')).toBeVisible()
  await page.locator('input[name=planningDayEnd]').fill('17:00')
  await expect(page.getByText('Die Planungszeiten müssen mindestens eine Stunde umfassen.')).toHaveCount(0)
  await expect
    .poll(async () => (await api<Record<string, string>>(user, 'GET', '/preferences')).data)
    .toMatchObject({
      planningDistribution: 'early',
      planningCountry: 'SA',
      planningDayStart: '09:00',
      planningDayEnd: '17:00',
    })
})
