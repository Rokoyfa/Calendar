import type { Page } from '@playwright/test'
import { api, createTeamCalendar, createUser, eventInput, expect, openAs, showView, test, today } from './helpers.ts'

const ownTitles = async (user: Parameters<typeof api>[0]) =>
  (await api<{ title: string }[]>(user, 'GET', '/events?from=2000-01-01&to=2100-01-01&calendarId=personal')).data
    .map((event) => event.title)
    .sort()

const swipe = (page: Page, dx: number) =>
  page.evaluate(`(() => {
    const host = document.querySelector('#root > div')
    const main = (host?.shadowRoot ?? document).querySelector('main.main')
    const { left, top, width, height } = main.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const touch = (clientX) => new Touch({ identifier: 1, target: main, clientX, clientY: y })
    main.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(x)], changedTouches: [touch(x)], bubbles: true }))
    main.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(x + ${dx})], bubbles: true }))
  })()`)

test('adds an event right in the grid and opens all options when wanted', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await showView(page, 'Tag')
  await page.locator('.slot[aria-label$="14:00"]').click()
  const quick = page.locator('.quickCreate')
  await expect(quick.locator('.quickCreateWhen')).toContainText('14:00')
  await expect(page.locator('.eventPlanned')).toHaveCount(1)
  await expect(quick.getByRole('button', { name: 'Speichern' })).toBeDisabled()
  await page.keyboard.type('Zahnarzt')
  await page.keyboard.press('Enter')
  await expect(quick).toHaveCount(0)
  await expect(page.locator('.eventOpen[aria-label^="Zahnarzt,"]')).toHaveCount(1)
  await expect.poll(() => ownTitles(user)).toEqual(['Zahnarzt'])

  await page.locator('.slot[aria-label$="16:00"]').click()
  await page.keyboard.type('Training')
  await quick.getByRole('button', { name: 'Weitere Optionen' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog.locator('input[name=title]')).toHaveValue('Training')
  await expect(dialog.locator('input[name=start]')).toHaveValue('16:00')
  await page.keyboard.press('Escape')
  await expect(page.locator('.eventPlanned')).toHaveCount(0)
})

test('keeps the quick entry open when the browser light-dismisses after the click', async ({ browser }) => {
  const user = await createUser('Rita')
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  await page.evaluate(`(() => {
    const root = document.querySelector('#root > div')?.shadowRoot ?? document
    const dismiss = () => root.querySelectorAll(':popover-open').forEach((popover) => popover.hidePopover())
    window.addEventListener('pointerup', dismiss)
    window.addEventListener('click', dismiss)
  })()`)
  await page.locator('.slot[aria-label$="10:00"]').first().click()
  await expect(page.locator('.quickCreate')).toBeVisible()
  await expect(page.locator('.quickCreateTitle')).toBeFocused()
})

test('shows an event preview with quick actions', async ({ browser }) => {
  const user = await createUser('Anna')
  await api(
    user,
    'POST',
    '/events',
    eventInput('personal', { title: 'Yoga', location: 'Studio Süd', description: 'Matte mitbringen' }),
  )
  const page = await openAs(browser, user)
  await page.locator('.eventOpen[aria-label^="Yoga,"]').click()
  const peek = page.locator('.eventPeek')
  await expect(peek.getByRole('heading', { name: 'Yoga' })).toBeVisible()
  await expect(peek).toContainText('Studio Süd')
  await expect(peek).toContainText('Matte mitbringen')
  await expect(peek.locator('.eventPeekOpen')).toBeFocused()

  await peek.getByRole('button', { name: 'Duplizieren' }).click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog.locator('input[name=title]')).toHaveValue('Yoga')
  await page.keyboard.press('Escape')

  await page.locator('.eventOpen[aria-label^="Yoga,"]').click()
  await peek.getByRole('button', { name: 'Löschen' }).click()
  await expect(page.locator('.eventOpen[aria-label^="Yoga,"]')).toHaveCount(0)
  await expect.poll(() => ownTitles(user)).toEqual([])
})

test('jumps to a date from the title', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await showView(page, 'Monat')
  const title = page.locator('.headerTitleButton')
  const before = await title.textContent()
  await title.click()
  const jump = page.locator('.dateJump')
  await jump.getByRole('button', { name: 'Nächster Monat' }).click()
  await jump.locator('.miniDay').filter({ hasText: /^15$/ }).click()
  await expect(jump).toBeHidden()
  await expect(title).not.toHaveText(before ?? '')
  await title.click()
  await jump.getByRole('button', { name: 'Heute' }).click()
  await expect(title).toHaveText(before ?? '')
})

test('lists the keyboard shortcuts', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await page.locator('.headerTitleButton').waitFor()
  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: 'Tastenkürzel' })
  await expect(dialog).toContainText('Neuer Termin')
  await expect(dialog).toContainText('Woche')
})

test('switches the period with a swipe', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await showView(page, 'Woche')
  const title = page.locator('.headerTitleButton')
  const before = await title.textContent()
  await swipe(page, -150)
  await expect(title).not.toHaveText(before ?? '')
  await swipe(page, 150)
  await expect(title).toHaveText(before ?? '')
})

test('shows team calendars in the personal calendar from the quick switcher', async ({ browser }) => {
  const user = await createUser('Anna')
  const teamId = await createTeamCalendar(user, 'Verein')
  await api(
    user,
    'POST',
    '/events',
    eventInput(teamId, { title: 'Vereinstreffen', startDate: today(), endDate: today() }),
  )
  const page = await openAs(browser, user)
  await expect(page.locator('.eventOpen[aria-label^="Vereinstreffen,"]')).toHaveCount(1)
  await page.locator('.activeCalendarButton').click()
  const toggle = page.getByRole('checkbox', { name: 'Verein im persönlichen Kalender anzeigen' })
  await expect(toggle).toBeChecked()
  await toggle.click()
  await expect(toggle).not.toBeChecked()
  await expect(page.locator('.eventOpen[aria-label^="Vereinstreffen,"]')).toHaveCount(0)
})

test('guides through the calendar once and can be restarted from the menu', async ({ browser }) => {
  const user = await createUser('Anna')
  await createTeamCalendar(user, 'Verein')
  const page = await openAs(browser, user)
  await page.goto('/e2e/harness/features.html?features=auth,teams,shortcuts,tasks,notifications,tips')
  const bubble = page.locator('.tourBubble')
  await expect(bubble).toContainText('Schritt 1 von')
  const seen: string[] = []
  for (;;) {
    const id = await bubble.getAttribute('data-step')
    seen.push(id ?? '')
    if (id !== 'done') {
      const ring = await page.locator('.tourRing').boundingBox()
      expect(ring, id ?? '').not.toBeNull()
    }
    const next = bubble.getByRole('button', { name: 'Weiter' })
    if ((await next.count()) === 0) break
    await next.click()
    await expect(bubble).not.toHaveAttribute('data-step', id ?? '')
  }
  expect(seen).toEqual(
    expect.arrayContaining([
      'grid',
      'create',
      'navigate',
      'jump',
      'switch',
      'views',
      'tasks',
      'menu',
      'notifications',
      'account',
      'done',
    ]),
  )
  expect(seen.indexOf('tasks')).toBeLessThan(seen.indexOf('menu'))
  await bubble.getByRole('button', { name: 'Zurück' }).click()
  await expect(bubble).toHaveAttribute('data-step', seen[seen.length - 2])
  await bubble.getByRole('button', { name: 'Beenden' }).click()
  await expect(bubble).toHaveCount(0)

  await page.reload()
  await page.locator('.headerTitleButton').waitFor()
  await expect(bubble).toHaveCount(0)
  await page.getByRole('button', { name: 'Menü öffnen' }).click()
  await page.getByRole('button', { name: 'Einführung' }).click()
  await expect(bubble).toHaveAttribute('data-step', 'grid')
  await expect(bubble.getByRole('button', { name: 'Weiter' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(bubble).toHaveCount(0)
})

test('points at the right control in each step', async ({ browser }) => {
  const user = await createUser('Anna')
  const page = await openAs(browser, user)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/e2e/harness/features.html?features=auth,shortcuts,tasks,tips')
  const bubble = page.locator('.tourBubble')
  const targets: Record<string, string> = {
    create: '.headerCreate > .iconButton',
    jump: '.headerTitleButton',
    tasks: '.segment[data-value="tasks"]',
  }
  for (;;) {
    const id = (await bubble.getAttribute('data-step')) ?? ''
    if (id in targets) {
      const ring = (await page.locator('.tourRing').boundingBox())!
      const target = (await page.locator(targets[id]).first().boundingBox())!
      expect(ring.x).toBeLessThanOrEqual(target.x)
      expect(ring.y).toBeLessThanOrEqual(target.y)
      expect(ring.x + ring.width).toBeGreaterThanOrEqual(target.x + target.width)
      expect(ring.y + ring.height).toBeGreaterThanOrEqual(target.y + target.height)
      const box = (await bubble.boundingBox())!
      expect(box.y).toBeGreaterThanOrEqual(ring.y + ring.height)
    }
    const next = bubble.getByRole('button', { name: 'Weiter' })
    if ((await next.count()) === 0) break
    await next.click()
    await expect(bubble).not.toHaveAttribute('data-step', id)
  }
})
