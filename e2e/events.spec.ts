import { api, createUser, eventInput, openAs, openEvent, showView, today, expect, test } from './helpers.ts'

test('creates, edits and deletes an event', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  let dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Training')
  await dialog.locator('input[name=start]').fill('10:00')
  await dialog.locator('input[name=end]').fill('11:30')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Training,"]')).toHaveCount(1)

  dialog = await openEvent(page, 'Training')
  await dialog.locator('input[name=title]').fill('Training (verlegt)')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Training (verlegt),"]')).toHaveCount(1)

  dialog = await openEvent(page, 'Training (verlegt)')
  await dialog.getByRole('button', { name: 'Löschen' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Training (verlegt),"]')).toHaveCount(0)
  await page.locator('.undoNoticeAction').click()
  await expect(page.locator('.eventOpen[aria-label^="Training (verlegt),"]')).toHaveCount(1)
})

test('changes only one occurrence of a series', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', {
    ...eventInput('personal', { title: 'Lauftreff' }),
    recurrence: { frequency: 'daily', interval: 1, weekdays: [], monthlyMode: 'dayOfMonth', until: null, count: 3 },
  })
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  const dialog = await openEvent(page, 'Lauftreff')
  await dialog.locator('input[name=title]').fill('Lauftreff (Wald)')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await page.locator('dialog[open]').getByRole('button', { name: 'Nur dieser Termin' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Lauftreff (Wald),"]')).toHaveCount(1)
  const { data } = await api<{ title: string }[]>(
    user,
    'GET',
    `/events?from=${today()}&to=2099-01-01&calendarId=personal`,
  )
  expect(data.map((event) => event.title).sort()).toContain('Lauftreff (Wald)')
})
