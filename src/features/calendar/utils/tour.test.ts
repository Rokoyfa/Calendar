import { describe, expect, it } from 'vitest'
import { de } from '../../../i18n/messages/de/index.ts'
import { buildTourSteps, placeTourBubble, unionRect, type TourOptions } from './tour.ts'

const all: TourOptions = { isTouch: false, hasShortcuts: true, canCreateTasks: true, hasTasks: true, hasPlanner: true }
const ids = (options: TourOptions) => buildTourSteps(de.calendar.tour, options).map((step) => step.id)

describe('buildTourSteps', () => {
  it('explains tasks and the planner before the menu and ends without a target', () => {
    const steps = buildTourSteps(de.calendar.tour, all)
    expect(steps.map((step) => step.id)).toEqual([
      'grid',
      'create',
      'navigate',
      'jump',
      'switch',
      'views',
      'tasks',
      'planner',
      'menu',
      'notifications',
      'account',
      'signIn',
      'done',
    ])
    expect(steps.at(-1)?.target).toBeUndefined()
    expect(steps.filter((step) => step.id !== 'done').every((step) => step.target)).toBe(true)
  })

  it('leaves out tasks and the planner when they are not available', () => {
    expect(ids({ ...all, hasTasks: false })).not.toContain('tasks')
    expect(ids({ ...all, hasTasks: false })).not.toContain('planner')
    expect(ids({ ...all, hasPlanner: false })).toContain('tasks')
    expect(ids({ ...all, hasPlanner: false })).not.toContain('planner')
  })

  it('adapts the texts to touch screens, shortcuts and tasks', () => {
    const touch = buildTourSteps(de.calendar.tour, { ...all, isTouch: true })
    const text = (steps: typeof touch, id: string) => steps.find((step) => step.id === id)?.text ?? ''
    expect(text(touch, 'grid')).toBe(de.calendar.tour.steps.grid.touch)
    expect(text(touch, 'navigate')).toContain(de.calendar.tour.steps.navigate.swipe)
    expect(text(touch, 'navigate')).not.toContain(de.calendar.tour.steps.navigate.keys)
    const desktop = buildTourSteps(de.calendar.tour, all)
    expect(text(desktop, 'navigate')).toContain(de.calendar.tour.steps.navigate.keys)
    expect(text(desktop, 'create')).toContain(de.calendar.tour.steps.create.tasks)
    const plain = buildTourSteps(de.calendar.tour, { ...all, hasShortcuts: false, canCreateTasks: false })
    expect(text(plain, 'views')).toBe(de.calendar.tour.steps.views.text)
    expect(text(plain, 'create')).toBe(de.calendar.tour.steps.create.text)
  })
})

describe('unionRect', () => {
  it('spans all elements and is empty without any', () => {
    const element = (left: number, top: number, width: number, height: number) =>
      ({
        getBoundingClientRect: () => ({ left, top, width, height, right: left + width, bottom: top + height }),
      }) as Element
    expect(unionRect([element(10, 20, 30, 30), element(60, 10, 40, 20)])).toEqual({
      left: 10,
      top: 10,
      width: 90,
      height: 40,
    })
    expect(unionRect([])).toBeNull()
  })
})

describe('placeTourBubble', () => {
  const area = { width: 1000, height: 800 }
  const bubble = { width: 300, height: 200 }

  it('puts the bubble below the target, centered and inside the area', () => {
    expect(placeTourBubble({ left: 400, top: 20, width: 200, height: 40 }, bubble, area)).toEqual({
      left: 350,
      top: 72,
    })
    expect(placeTourBubble({ left: 950, top: 20, width: 40, height: 40 }, bubble, area)).toEqual({ left: 688, top: 72 })
  })

  it('puts it above when there is no room below', () => {
    expect(placeTourBubble({ left: 400, top: 700, width: 200, height: 40 }, bubble, area)).toEqual({
      left: 350,
      top: 488,
    })
  })

  it('puts it inside a target that fills the area and centers it without a target', () => {
    expect(placeTourBubble({ left: 0, top: 80, width: 1000, height: 720 }, bubble, area)).toEqual({
      left: 676,
      top: 576,
    })
    expect(placeTourBubble(null, bubble, area)).toEqual({ left: 350, top: 300 })
  })
})
