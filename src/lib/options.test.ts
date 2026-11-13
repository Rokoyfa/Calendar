import { describe, expect, it } from 'vitest'
import jsonExample from '../../demo/calendar.config.jsonc?raw'
import yamlExample from '../../demo/calendar.config.yaml?raw'
import schema from '../../schema/calendar-config.schema.json'
import { toFeatureVariable } from '../config/parseEnv.ts'
import { nearestView } from '../utils/calendarView.ts'
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
    expect(yaml.options).toMatchObject({ storageMode: 'local', apiBaseUrl: '/api', apiTimeoutMs: 10_000 })
  })

  it('show every option, also the commented ones', async () => {
    const yaml = await parseConfigText(uncomment(yamlExample), 'yaml')
    expect(yaml.issues).toEqual([])
    expect(Object.keys(yaml.options).sort()).toEqual(OPTION_NAMES.filter((name) => name !== 'messages').sort())
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
