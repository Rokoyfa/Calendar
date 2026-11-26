import { createUser, expect, openAs, test } from './helpers.ts'

test('offers the app files and explains push notifications without a service worker', async ({ browser }) => {
  const user = await createUser('Pia')
  const page = await openAs(browser, user)
  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const parsed = (await manifest.json()) as { display: string; icons: { purpose: string }[] }
  expect(parsed.display).toBe('standalone')
  expect(parsed.icons.map((icon) => icon.purpose)).toContain('maskable')
  const worker = await page.request.get('/sw.js')
  expect(worker.ok()).toBe(true)
  expect(await worker.text()).toContain("addEventListener('push'")
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')

  await page.goto('/settings?tab=notifications')
  const section = page.locator('section', { hasText: 'Push-Benachrichtigungen' })
  await expect(section).toContainText('Auf dieser Seite sind keine Push-Benachrichtigungen eingerichtet.')
  await expect(section.getByRole('switch')).toHaveCount(0)
})

test('turns push on and off for this device', async ({ browser }) => {
  const user = await createUser('Ole')
  const context = await browser.newContext()
  const [name, value] = user.cookie.split('=')
  await context.addCookies([{ name, value, domain: 'localhost', path: '/' }])
  const page = await context.newPage()
  await page.addInitScript(() => {
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-device',
      toJSON: () => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/e2e-device',
        keys: {
          p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
      }),
      unsubscribe: async () => {
        current = null
        return true
      },
    }
    let current: typeof subscription | null = null
    const pushManager = {
      getSubscription: async () => current,
      subscribe: async () => {
        current = subscription
        return subscription
      },
    }
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted', requestPermission: async () => 'granted' },
      configurable: true,
    })
    Object.defineProperty(globalThis, 'PushManager', { value: function PushManager() {}, configurable: true })
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: async () => ({ pushManager }) },
      configurable: true,
    })
  })
  await page.goto('/settings?tab=notifications')
  const toggle = page.getByRole('switch', { name: 'Auf diesem Gerät' })
  await expect(toggle).not.toBeChecked()
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).toBeChecked()
  expect(await page.evaluate(() => localStorage.getItem('calendar.push.v1'))).toContain('e2e-device')
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).not.toBeChecked()
  expect(await page.evaluate(() => localStorage.getItem('calendar.push.v1'))).toBeNull()
  await context.close()
})
