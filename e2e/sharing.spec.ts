import {
  api,
  createUser,
  eventInput,
  expect,
  openAs,
  openEvent,
  showView,
  test,
  today,
  type TestUser,
} from './helpers.ts'

type ListedEvent = { id: string; title: string; request: { status: string; requester: { name: string } | null } | null }

const tomorrow = () => {
  const date = new Date(`${today()}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

const ownEvents = async (user: TestUser) =>
  (await api<ListedEvent[]>(user, 'GET', '/events?from=2000-01-01&to=2100-01-01&calendarId=personal')).data

const share = async (owner: TestUser, viewer: TestUser) => {
  await api(owner, 'PUT', '/personal-sharing', { enabled: true })
  await api(owner, 'POST', '/personal-sharing/viewers', { email: viewer.email })
  const { data } = await api<{ id: string }[]>(viewer, 'GET', '/peer-calendars')
  await api(viewer, 'POST', `/peer-calendars/${data[0].id}/accept`)
  return data[0].id
}

test('turns on sharing after a confirmation and the invited person accepts', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  const { data: calendars } = await api<{ id: string }[]>(anna, 'GET', '/calendars')
  const owner = await openAs(browser, anna)
  await owner.goto(`/calendars/${calendars[0].id}/settings?tab=sharing`)
  await owner.getByRole('button', { name: 'Freigabe einschalten' }).click()
  const confirm = owner.locator('dialog[open]')
  await expect(confirm).toContainText('nur als belegte Zeit')
  await confirm.getByRole('button', { name: 'Einschalten' }).click()
  await expect(owner.getByText('Die Freigabe ist an.')).toBeVisible()
  await owner.getByLabel('E-Mail-Adresse').fill(ben.email)
  await owner.getByRole('button', { name: 'Einladen', exact: true }).click()
  await expect(owner.getByText('Einladung gesendet.')).toBeVisible()
  await expect(owner.locator('.itemRow', { hasText: ben.email })).toContainText('Eingeladen')

  const viewer = await openAs(browser, ben)
  await viewer.goto('/settings?tab=invitations')
  await viewer
    .locator('.calendarSettingCard', { hasText: 'Anna möchte dir den eigenen Kalender zeigen' })
    .getByRole('button', { name: 'Annehmen' })
    .click()
  await expect
    .poll(async () =>
      (await api<{ status: string }[]>(ben, 'GET', '/peer-calendars')).data.map((entry) => entry.status),
    )
    .toEqual(['accepted'])
})

test('shows private events only as busy time and public events with their title', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  await share(anna, ben)
  await api(anna, 'POST', '/events', eventInput('personal', { title: 'Arzt', start: '08:00', end: '09:00' }))
  await api(
    anna,
    'POST',
    '/events',
    eventInput('personal', {
      title: 'Mittag',
      start: '12:00',
      end: '13:00',
      visibility: 'public',
      location: 'Kantine',
    }),
  )

  const viewer = await openAs(browser, ben)
  await showView(viewer, 'Woche')
  await expect(viewer.locator('.eventOpen[aria-label^="Mittag,"]')).toHaveCount(1)
  await expect(viewer.locator('.eventOpen[aria-label^="Belegt,"]')).toHaveCount(1)
  await expect(viewer.locator('.eventOpen[aria-label^="Arzt,"]')).toHaveCount(0)

  const dialog = await openEvent(viewer, 'Belegt')
  await expect(dialog).toContainText('Aus dem Kalender von Anna')
  await expect(dialog.getByRole('button', { name: 'Speichern' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Löschen' })).toHaveCount(0)
  await viewer.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)

  const owner = await openAs(browser, anna)
  await showView(owner, 'Woche')
  const event = await openEvent(owner, 'Arzt')
  await event.getByText('Sichtbar für Personen, mit denen du deinen Kalender teilst').click()
  await event.getByRole('button', { name: 'Speichern' }).click()
  await expect(event).toHaveCount(0)
  await viewer.reload()
  await showView(viewer, 'Woche')
  await expect(viewer.locator('.eventOpen[aria-label^="Arzt,"]')).toHaveCount(1)
  await expect(viewer.locator('.eventOpen[aria-label^="Belegt,"]')).toHaveCount(0)
})

test('requests an event, the owner accepts it and the requester withdraws it', async ({ browser }) => {
  const anna = await createUser('Anna')
  const ben = await createUser('Ben')
  const shareId = await share(anna, ben)
  const date = tomorrow()

  const viewer = await openAs(browser, ben)
  await viewer.getByRole('button', { name: 'Neuer Termin', exact: true }).click()
  const form = viewer.locator('dialog[open]')
  await form.locator('input[name=title]').fill('Kaffee')
  const field = form.locator('select[name=calendarId]')
  await field.selectOption({ label: 'Anfrage an Anna' })
  await expect(form.getByRole('tab', { name: 'Darstellung' })).toHaveCount(0)
  await form.locator('input[name=startDate]').fill(date)
  await form.locator('input[name=start]').fill('15:00')
  await form.locator('input[name=end]').fill('16:00')
  await form.getByRole('button', { name: 'Anfrage senden' }).click()
  await expect(form).toHaveCount(0)

  await expect
    .poll(async () => (await ownEvents(anna)).map((event) => [event.title, event.request?.status]))
    .toEqual([['Kaffee', 'pending']])
  const [requested] = await ownEvents(anna)

  const owner = await openAs(browser, anna)
  await owner.goto(`/?event=${requested.id}&date=${date}`)
  const decision = owner.locator('dialog[open] .requestDecision')
  await expect(decision).toContainText('Ben hat diesen Termin angefragt.')
  await decision.getByRole('button', { name: 'Annehmen' }).click()
  await expect(owner.locator('dialog[open]')).toHaveCount(0)
  await expect.poll(async () => (await ownEvents(anna))[0].request?.status).toBe('accepted')

  await viewer.goto(`/?event=peer:${shareId}:${requested.id}&date=${date}`)
  const own = viewer.locator('dialog[open]')
  await expect(own).toContainText('Anna hat deine Anfrage angenommen.')
  await own.getByRole('button', { name: 'Anfrage zurückziehen' }).click()
  await expect(own).toHaveCount(0)
  await expect.poll(async () => (await ownEvents(anna)).length).toBe(0)
})
