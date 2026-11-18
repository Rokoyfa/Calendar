import { createUser, expect, PASSWORD, test } from './helpers.ts'

test('signs in with email and password and signs out again', async ({ page }) => {
  const user = await createUser('Anna')
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(user.email)
  await page.locator('input[name=password]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.locator('.headerTitle')).toBeVisible()
  await page.locator('.accountButton').click()
  await expect(page.getByText(user.email)).toBeVisible()
  await page.getByRole('button', { name: 'Abmelden' }).click()
  await expect(page.locator('.accountButton')).toHaveCount(0)
})

test('works without an account in local mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Ohne Konto')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText('Ohne Konto')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Ohne Konto')).toBeVisible()
})
