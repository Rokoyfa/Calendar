import { api, createTeamCalendar, createUser, expect, test } from './helpers.ts'

const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt']
const WIDTHS = [320, 390, 1100, 1440, 1920]
const VIEWS = ['week', 'day', 'tasks']

const measure = `(() => {
  const root = document.querySelector('#root > div')?.shadowRoot ?? document
  const rect = (selector) => root.querySelector(selector)?.getBoundingClientRect()
  const header = rect('.header')
  const title = rect('.headerTitleButton') ?? rect('.headerTitleText')
  const badge = rect('.activeCalendarButton') ?? rect('.activeCalendar')
  const views = root.querySelector('.headerActions .segmentedControl')
  const subtitle = rect('.headerSubtitle')
  const middle = header.left + header.width / 2
  return {
    title: Math.abs(Math.round(title.left + title.width / 2 - middle)),
    badge: Math.abs(Math.round(badge.left + badge.width / 2 - middle)),
    viewsOverflow: views.scrollWidth - views.clientWidth,
    subtitleInside: !subtitle || (subtitle.right <= header.right && subtitle.left >= header.left),
  }
})()`

test('centers the title and fits the view switcher in every language and width', async ({ browser }) => {
  test.setTimeout(240_000)
  const user = await createUser('Anna')
  await createTeamCalendar(user, 'Verein')
  const [name, value] = user.cookie.split('=')
  for (const language of LANGUAGES) {
    await api(user, 'PATCH', '/preferences', { locale: language })
    const context = await browser.newContext({ viewport: { width: 1920, height: 800 } })
    await context.addCookies([{ name, value, domain: 'localhost', path: '/' }])
    const page = await context.newPage()
    await page.goto('/e2e/harness/features.html?features=auth,teams,shortcuts,tasks,notifications')
    for (const view of VIEWS) {
      await page.setViewportSize({ width: 1920, height: 800 })
      await page.locator(`.segment[data-value="${view}"]`).click()
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 })
        await expect
          .poll(() => page.evaluate(measure), { message: `${language} ${view} ${width}` })
          .toEqual({ title: 0, badge: 0, viewsOverflow: 0, subtitleInside: true })
      }
    }
    await context.close()
  }
})
