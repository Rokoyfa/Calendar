import { API_URL } from './env.ts'
import { createUser, expect, openAs, PASSWORD, test, totp } from './helpers.ts'

test('turns on two-factor sign-in and signs in with a recovery code', async ({ browser }) => {
  const user = await createUser('Tara')
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=security')
  await page.getByRole('link', { name: 'Einrichten' }).click()
  await expect(page.getByRole('heading', { name: 'Zwei-Faktor-Anmeldung', level: 1 })).toBeVisible()
  await page.locator('input[name=password]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Einrichtung starten' }).click()
  await expect(page.getByRole('img', { name: 'QR-Code für die Authenticator-App' })).toBeVisible()
  const secret = (await page.locator('.twoFactorSecret code').textContent())!
  await page.locator('input[name=code]').fill(totp(secret))
  await page.getByRole('button', { name: 'Aktivieren' }).click()
  const codes = page.locator('.recoveryCodeList code')
  await expect(codes).toHaveCount(10)
  const recoveryCode = (await codes.first().textContent())!
  await page.getByRole('button', { name: 'Fertig' }).click()
  await expect(page.getByText('Aktiv · Wiederherstellungscodes übrig: 10')).toBeVisible()

  await page.goto('/')
  await page.locator('.accountButton').click()
  await page.getByRole('button', { name: 'Abmelden' }).click()
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(user.email)
  await page.locator('input[name=password]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.getByRole('heading', { name: 'Anmeldung bestätigen' })).toBeVisible()
  await page.getByRole('button', { name: 'Stattdessen einen Wiederherstellungscode verwenden' }).click()
  await page.locator('input[name=recoveryCode]').fill('falsch-falsch')
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.getByText('Der Code ist falsch oder wurde schon verwendet.')).toBeVisible()
  await page.locator('input[name=recoveryCode]').fill(recoveryCode)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await expect(page.locator('.headerTitle')).toBeVisible()
  await expect(page.locator('.accountButton')).toBeVisible()
})

test('lists signed-in devices and signs out the others', async ({ browser }) => {
  const user = await createUser('Sina')
  const other = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (iPhone) Safari/605.1.15' },
    body: JSON.stringify({ email: user.email, password: PASSWORD }),
  })
  expect(other.status).toBe(200)
  const page = await openAs(browser, user)
  await page.goto('/settings?tab=security')
  const sessions = page.locator('.sessionItem')
  await expect(sessions).toHaveCount(2)
  await expect(sessions.filter({ hasText: 'Dieses Gerät' })).toHaveCount(1)
  await expect(sessions.filter({ hasText: 'Safari · iOS' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Alle anderen Geräte abmelden' }).click()
  await expect(sessions).toHaveCount(1)
  await expect(sessions.first()).toContainText('Dieses Gerät')
})
