import { api, createTeamCalendar, createUser, eventInput, expect, openAs, showView, test } from './helpers.ts'

const ownTitles = async (user: Parameters<typeof api>[0]) =>
  (await api<{ title: string }[]>(user, 'GET', '/events?from=2000-01-01&to=2100-01-01&calendarId=personal')).data
    .map((event) => event.title)
    .sort()

test('opens the date jump, the calendar switcher, search and views from the keyboard', async ({ browser }) => {
  const user = await createUser('Anna')
  await createTeamCalendar(user, 'Verein')
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.locator('.headerSubtitle').click()

  await page.keyboard.press('g')
  await expect(page.locator('.dateJump')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.dateJump')).toBeHidden()

  await page.keyboard.press('s')
  await expect(page.locator('.quickSwitcher')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.quickSwitcher')).toBeHidden()

  await page.keyboard.press('1')
  await expect(page.locator('.segment.active')).toHaveText('Tag')
  await page.keyboard.press('3')
  await expect(page.locator('.segment.active')).toHaveText('Monat')

  await page.keyboard.press('ControlOrMeta+k')
  await expect(page.getByRole('dialog', { name: 'Suchen' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.keyboard.press('?')
  const help = page.getByRole('dialog', { name: 'Tastenkürzel' })
  await expect(help).toContainText('Zu Datum springen')
  await expect(help).toContainText('Kalender wechseln')
  await expect(help).toContainText('Termine')
})

test('edits, duplicates and deletes the focused event and the one in the preview', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Zahnarzt', start: '09:00', end: '10:00' }))
  const page = await openAs(browser, user)
  await showView(page, 'Tag')
  const event = (title: string) => page.locator(`.eventOpen[aria-label^="${title},"]`)

  await event('Zahnarzt').focus()
  await page.keyboard.press('e')
  const dialog = page.locator('dialog[open]')
  await expect(dialog.locator('input[name=title]')).toHaveValue('Zahnarzt')
  await dialog.locator('input[name=title]').fill('Zahnarzt Kontrolle')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(dialog).toHaveCount(0)
  await expect.poll(() => ownTitles(user)).toEqual(['Zahnarzt Kontrolle'])

  await event('Zahnarzt Kontrolle').focus()
  await page.keyboard.press('ControlOrMeta+d')
  await expect(dialog.locator('input[name=title]')).toHaveValue('Zahnarzt Kontrolle')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(dialog).toHaveCount(0)
  await expect.poll(() => ownTitles(user)).toEqual(['Zahnarzt Kontrolle', 'Zahnarzt Kontrolle'])

  await event('Zahnarzt Kontrolle').first().focus()
  await page.keyboard.press('Delete')
  await expect.poll(() => ownTitles(user)).toEqual(['Zahnarzt Kontrolle'])

  await expect(event('Zahnarzt Kontrolle')).toHaveCount(1)
  await event('Zahnarzt Kontrolle').click()
  const peek = page.locator('.eventPeek')
  await expect(peek).toBeVisible()
  await page.keyboard.press('Delete')
  await expect(peek).toHaveCount(0)
  await expect.poll(() => ownTitles(user)).toEqual([])
})

test('saves a new event with Ctrl+Enter', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await showView(page, 'Tag')
  await page.keyboard.press('n')
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Lesen')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(dialog).toHaveCount(0)
  await expect.poll(() => ownTitles(user)).toEqual(['Lesen'])
})
