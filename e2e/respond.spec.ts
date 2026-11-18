import { api, createUser, eventInput, expect, test } from './helpers.ts'

type Mail = { to: string; links: { url: string }[] }

test('answers an invitation from the email link without signing in', async ({ page }) => {
  const anna = await createUser('Anna')
  const guestEmail = `gast-${Date.now()}@example.com`
  await api(
    anna,
    'POST',
    '/events',
    eventInput('personal', {
      title: 'Grillabend',
      attendees: [{ email: guestEmail, name: 'Gast', status: 'needsAction' }],
    }),
  )
  const mails = (await api<Mail[]>(null, 'GET', '/dev/mails')).data
  const yes = mails
    .find((mail) => mail.to === guestEmail)!
    .links.map((link) => new URL(link.url))
    .find((url) => url.pathname.endsWith('/respond') && url.searchParams.get('status') === 'accepted')!
  await page.goto(`/respond${yes.search}`)
  await expect(page.getByText('Grillabend')).toBeVisible()
  const { data } = await api<{ attendees: { email: string; status: string }[] }[]>(
    anna,
    'GET',
    '/events?from=2000-01-01&to=2099-01-01&calendarId=personal',
  )
  expect(data[0].attendees[0].status).toBe('accepted')
})
