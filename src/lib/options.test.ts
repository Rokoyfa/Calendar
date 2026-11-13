import { describe, expect, it } from 'vitest'
import jsonExample from '../../demo/calendar.config.jsonc?raw'
import yamlExample from '../../demo/calendar.config.yaml?raw'
import schema from '../../schema/calendar-config.schema.json'
import { toFeatureVariable } from '../config/parseEnv.ts'
import { nearestView } from '../utils/calendarView.ts'
import { HostBridge } from '../context/HostBridge.ts'
import { getAppearanceVariables, getReadableTextColor } from './appearance.ts'
import { createCalendarHandle } from './handle.ts'
import { getConfigFormat, parseConfigText, stripJsonComments } from './configFile.ts'
import { DEFAULT_FEATURES, FEATURE_NAMES, resolveFeatures, resolveViews } from './defaults.ts'
import { mergeCalendarOptions, OPTION_NAMES, parseCalendarOptions } from './options.ts'

describe('parseCalendarOptions', () => {
  it('keeps valid options', () => {
    const { options, issues } = parseCalendarOptions({
      storageMode: 'remote',
      apiBaseUrl: ' /api ',
      apiTimeoutMs: 5000,
      features: { chat: false, auth: true },
      views: ['week', 'month'],
      linkParam: false,
      theme: 'dark',
    })
    expect(issues).toEqual([])
    expect(options).toEqual({
      storageMode: 'remote',
      apiBaseUrl: '/api',
      apiTimeoutMs: 5000,
      features: { chat: false, auth: true },
      views: ['week', 'month'],
      linkParam: false,
      theme: 'dark',
    })
  })

  it('reports and drops invalid values', () => {
    const { options, issues } = parseCalendarOptions({
      storageMode: 'cloud',
      apiTimeoutMs: '5000',
      features: { chat: 'no', unknown: true, search: false },
      views: ['week', 'decade'],
      colour: 'red',
      $schema: './schema.json',
      locale: null,
    })
    expect(options).toEqual({ features: { search: false } })
    expect(issues).toHaveLength(6)
    expect(issues.join(' ')).toContain('"colour"')
  })

  it('rejects anything that is not an object', () => {
    expect(parseCalendarOptions([]).issues).toHaveLength(1)
    expect(parseCalendarOptions('text').options).toEqual({})
  })
})

describe('mergeCalendarOptions', () => {
  it('lets direct options win and merges features one by one', () => {
    const merged = mergeCalendarOptions(
      { locale: 'de', theme: 'dark', features: { chat: false, search: false } },
      {
        locale: 'en',
        theme: undefined,
        features: { search: true, undo: undefined },
      },
    )
    expect(merged).toEqual({
      locale: 'en',
      theme: 'dark',
      features: { chat: false, search: true },
    })
  })
})

describe('features and views', () => {
  it('fills in defaults', () => {
    expect(resolveFeatures()).toEqual(DEFAULT_FEATURES)
    expect(resolveFeatures({ search: false }).search).toBe(false)
  })

  it('turns team features off without teams', () => {
    const features = resolveFeatures({ teams: false, chat: true })
    expect(features.chat).toBe(false)
    expect(features.attendees).toBe(false)
  })

  it('keeps the views in their fixed order', () => {
    expect(resolveViews(['month', 'day'])).toEqual(['day', 'month'])
    expect(resolveViews([])).toEqual(['day', 'week', 'month', 'year'])
    expect(resolveViews(undefined)).toHaveLength(4)
  })

  it('finds the closest enabled view', () => {
    expect(nearestView('day', ['week', 'month'])).toBe('week')
    expect(nearestView('year', ['day', 'week'])).toBe('week')
    expect(nearestView('month', ['month'])).toBe('month')
  })

  it('names environment variables after features', () => {
    expect(toFeatureVariable('chat')).toBe('VITE_FEATURE_CHAT')
    expect(toFeatureVariable('emailNotifications')).toBe('VITE_FEATURE_EMAIL_NOTIFICATIONS')
  })
})

describe('configuration files', () => {
  it('detects the format', () => {
    expect(getConfigFormat('/calendar.yaml?v=2', null)).toBe('yaml')
    expect(getConfigFormat('/calendar.yml', 'application/json')).toBe('yaml')
    expect(getConfigFormat('/calendar.json#top', null)).toBe('json')
    expect(getConfigFormat('/calendar.config.jsonc', 'text/plain')).toBe('json')
    expect(getConfigFormat('/api/config', 'application/json; charset=utf-8')).toBe('json')
    expect(getConfigFormat('/api/config', 'text/plain')).toBe('yaml')
  })

  it('reads JSON and YAML alike', async () => {
    const expected = {
      storageMode: 'remote',
      features: { chat: false },
      views: ['week', 'month'],
    }
    const json = await parseConfigText(JSON.stringify(expected), 'json')
    const yaml = await parseConfigText(
      'storageMode: remote\nfeatures:\n  chat: false\nviews:\n  - week\n  - month\n',
      'yaml',
    )
    expect(json.options).toEqual(expected)
    expect(yaml.options).toEqual(expected)
    expect(yaml.issues).toEqual([])
  })

  it('allows comments in JSON', async () => {
    const source = `{
      // where events are stored
      "storageMode": "remote", /* block
      comment */
      "mapUrl": "https://maps.example/?q={query}//x", // keeps slashes inside texts
      "basename": "/a/*b*/c"
    }`
    expect(JSON.parse(stripJsonComments(source))).toEqual({
      storageMode: 'remote',
      mapUrl: 'https://maps.example/?q={query}//x',
      basename: '/a/*b*/c',
    })
    expect((await parseConfigText(source, 'json')).issues).toEqual([])
  })

  it('fails on broken JSON', async () => {
    await expect(parseConfigText('{', 'json')).rejects.toThrow()
  })
})

describe('example files', () => {
  const uncomment = (source: string) => source.replace(/^# (?=[a-z][a-zA-Z]*: )/gm, '')

  it('are valid, state the defaults and agree with each other', async () => {
    const yaml = await parseConfigText(yamlExample, 'yaml')
    const json = await parseConfigText(jsonExample, 'json')
    expect(yaml.issues).toEqual([])
    expect(json.issues).toEqual([])
    expect(json.options).toEqual(yaml.options)
    expect(yaml.options.features).toEqual(DEFAULT_FEATURES)
    expect(yaml.options).toMatchObject({
      storageMode: 'local',
      apiBaseUrl: '/api',
      apiTimeoutMs: 10_000,
      readOnly: false,
    })
  })

  it('show every option, also the commented ones', async () => {
    const yaml = await parseConfigText(uncomment(yamlExample), 'yaml')
    expect(yaml.issues).toEqual([])
    const withoutBlocks = OPTION_NAMES.filter((name) => name !== 'messages' && name !== 'appearance')
    expect(Object.keys(yaml.options).sort()).toEqual(withoutBlocks.sort())
  })
})

describe('JSON schema', () => {
  it('lists every option and feature', () => {
    const names = Object.keys(schema.properties).filter((name) => name !== '$schema')
    expect(names.sort()).toEqual([...OPTION_NAMES].sort())
    expect(Object.keys(schema.properties.features.properties).sort()).toEqual([...FEATURE_NAMES].sort())
  })

  it('states the feature defaults', () => {
    for (const name of FEATURE_NAMES)
      expect(schema.properties.features.properties[name].default).toBe(DEFAULT_FEATURES[name])
  })
})

describe('appearance and read-only', () => {
  it('accepts valid appearance values and reports the rest', () => {
    const { options, issues } = parseCalendarOptions({
      readOnly: true,
      appearance: {
        accentColor: ' #e63946 ',
        fontFamily: 'Inter, sans-serif',
        radius: 0,
        density: 'compact',
        shadow: 1,
      },
    })
    expect(options).toEqual({
      readOnly: true,
      appearance: { accentColor: '#e63946', fontFamily: 'Inter, sans-serif', radius: 0, density: 'compact' },
    })
    expect(issues).toHaveLength(1)
  })

  it('rejects values that could carry other CSS', () => {
    const { options, issues } = parseCalendarOptions({
      appearance: { accentColor: 'red; background: url(x)', fontFamily: 'a; } * { color: red', radius: 99 },
    })
    expect(options.appearance).toEqual({})
    expect(issues).toHaveLength(3)
  })

  it('merges appearance value by value', () => {
    const merged = mergeCalendarOptions(
      { appearance: { accentColor: '#111111', radius: 4 } },
      { appearance: { radius: 0, fontFamily: undefined } },
    )
    expect(merged.appearance).toEqual({ accentColor: '#111111', radius: 0 })
  })

  it('turns appearance into CSS variables with readable text', () => {
    expect(getAppearanceVariables({ accentColor: '#ffe066', radius: 6, fontFamily: 'Inter' })).toEqual({
      '--calendar-accent': '#ffe066',
      '--calendar-on-accent': '#222222',
      '--calendar-radius': '6px',
      '--calendar-font': 'Inter',
    })
    expect(getReadableTextColor('#1d3557')).toBe('#ffffff')
    expect(getReadableTextColor('#fff')).toBe('#222222')
    expect(getReadableTextColor('rebeccapurple')).toBeNull()
    expect(getAppearanceVariables({ accentColor: 'javascript:1' })).toEqual({})
  })
})

describe('host handle', () => {
  const state = { view: 'week' as const, date: '2026-03-04', from: '2026-03-02', to: '2026-03-08' }

  it('answers false while no calendar is shown', () => {
    const handle = createCalendarHandle(new HostBridge())
    expect(handle.getState()).toBeNull()
    expect(handle.next()).toBe(false)
    expect(handle.goToDate('2026-03-04')).toBe(false)
  })

  it('checks its arguments and passes them on', () => {
    const bridge = new HostBridge()
    const calls: unknown[] = []
    const detach = bridge.attach(() => ({
      getState: () => state,
      goToDate: (date) => calls.push(['goToDate', date]),
      setView: (view) => view !== 'year',
      next: () => calls.push('next'),
      previous: () => calls.push('previous'),
      today: () => calls.push('today'),
      openEvent: (id, date) => calls.push(['openEvent', id, date]),
      createEvent: () => false,
      refresh: () => calls.push('refresh'),
    }))
    const handle = createCalendarHandle(bridge)
    expect(handle.getState()).toEqual(state)
    expect(handle.goToDate(new Date(2026, 2, 4))).toBe(true)
    expect(handle.goToDate('04.03.2026')).toBe(false)
    expect(handle.openEvent('e1', '2026-03-05')).toBe(true)
    expect(handle.openEvent('', '2026-03-05')).toBe(false)
    expect(handle.setView('month')).toBe(true)
    expect(handle.setView('year')).toBe(false)
    expect(handle.createEvent()).toBe(false)
    expect(handle.refresh()).toBe(true)
    expect(calls).toEqual([['goToDate', '2026-03-04'], ['openEvent', 'e1', '2026-03-05'], 'refresh'])
    detach()
    expect(handle.next()).toBe(false)
  })

  it('reports a view change once', () => {
    const bridge = new HostBridge()
    const seen: unknown[] = []
    bridge.listen((reported) => seen.push(reported))
    bridge.report(state)
    bridge.report({ ...state })
    bridge.report({ ...state, view: 'month' })
    expect(seen).toHaveLength(2)
  })
})
