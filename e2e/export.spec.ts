import { readFile } from 'node:fs/promises'
import { api, createUser, eventInput, openAs, expect, test } from './helpers.ts'

test('downloads the own data as JSON', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Zahnarzt' }))
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=data')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Daten herunterladen' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^calendar-export-\d{4}-\d{2}-\d{2}\.json$/)
  const data = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(data.user.email).toBe(user.email)
  expect(data.events.map((event: { title: string }) => event.title)).toEqual(['Zahnarzt'])
  expect(JSON.stringify(data)).not.toContain('password')
})
