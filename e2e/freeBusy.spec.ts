import { api, createTeamCalendar, createUser, eventInput, expect, openAs, showView, test, today } from './helpers.ts'

const nextWeekday = () => {
  const date = new Date(`${today()}T12:00:00Z`)
  do date.setUTCDate(date.getUTCDate() + 1)
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6)
  return date.toISOString().slice(0, 10)
}

test('finds a common time from the busy time of team members', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  await createTeamCalendar(anna, 'Projekt', [ben])
  const date = nextWeekday()
  const [annaPersonal] = (await api<{ id: string }[]>(anna, 'GET', '/calendars')).data
  const [benPersonal] = (await api<{ id: string }[]>(ben, 'GET', '/calendars')).data
  await api(
    ben,
    'POST',
    '/events',
    eventInput(benPersonal.id, { title: 'Geheim', startDate: date, endDate: date, start: '07:00', end: '12:00' }),
  )
  await api(
    anna,
    'POST',
    '/events',
    eventInput(annaPersonal.id, {
      title: 'Abstimmung',
      startDate: date,
      endDate: date,
      start: '09:00',
      end: '10:00',
      attendees: [{ email: ben.email, name: 'Ben', status: 'needsAction' }],
    }),
  )

  const page = await openAs(browser, anna)
  await showView(page, 'Agenda')
  await page.locator('.agendaView .agendaItem', { hasText: 'Abstimmung' }).click()
  await page.locator('.eventPeekOpen').click()
  const dialog = page.locator('dialog[open]')
  await dialog.getByRole('button', { name: 'Gemeinsame Zeit finden' }).click()

  const finder = page.locator('dialog[open]', { hasText: 'Vorschläge' })
  await expect(finder.locator('.findTimePeople li', { hasText: 'Ben' })).toContainText('Belegte Zeiten bekannt')
  await expect(finder.locator('.findTimePeople li', { hasText: 'Du' })).toContainText('Belegte Zeiten bekannt')
  await expect(finder).not.toContainText('Geheim')
  const first = finder.locator('.findTimeSlots button').first()
  await expect(first).toContainText('12:00–13:00')
  await first.click()

  await expect(page.locator('dialog[open]')).toHaveCount(1)
  await expect(
    dialog.locator('input[name="start"]'),
  ).toHaveValue('12:00')
})

test('hides busy time after opting out', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  await createTeamCalendar(anna, 'Projekt', [ben])
  const benPage = await openAs(browser, ben)
  await benPage.goto('/settings?tab=connections')
  const toggle = benPage.getByRole('switch', { name: 'Belegte Zeiten zeigen' })
  await expect(toggle).toBeChecked()
  await toggle.focus()
  await benPage.keyboard.press('Space')
  await expect(toggle).not.toBeChecked()

  const { data } = await api<{ people: { available: boolean }[] }>(anna, 'POST', '/free-busy', {
    from: `${today()}T00:00:00Z`,
    to: `${nextWeekday()}T23:00:00Z`,
    attendees: [{ email: ben.email }],
  })
  expect(data.people[0].available).toBe(false)
})
