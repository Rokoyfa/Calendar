import { api, createTeamCalendar, createUser, expect, openAs, test } from './helpers.ts'

test('switches calendars from the banner above the calendar', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  await createTeamCalendar(ben, 'Verein')
  await api(anna, 'PUT', '/personal-sharing', { enabled: true })
  await api(anna, 'POST', '/personal-sharing/viewers', { email: ben.email })
  const { data } = await api<{ id: string }[]>(ben, 'GET', '/peer-calendars')
  await api(ben, 'POST', `/peer-calendars/${data[0].id}/accept`)
  const page = await openAs(browser, ben)

  await expect(page.locator('.activeCalendarName')).toHaveText('Persönlich')
  await page.locator('.activeCalendarButton').click()
  const switcher = page.locator('.quickSwitcher')
  await expect(switcher.getByRole('region', { name: 'Teams' })).toContainText('Verein')
  await expect(switcher.getByRole('region', { name: 'Geteilt' })).toContainText('Kalender von Anna')
  await page.keyboard.press('Escape')
  await expect(switcher).toBeHidden()
  await page.locator('.activeCalendarButton').click()
  await expect(switcher.locator('.quickSwitcherItem[aria-current="true"]')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(switcher).toBeHidden()
  await expect(page.locator('.activeCalendarName')).toHaveText('Verein')

  await page.locator('.activeCalendarButton').click()
  await switcher.getByRole('button', { name: 'Kalender von Anna' }).click()
  await expect(page.locator('.activeCalendarName')).toHaveText('Kalender von Anna')

  await page.locator('.activeCalendarButton').click()
  await switcher.getByRole('button', { name: 'Alle Kalender …' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog.getByRole('tab', { name: 'Geteilt (1)' })).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Escape')

  await page.locator('.activeCalendarButton').click()
  await switcher.getByRole('link', { name: 'Neuer Kalender' }).click()
  await expect(page).toHaveURL(/\/calendars\/new/)
})

test('shows the banner without a menu when there is nothing to switch to', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.activeCalendarName')).toHaveText('Persönlich')
  await expect(page.locator('.activeCalendarButton')).toHaveCount(0)
})
