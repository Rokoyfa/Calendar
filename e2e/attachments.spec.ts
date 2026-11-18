import { readFile } from 'node:fs/promises'
import { createUser, openAs, openEvent, showView, expect, test } from './helpers.ts'

test('uploads, downloads and deletes an attachment', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  let dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Mit Agenda')
  await dialog.getByRole('tab', { name: /Details/ }).click()
  await dialog
    .locator('input[name=attachments]')
    .setInputFiles({ name: 'Tagesordnung.txt', mimeType: 'text/plain', buffer: Buffer.from('Punkt 1') })
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)

  dialog = await openEvent(page, 'Mit Agenda')
  await dialog.getByRole('tab', { name: /Details/ }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.locator('button.attachmentName', { hasText: 'Tagesordnung' }).click(),
  ])
  expect(await readFile((await download.path())!, 'utf8')).toBe('Punkt 1')
  await dialog.getByRole('button', { name: 'Tagesordnung.txt entfernen' }).click()
  await expect(dialog.locator('button.attachmentName')).toHaveCount(0)
})
