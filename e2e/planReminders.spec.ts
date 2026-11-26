import { api, createTeamCalendar, createUser, eventInput, expect, openAs, showView, test, today } from './helpers.ts'

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

test('offers to plan again when a new event overlaps planned time', async ({ browser }) => {
  const user = await createUser('Pia')
  const date = addDays(today(), 3)
  const task = (
    await api<{ id: string }>(user, 'POST', '/tasks', {
      calendarId: 'personal',
      title: 'Steuererklärung',
      estimateMinutes: 120,
      dueDate: addDays(today(), 20),
    })
  ).data
  await api(
    user,
    'POST',
    '/events',
    eventInput('personal', {
      title: 'Steuererklärung',
      startDate: date,
      endDate: date,
      start: '10:00',
      end: '11:00',
      taskId: task.id,
    }),
  )

  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Zahnarzt')
  await dialog.locator('input[name=startDate]').fill(date)
  await dialog.locator('input[name=start]').fill('10:30')
  await dialog.locator('input[name=endDate]').fill(date)
  await dialog.locator('input[name=end]').fill('11:30')
  await expect(dialog.locator('.planConflictNotice')).toContainText(
    'Überschneidet sich mit eingeplanter Zeit für „Steuererklärung“',
  )
  await dialog.getByRole('button', { name: 'Speichern und neu planen' }).click()

  await expect(page.locator('dialog[open]', { hasText: 'Aufgabe einplanen' })).toBeVisible()
  const events = (await api<{ title: string }[]>(user, 'GET', `/events?from=${date}&to=${date}&calendarId=personal`))
    .data
  expect(events.map((event) => event.title).sort()).toEqual(['Steuererklärung', 'Zahnarzt'])
})

test('warns in the bell when a task is due soon and when others book over planned time', async ({ browser }) => {
  const owner = await createUser('Olga')
  const member = await createUser('Max')
  const calendarId = await createTeamCalendar(owner, 'Büro', [member])
  const later = addDays(today(), 5)
  const due = (
    await api<{ id: string }>(owner, 'POST', '/tasks', {
      calendarId: 'personal',
      title: 'Angebot',
      estimateMinutes: 180,
      dueDate: addDays(today(), 1),
      dueTime: '23:00',
    })
  ).data
  await api(
    owner,
    'POST',
    '/events',
    eventInput('personal', {
      title: 'Angebot',
      startDate: later,
      endDate: later,
      start: '09:00',
      end: '10:00',
      taskId: due.id,
    }),
  )
  await api(null, 'POST', '/dev/task-reminders')
  await api(
    member,
    'POST',
    '/events',
    eventInput(calendarId, { title: 'Teamrunde', startDate: later, endDate: later, start: '09:30', end: '10:30' }),
  )

  const page = await openAs(browser, owner)
  const bell = page.locator('.notificationButton')
  await expect(bell.locator('.notificationBadge')).toHaveText('2')
  await bell.click()
  await expect(
    page.locator('.notificationItem', {
      hasText: '„Teamrunde“ von Max überschneidet sich mit eingeplanter Zeit für „Angebot“',
    }),
  ).toBeVisible()
  const item = page.locator('.notificationItem', {
    hasText: 'Die Aufgabe „Angebot“ ist bald fällig und noch nicht ganz eingeplant',
  })
  await item.locator('.notificationOpen').click()
  await expect(page.locator('dialog[open]', { hasText: 'Aufgabe einplanen' })).toBeVisible()
})

test('turns off the email before a due task', async ({ browser }) => {
  const user = await createUser('Ida')
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=notifications')
  const toggle = page.getByRole('switch', { name: 'Wenn eine Aufgabe bald fällig und noch nicht ganz eingeplant ist' })
  await expect(toggle).toBeChecked()
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).not.toBeChecked()
  const { data } = await api<{ emailTaskDue: boolean }>(user, 'GET', '/preferences')
  expect(data.emailTaskDue).toBe(false)
})
