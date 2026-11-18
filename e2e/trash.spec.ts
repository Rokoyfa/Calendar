import { api, createUser, eventInput, openAs, expect, test } from './helpers.ts'

test('restores a deleted event and empties the trash', async ({ browser }) => {
  const user = await createUser('Anna')
  for (const title of ['Alt', 'Weg', 'Sofort']) {
    const { data } = await api<{ id: string }>(user, 'POST', '/events', eventInput('personal', { title }))
    await api(user, 'DELETE', `/events/${data.id}`)
  }
  const { data: calendars } = await api<{ id: string; name: string }[]>(user, 'GET', '/calendars')
  const page = await openAs(browser, user)
  await page.goto(`/calendars/${calendars[0].id}/settings?tab=trash`)
  const rows = page.locator('.trashRow')
  await expect(rows).toHaveCount(3)

  await rows
    .filter({ hasText: 'Sofort' })
    .getByRole('button', { name: /endgültig löschen/ })
    .click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Endgültig löschen' }).click()
  await expect(rows).toHaveCount(2)

  await rows.filter({ hasText: 'Alt' }).getByRole('button', { name: 'Wiederherstellen' }).click()
  await expect(rows).toHaveCount(1)
  const { data: events } = await api<{ title: string }[]>(
    user,
    'GET',
    '/events?from=2000-01-01&to=2099-01-01&calendarId=personal',
  )
  expect(events.map((event) => event.title)).toEqual(['Alt'])

  await page.getByRole('button', { name: 'Papierkorb leeren' }).click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Papierkorb leeren' }).click()
  await expect(page.getByText('Der Papierkorb ist leer.')).toBeVisible()
})
