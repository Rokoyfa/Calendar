import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import {
  api,
  createTeamCalendar,
  createUser,
  eventInput,
  expect,
  openAs,
  openEvent,
  showView,
  test,
} from './helpers.ts'

test.describe.configure({ timeout: 120_000 })

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type Finding = { screen: string; rule: string; impact: string | null | undefined; targets: string[] }

const auditor = () => {
  const findings: Finding[] = []
  const audit = async (page: Page, screen: string) => {
    await page.waitForLoadState('networkidle')
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    for (const { id, impact, nodes } of violations)
      findings.push({ screen, rule: id, impact, targets: nodes.slice(0, 5).map((node) => node.target.join(' ')) })
  }
  const verify = () => expect(findings, JSON.stringify(findings, null, 2)).toEqual([])
  return { audit, verify }
}

test('the sign-in and registration pages are accessible', async ({ page }) => {
  const { audit, verify } = auditor()
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
  await audit(page, 'login')
  await page.goto('/register')
  await expect(page.getByRole('button', { name: 'Konto erstellen' })).toBeVisible()
  await audit(page, 'register')
  verify()
})

test('the calendar views and the event dialog are accessible', async ({ browser }) => {
  const { audit, verify } = auditor()
  const user = await createUser('Alma')
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Zugänglich' }))
  await api(user, 'POST', '/events', eventInput('personal', { title: 'Ganztägig', allDay: true }))
  for (const title of ['Eins', 'Zwei', 'Drei', 'Vier'])
    await api(user, 'POST', '/events', eventInput('personal', { title }))
  const page = await openAs(browser, user)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    for (const view of ['Tag', 'Woche', 'Monat', 'Jahr', 'Agenda'] as const) {
      await showView(page, view)
      await audit(page, `${scheme} view ${view}`)
    }
  }
  await page.emulateMedia({ colorScheme: 'light' })
  await showView(page, 'Woche')
  const dialog = await openEvent(page, 'Zugänglich')
  await audit(page, 'event dialog')
  for (const tab of await dialog.getByRole('tab').all()) {
    await tab.click()
    await audit(page, `event dialog tab ${await tab.textContent()}`)
  }
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  await expect(page.locator('dialog[open]')).toBeVisible()
  await audit(page, 'new event dialog')
  verify()
})

test('the settings pages are accessible', async ({ browser }) => {
  const { audit, verify } = auditor()
  const user = await createUser('Ada')
  const member = await createUser('Bert')
  const team = await createTeamCalendar(user, 'Vereinsheim', [member])
  const page = await openAs(browser, user)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/settings')
    const tabs = page.locator('[role=tablist]').first().getByRole('tab')
    await expect(tabs.first()).toBeVisible()
    for (const tab of await tabs.all()) {
      await tab.click()
      await audit(page, `${scheme} settings ${await tab.textContent()}`)
    }
  }
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto(`/calendars/${team}/settings`)
  await expect(page.locator('h1, h2').first()).toBeVisible()
  await audit(page, 'calendar settings')
  await page.goto('/calendars/new')
  await expect(page.locator('h1, h2').first()).toBeVisible()
  await audit(page, 'create calendar')
  verify()
})
