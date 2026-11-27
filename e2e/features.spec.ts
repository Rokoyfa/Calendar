import type { Page } from '@playwright/test'
import { api, createUser, eventInput, expect, openAs, test, type TestUser } from './helpers.ts'

type Place = 'menu' | 'header' | 'newEvent' | 'editEvent' | 'details' | 'settings' | 'calendarSettings'

type Probe = {
  feature: string
  place: Place
  name: string
  role: 'button' | 'tab' | 'heading' | 'menuitem' | 'label' | 'text'
  tab?: string
}

const PROBES: Probe[] = [
  { feature: 'search', place: 'menu', name: 'Suchen', role: 'menuitem' },
  { feature: 'print', place: 'menu', name: 'Drucken oder als PDF speichern', role: 'menuitem' },
  { feature: 'shortcuts', place: 'menu', name: 'Tastenkürzel', role: 'menuitem' },
  { feature: 'notifications', place: 'header', name: 'Benachrichtigungen', role: 'button' },
  { feature: 'tasks', place: 'header', name: 'Aufgaben', role: 'button' },
  { feature: 'tasks', place: 'newEvent', name: 'Aufgabe', role: 'button' },
  { feature: 'recurrence', place: 'newEvent', name: 'Wiederholung', role: 'tab' },
  { feature: 'reminders', place: 'newEvent', name: 'Erinnerung', role: 'label' },
  { feature: 'timeZones', place: 'newEvent', name: 'Zeitzone', role: 'label' },
  { feature: 'duplicate', place: 'editEvent', name: 'Duplizieren', role: 'button' },
  { feature: 'links', place: 'details', name: 'Webseite & Links', role: 'text' },
  { feature: 'attachments', place: 'details', name: 'Anhänge', role: 'text' },
  { feature: 'externalCalendars', place: 'settings', name: 'Verbindungen', role: 'tab' },
  { feature: 'caldavAccounts', place: 'settings', name: 'Verbindungen', role: 'tab' },
  { feature: 'caldav', place: 'settings', name: 'Verbindungen', role: 'tab' },
  { feature: 'emailNotifications', place: 'settings', name: 'Benachrichtigungen', role: 'tab' },
  { feature: 'dataExport', place: 'settings', name: 'Daten', role: 'tab' },
  { feature: 'twoFactor', place: 'settings', name: 'Zwei-Faktor-Anmeldung', role: 'heading', tab: 'security' },
  { feature: 'teams', place: 'settings', name: 'Kalender erstellen', role: 'text' },
  { feature: 'customColors', place: 'settings', name: 'Eigene Farben', role: 'heading', tab: 'appearance' },
  { feature: 'holidays', place: 'settings', name: 'Feiertage', role: 'heading', tab: 'appearance' },
  { feature: 'categories', place: 'calendarSettings', name: 'Kategorien', role: 'heading' },
  { feature: 'publicLinks', place: 'calendarSettings', name: 'Öffentlicher Link', role: 'heading' },
  { feature: 'personalSharing', place: 'calendarSettings', name: 'Freigabe', role: 'tab' },
  { feature: 'bookingPages', place: 'calendarSettings', name: 'Buchungsseiten', role: 'tab' },
  { feature: 'importExport', place: 'calendarSettings', name: 'Import & Export', role: 'tab' },
  { feature: 'subscriptions', place: 'calendarSettings', name: 'Import & Export', role: 'tab' },
  { feature: 'trash', place: 'calendarSettings', name: 'Papierkorb', role: 'tab' },
]

const harness = (features: string, path?: string) =>
  `/e2e/harness/features.html?features=${features}${path ? `&path=${encodeURIComponent(path)}` : ''}`

const personalCalendarId = async (user: TestUser) => (await api<{ id: string }[]>(user, 'GET', '/calendars')).data[0].id

const open = async (page: Page, user: TestUser, features: string, place: Place, tab?: string) => {
  const base =
    place === 'settings'
      ? '/settings'
      : place === 'calendarSettings'
        ? `/calendars/${await personalCalendarId(user)}/settings`
        : undefined
  const path = base && tab ? `${base}?tab=${tab}` : base
  await page.goto(harness(features, path))
  if (place === 'menu') {
    await page.getByRole('button', { name: 'Menü öffnen' }).click()
    const menu = page.getByRole('dialog', { name: 'Menü' })
    await menu.getByRole('link', { name: 'Kalender-Einstellungen' }).waitFor()
    return menu
  }
  if (place === 'newEvent' || place === 'editEvent' || place === 'details') {
    if (place === 'newEvent') await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
    else {
      await page.locator('.eventOpen[aria-label^="Yoga,"]').first().click()
      await page.locator('.eventPeekOpen').click()
    }
    const dialog = page.locator('dialog[open]')
    await dialog.locator('input[name=title]').waitFor()
    if (place === 'details') await dialog.getByRole('tab', { name: 'Details' }).click()
    return dialog
  }
  if (place === 'header') {
    const header = page.locator('header.header')
    await header.getByRole('button', { name: 'Neuer Termin', exact: true }).waitFor()
    await page.locator('.eventOpen[aria-label^="Yoga,"]').first().waitFor()
    return header
  }
  await page.getByRole('tab', { name: place === 'settings' ? 'Darstellung' : 'Allgemein', exact: true }).waitFor()
  await page
    .locator('[role=tabpanel]:not([inert]) .pageSection, [role=tabpanel]:not([inert]) section')
    .first()
    .waitFor()
  return page.locator('body')
}

const find = (scope: ReturnType<Page['locator']>, probe: Probe) =>
  probe.role === 'label'
    ? scope.locator('.descriptor', { hasText: probe.name })
    : probe.role === 'menuitem'
      ? scope.locator('.drawerMenuItem', { hasText: probe.name })
      : probe.role === 'text'
        ? scope.getByText(probe.name, { exact: true })
        : scope.getByRole(probe.role, { name: probe.name, exact: true })

const setup = async (browser: import('@playwright/test').Browser) => {
  const user = await createUser('Anna')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Yoga' }))
  return { user, page: await openAs(browser, user) }
}

const PLACES = ['menu', 'header', 'newEvent', 'editEvent', 'details', 'settings', 'calendarSettings'] as const

test.describe.configure({ timeout: 90_000 })

for (const place of PLACES) {
  test(`turned off features show no controls: ${place}`, async ({ browser }) => {
    const { user, page } = await setup(browser)
    const probes = PROBES.filter((entry) => entry.place === place)
    for (const tab of new Set(probes.map((probe) => probe.tab))) {
      const scope = await open(page, user, 'auth', place, tab)
      for (const probe of probes.filter((entry) => entry.tab === tab)) {
        await expect(find(scope, probe), `${probe.feature} should be hidden`).toHaveCount(0)
      }
      await page.keyboard.press('Escape')
    }
  })
}

test('the calendar works with every optional feature turned off', async ({ browser }) => {
  const { user, page } = await setup(browser)
  await page.goto(harness('auth'))
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const dialog = page.locator('dialog[open]')
  await dialog.locator('input[name=title]').fill('Lauf')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.eventOpen[aria-label^="Lauf,"]')).toHaveCount(1)
  await expect
    .poll(async () =>
      (await api<{ title: string }[]>(user, 'GET', '/events?from=2000-01-01&to=2100-01-01&calendarId=personal')).data
        .map((event) => event.title)
        .sort(),
    )
    .toEqual(['Lauf', 'Yoga'])
})

for (const place of PLACES) {
  test(`each feature shows its own controls: ${place}`, async ({ browser }) => {
    const { user, page } = await setup(browser)
    for (const probe of PROBES.filter((entry) => entry.place === place)) {
      const scope = await open(page, user, `auth,${probe.feature}`, place, probe.tab)
      await expect(find(scope, probe).first(), `${probe.feature} should be visible`).toBeVisible()
      await page.keyboard.press('Escape')
    }
  })
}
