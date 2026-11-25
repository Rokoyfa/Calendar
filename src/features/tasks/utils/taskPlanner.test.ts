import { describe, expect, it } from 'vitest'
import { findEarliestCompletion, planTask, toPlanMinute, type PlanInterval, type PlanRequest } from './taskPlanner.ts'
import { DEFAULT_WORKING_TIME_LAW, getWorkingTimeLaw } from './workingTimeLaw.ts'

const at = (date: string, time: string) => toPlanMinute(date, time)

const span = (date: string, start: string, end: string, endDate = date): PlanInterval => ({
  start: at(date, start),
  end: at(endDate, end),
})

const request = (fields: Partial<PlanRequest>): PlanRequest => ({
  effortMinutes: 60,
  from: at('2026-11-30', '00:00'),
  deadline: at('2026-12-04', '20:00'),
  busy: [],
  work: [],
  blockedDates: new Set(),
  law: DEFAULT_WORKING_TIME_LAW,
  windowStart: 8 * 60,
  windowEnd: 20 * 60,
  distribution: 'even',
  ...fields,
})

const totalMinutes = (blocks: { minutes: number }[]) => blocks.reduce((sum, block) => sum + block.minutes, 0)

describe('planTask', () => {
  it('plans everything as early as possible', () => {
    const result = planTask(request({ effortMinutes: 120, distribution: 'early' }))
    expect(result.blocks).toEqual([{ date: '2026-11-30', start: '08:00', end: '10:00', minutes: 120 }])
    expect(result.missingMinutes).toBe(0)
  })

  it('plans everything as late as possible before the due date', () => {
    const result = planTask(request({ effortMinutes: 120, distribution: 'late' }))
    expect(result.blocks).toEqual([{ date: '2026-12-04', start: '18:00', end: '20:00', minutes: 120 }])
  })

  it('fills earlier days from the back when the last day is full', () => {
    const result = planTask(request({ effortMinutes: 600, distribution: 'late', deadline: at('2026-12-04', '12:00') }))
    expect(result.blocks).toEqual([
      { date: '2026-12-03', start: '14:00', end: '20:00', minutes: 360 },
      { date: '2026-12-04', start: '08:00', end: '12:00', minutes: 240 },
    ])
    expect(result.missingMinutes).toBe(0)
  })

  it('keeps the rest period before later work when planning late', () => {
    const result = planTask(
      request({
        effortMinutes: 60,
        distribution: 'late',
        deadline: at('2026-12-01', '20:00'),
        work: [span('2026-12-02', '06:00', '10:00')],
      }),
    )
    expect(result.blocks).toEqual([{ date: '2026-12-01', start: '18:00', end: '19:00', minutes: 60 }])
  })

  it('plans as early as possible when planning late without a due date', () => {
    const result = planTask(request({ effortMinutes: 60, deadline: null, distribution: 'late' }))
    expect(result.blocks[0]).toMatchObject({ date: '2026-11-30', start: '08:00' })
  })

  it('spreads the effort evenly until the due date', () => {
    const result = planTask(request({ effortMinutes: 300 }))
    expect(result.blocks.map((block) => block.date)).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
    ])
    expect(result.blocks.every((block) => block.minutes === 60)).toBe(true)
  })

  it('never leaves a block shorter than 30 minutes', () => {
    const result = planTask(request({ effortMinutes: 50 }))
    expect(result.blocks.every((block) => block.minutes >= 30)).toBe(true)
    expect(totalMinutes(result.blocks)).toBe(50)
  })

  it('allows a single short block when the whole effort is short', () => {
    const result = planTask(request({ effortMinutes: 20 }))
    expect(result.blocks).toEqual([{ date: '2026-11-30', start: '08:00', end: '08:20', minutes: 20 }])
  })

  it('skips busy times', () => {
    const result = planTask(
      request({ effortMinutes: 60, distribution: 'early', busy: [span('2026-11-30', '08:00', '12:30')] }),
    )
    expect(result.blocks[0]).toMatchObject({ date: '2026-11-30', start: '12:30', end: '13:30' })
  })

  it('keeps the rest period after late work', () => {
    const result = planTask(
      request({
        effortMinutes: 60,
        distribution: 'early',
        from: at('2026-11-30', '19:00'),
        work: [span('2026-11-30', '19:00', '23:00')],
      }),
    )
    expect(result.blocks[0]).toMatchObject({ date: '2026-12-01', start: '10:00' })
  })

  it('keeps the rest period before early work on the next day', () => {
    const result = planTask(
      request({
        effortMinutes: 60,
        distribution: 'early',
        from: at('2026-11-30', '19:00'),
        deadline: at('2026-12-01', '20:00'),
        work: [span('2026-12-01', '06:00', '14:00')],
      }),
    )
    expect(result.blocks).toEqual([])
    expect(result.missingMinutes).toBe(60)
  })

  it('does not treat other events as work for the rest period', () => {
    const result = planTask(
      request({
        effortMinutes: 60,
        distribution: 'early',
        from: at('2026-11-30', '20:00'),
        busy: [span('2026-11-30', '20:00', '23:30')],
      }),
    )
    expect(result.blocks[0]).toMatchObject({ date: '2026-12-01', start: '08:00' })
  })

  it('respects the daily maximum including existing work', () => {
    const result = planTask(
      request({
        effortMinutes: 240,
        distribution: 'early',
        deadline: at('2026-11-30', '20:00'),
        work: [span('2026-11-30', '08:00', '14:00')],
      }),
    )
    expect(totalMinutes(result.blocks)).toBe(120)
    expect(result.missingMinutes).toBe(120)
  })

  it('never works more than six hours without a break', () => {
    const result = planTask(
      request({
        effortMinutes: 120,
        distribution: 'early',
        deadline: at('2026-11-30', '20:00'),
        work: [span('2026-11-30', '08:00', '13:00')],
      }),
    )
    expect(result.blocks).toEqual([
      { date: '2026-11-30', start: '13:00', end: '14:00', minutes: 60 },
      { date: '2026-11-30', start: '14:30', end: '15:30', minutes: 60 },
    ])
  })

  it('splits long efforts into stretches with breaks', () => {
    const result = planTask(request({ effortMinutes: 480, distribution: 'early', deadline: at('2026-11-30', '20:00') }))
    expect(result.blocks).toEqual([
      { date: '2026-11-30', start: '08:00', end: '14:00', minutes: 360 },
      { date: '2026-11-30', start: '14:30', end: '16:30', minutes: 120 },
    ])
  })

  it('skips the rest day and public holidays', () => {
    const result = planTask(
      request({
        effortMinutes: 60,
        distribution: 'early',
        from: at('2026-12-05', '20:00'),
        deadline: at('2026-12-10', '20:00'),
        blockedDates: new Set(['2026-12-07']),
      }),
    )
    expect(result.blocks[0].date).toBe('2026-12-08')
  })

  it('uses the rest day of the country', () => {
    const law = getWorkingTimeLaw('SA')
    const result = planTask(
      request({
        effortMinutes: 60,
        distribution: 'early',
        law,
        from: at('2026-12-04', '00:00'),
        deadline: at('2026-12-06', '20:00'),
      }),
    )
    expect(result.blocks[0].date).toBe('2026-12-05')
  })

  it('stays inside the planning window and before the deadline', () => {
    const result = planTask(
      request({
        effortMinutes: 120,
        distribution: 'early',
        windowStart: 9 * 60,
        windowEnd: 10 * 60,
        deadline: at('2026-12-01', '09:30'),
      }),
    )
    expect(result.blocks).toEqual([
      { date: '2026-11-30', start: '09:00', end: '10:00', minutes: 60 },
      { date: '2026-12-01', start: '09:00', end: '09:30', minutes: 30 },
    ])
    expect(result.missingMinutes).toBe(30)
  })

  it('starts after now on a 15 minute step', () => {
    const result = planTask(request({ effortMinutes: 30, distribution: 'early', from: at('2026-11-30', '10:07') }))
    expect(result.blocks[0]).toMatchObject({ start: '10:15', end: '10:45' })
  })

  it('respects the weekly maximum', () => {
    const work = ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'].flatMap((date) => [
      span(date, '08:00', '12:00'),
      span(date, '12:30', '16:30'),
    ])
    const result = planTask(
      request({
        effortMinutes: 600,
        distribution: 'early',
        from: at('2026-11-30', '00:00'),
        deadline: at('2026-12-05', '20:00'),
        work,
      }),
    )
    expect(result.blocks.map((block) => block.date)).toEqual(['2026-12-05', '2026-12-05'])
    expect(result.plannedMinutes).toBe(480)
  })

  it('plans as early as possible without a deadline', () => {
    const result = planTask(request({ effortMinutes: 60, deadline: null }))
    expect(result.blocks[0]).toMatchObject({ date: '2026-11-30', start: '08:00' })
  })

  it('finds the earliest day the effort fits', () => {
    const value = request({ effortMinutes: 960, deadline: at('2026-11-30', '20:00') })
    expect(planTask(value).missingMinutes).toBe(480)
    expect(findEarliestCompletion(value)).toBe('2026-12-01')
  })
})
