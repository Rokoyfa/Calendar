import type { Page } from '@playwright/test'
import { api, createUser, eventInput, openAs, showView, today, expect, test } from './helpers.ts'

type Mail = { to: string; links: { url: string }[] }

const mailLink = async (to: string, path: string) => {
  const mails = (await api<Mail[]>(null, 'GET', '/dev/mails')).data
  const url = mails
    .filter((mail) => mail.to === to)
    .flatMap((mail) => mail.links.map((link) => new URL(link.url)))
    .find((link) => link.pathname.endsWith(path))
  if (!url) throw new Error(`No mail with ${path} to ${to}`)
  return `${path}${url.search}`
}

const firstFreeTime = async (page: Page) => {
  const times = page.locator('.bookingTimes button')
  for (let week = 0; week < 3; week++) {
    await expect(page.locator('.bookingSlots[aria-busy="false"]')).toBeVisible()
    if ((await times.count()) > 0) return times.first()
    await page.getByRole('button', { name: 'Nächste Woche' }).click()
  }
  throw new Error('No free time offered')
}

test('warns about overlapping events while editing', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Zahnarzt' }))
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Meeting')
  await dialog.locator('input[name=startDate]').fill(today())
  await dialog.locator('input[name=start]').fill('10:30')
  await dialog.locator('input[name=endDate]').fill(today())
  await dialog.locator('input[name=end]').fill('11:30')
  await expect(dialog.locator('.overlapNotice')).toContainText('Zahnarzt')
  await dialog.locator('input[name=start]').fill('11:00')
  await expect(dialog.locator('.overlapNotice')).toHaveCount(0)
})

test('prints the visible events', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Elternabend' }))
  const page = await openAs(browser, user)
  await page.evaluate(`
    window.printed = []
    const original = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc')
    Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', {
      configurable: true,
      get() { return original.get.call(this) },
      set(value) { window.printed.push(value); original.set.call(this, value) },
    })
  `)
  await showView(page, 'Woche')
  await expect(page.locator('.eventOpen[aria-label^="Elternabend,"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Menü öffnen' }).click()
  await page.getByRole('button', { name: 'Drucken oder als PDF speichern' }).click()
  await expect.poll(() => page.evaluate<string>(`window.printed.join('')`)).toContain('Elternabend')
})

test('books a time through a booking page and cancels it', async ({ browser, page }) => {
  const anna = await createUser('Anna')
  const { data: calendars } = await api<{ id: string }[]>(anna, 'GET', '/calendars')
  const owner = await openAs(browser, anna)
  await owner.goto(`/calendars/${calendars[0].id}/settings?tab=booking`)
  await owner.locator('input[name=bookingTitle]').fill('Beratung')
  await owner.getByRole('button', { name: 'Buchungsseite anlegen' }).click()
  const card = owner.locator('.calendarSettingCard', { hasText: 'Beratung' })
  await expect(card).toBeVisible()
  const link = await card.locator('input.feedUrl').inputValue()
  expect(new URL(link).pathname).toMatch(/^\/book\//)

  const { data: pages } = await api<{ id: string }[]>(anna, 'GET', `/calendars/${calendars[0].id}/booking-pages`)
  await api(anna, 'PATCH', `/booking-pages/${pages[0].id}`, {
    minNoticeMinutes: 0,
    hours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: '00:00', end: '24:00' })),
  })

  const email = `gast-${Date.now()}@example.com`
  await page.goto(new URL(link).pathname)
  await expect(page.getByRole('heading', { name: 'Beratung' })).toBeVisible()
  await expect(page.getByText('mit Anna')).toBeVisible()
  await (await firstFreeTime(page)).click()
  await page.locator('input[name=name]').fill('Max')
  await page.locator('input[name=email]').fill(email)
  await page.getByRole('button', { name: 'Buchen' }).click()
  await expect(page.getByText('Bitte prüfe deine E-Mails')).toBeVisible()

  await page.goto(await mailLink(email, '/booking/confirm'))
  await page.getByRole('button', { name: 'Buchung bestätigen' }).click()
  await expect(page.getByText('Deine Buchung ist bestätigt.', { exact: false })).toBeVisible()
  const events = async () =>
    (await api<{ title: string }[]>(anna, 'GET', '/events?from=2000-01-01&to=2099-01-01&calendarId=personal')).data
  expect((await events()).map((event) => event.title)).toContain('Beratung: Max')

  await page.goto(await mailLink(email, '/booking/cancel'))
  await expect(page.getByText('Beratung')).toBeVisible()
  await page.getByRole('button', { name: 'Buchung absagen' }).click()
  await expect(page.getByText('Die Buchung wurde abgesagt.')).toBeVisible()
  expect((await events()).map((event) => event.title)).not.toContain('Beratung: Max')

  await owner.reload()
  await owner.locator('.calendarSettingCard', { hasText: 'Beratung' }).getByText('Buchungen annehmen').click()
  await expect(owner.locator('.calendarSettingCard .badge', { hasText: 'Aus' })).toBeVisible()
  await page.goto(new URL(link).pathname)
  await expect(page.getByText('Diese Buchungsseite gibt es nicht oder sie wurde abgeschaltet.')).toBeVisible()
})

test('moves search, filter and print into the menu', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Yoga' }))
  const page = await openAs(browser, user)
  const header = page.locator('header.header')
  await expect(header.getByRole('button', { name: 'Suchen' })).toHaveCount(0)
  await expect(header.getByRole('button', { name: 'Drucken oder als PDF speichern' })).toHaveCount(0)
  const menuButton = header.getByRole('button', { name: 'Menü öffnen' })
  await menuButton.click()
  const menu = page.getByRole('dialog', { name: 'Menü' })
  await expect(menu.getByRole('button', { name: 'Drucken oder als PDF speichern' })).toBeVisible()
  await menu.getByRole('button', { name: 'Suchen' }).click()
  await expect(menu).toHaveCount(0)
  const search = page.getByRole('dialog', { name: 'Termine suchen' })
  await expect(search).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(search).toHaveCount(0)
  await expect(menuButton).toBeFocused()
})

test('links to the settings of the active calendar from the menu', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await page.locator('header.header').getByRole('button', { name: 'Menü öffnen' }).click()
  const menu = page.getByRole('dialog', { name: 'Menü' })
  await expect(menu.getByRole('heading', { name: 'Kalender: Persönlich' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Mitglieder' })).toHaveCount(0)
  await expect(menu.getByRole('link', { name: 'Freigabe' })).toBeVisible()
  await menu.getByRole('link', { name: 'Papierkorb' }).click()
  await expect(page).toHaveURL(/\/calendars\/[^/]+\/settings\?tab=trash$/)
  await expect(page.getByRole('tab', { name: 'Papierkorb', selected: true })).toBeVisible()
  await page.goBack()
  await page.locator('header.header').getByRole('button', { name: 'Menü öffnen' }).click()
  await page.getByRole('dialog', { name: 'Menü' }).getByRole('link', { name: 'Kalender-Einstellungen' }).click()
  await expect(page.getByRole('tab', { name: 'Allgemein', selected: true })).toBeVisible()
})
