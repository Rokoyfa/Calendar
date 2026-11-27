import type { Messages } from '../../../i18n/index.ts'

const tourKey = (scope: string) => `calendar.tourSeen.v1.${scope}`

export const readTourSeen = (scope: string) => {
  try {
    return localStorage.getItem(tourKey(scope)) === 'true'
  } catch {
    return false
  }
}

export const writeTourSeen = (scope: string) => {
  try {
    localStorage.setItem(tourKey(scope), 'true')
  } catch {
    return
  }
}

export const TOUR_TARGETS = {
  grid: 'main.main',
  create: '.headerCreate > .iconButton',
  navigate: '.headerNav > .iconButton, .headerNav > .todayButton',
  jump: '.headerTitleButton',
  switch: '.activeCalendarButton',
  views: '.headerActions .segmentedControl',
  tasks: '.headerActions .segment[data-value="tasks"]',
  planner: '.headerActions .segment[data-value="tasks"]',
  menu: '.headerNav .filterButton',
  notifications: '.notificationButton',
  account: '.accountButton',
  signIn: '.accountLogin',
} as const

export type TourStepId = keyof typeof TOUR_TARGETS | 'done'

export type TourStep = { id: TourStepId; target?: string; title: string; text: string }

export type TourOptions = {
  isTouch: boolean
  hasShortcuts: boolean
  canCreateTasks: boolean
  hasTasks: boolean
  hasPlanner: boolean
}

const join = (...parts: (string | false)[]) => parts.filter(Boolean).join(' ')

export const buildTourSteps = (tour: Messages['calendar']['tour'], options: TourOptions): TourStep[] => {
  const { steps } = tour
  const keys = options.hasShortcuts && !options.isTouch
  const step = (id: Exclude<TourStepId, 'done'>, title: string, text: string): TourStep => ({
    id,
    target: TOUR_TARGETS[id],
    title,
    text,
  })
  const candidates: (TourStep | false)[] = [
    step('grid', steps.grid.title, options.isTouch ? steps.grid.touch : steps.grid.text),
    step('create', steps.create.title, join(steps.create.text, options.canCreateTasks && steps.create.tasks)),
    step(
      'navigate',
      steps.navigate.title,
      join(steps.navigate.text, options.isTouch && steps.navigate.swipe, keys && steps.navigate.keys),
    ),
    step('jump', steps.jump.title, steps.jump.text),
    step('switch', steps.switch.title, steps.switch.text),
    step('views', steps.views.title, join(steps.views.text, keys && steps.views.keys)),
    options.hasTasks && step('tasks', steps.tasks.title, steps.tasks.text),
    options.hasTasks && options.hasPlanner && step('planner', steps.planner.title, steps.planner.text),
    step('menu', steps.menu.title, steps.menu.text),
    step('notifications', steps.notifications.title, steps.notifications.text),
    step('account', steps.account.title, steps.account.text),
    step('signIn', steps.signIn.title, steps.signIn.text),
    { id: 'done', title: steps.done.title, text: steps.done.text },
  ]
  return candidates.filter((candidate): candidate is TourStep => candidate !== false)
}

export type TourRect = { left: number; top: number; width: number; height: number }

export const findTourTargets = (root: Document | ShadowRoot, selector: string) =>
  [...root.querySelectorAll<HTMLElement>(selector)].filter((element) => {
    const { width, height } = element.getBoundingClientRect()
    return width > 0 && height > 0
  })

export const unionRect = (elements: readonly Element[]): TourRect | null => {
  if (elements.length === 0) return null
  const rects = elements.map((element) => element.getBoundingClientRect())
  const left = Math.min(...rects.map((rect) => rect.left))
  const top = Math.min(...rects.map((rect) => rect.top))
  const right = Math.max(...rects.map((rect) => rect.right))
  const bottom = Math.max(...rects.map((rect) => rect.bottom))
  return { left, top, width: right - left, height: bottom - top }
}

const GAP_PX = 12
const EDGE_PX = 12

export const placeTourBubble = (
  target: TourRect | null,
  bubble: { width: number; height: number },
  area: { width: number; height: number },
) => {
  const clampLeft = (left: number) => Math.max(EDGE_PX, Math.min(left, area.width - bubble.width - EDGE_PX))
  const clampTop = (top: number) => Math.max(EDGE_PX, Math.min(top, area.height - bubble.height - EDGE_PX))
  if (!target)
    return { left: clampLeft((area.width - bubble.width) / 2), top: clampTop((area.height - bubble.height) / 2) }
  const centered = clampLeft(target.left + target.width / 2 - bubble.width / 2)
  const below = target.top + target.height + GAP_PX
  if (below + bubble.height <= area.height - EDGE_PX) return { left: centered, top: below }
  const above = target.top - GAP_PX - bubble.height
  if (above >= EDGE_PX) return { left: centered, top: above }
  const bottom = Math.min(target.top + target.height, area.height)
  return {
    left: clampLeft(target.left + target.width - bubble.width - GAP_PX * 2),
    top: clampTop(bottom - bubble.height - GAP_PX * 2),
  }
}
