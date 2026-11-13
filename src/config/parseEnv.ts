import {
  DEFAULT_CONFIG,
  FEATURE_NAMES,
  STORAGE_MODES,
  type CalendarConfig,
  type CalendarFeature,
  type StorageMode,
} from '../lib/defaults.ts'
import { isOneOf } from '../utils/object.ts'

const DEFAULT_API_BASE_URL = DEFAULT_CONFIG.apiBaseUrl
const DEFAULT_API_TIMEOUT_MS = DEFAULT_CONFIG.apiTimeoutMs
const TRUE_VALUES = ['true', '1', 'yes', 'on']
const FALSE_VALUES = ['false', '0', 'no', 'off']

type RawEnv = Record<string, string | undefined>

const clean = (value: string | undefined) => value?.trim() || undefined

export type EnvConfig = CalendarConfig & { configUrl?: string }

export const toFeatureVariable = (feature: CalendarFeature) =>
  `VITE_FEATURE_${feature.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`

export function parseEnv(raw: RawEnv): EnvConfig {
  const errors: string[] = []

  const readStorageMode = (): StorageMode => {
    const value = clean(raw.VITE_STORAGE_MODE)?.toLowerCase() ?? 'local'
    if (isOneOf(STORAGE_MODES, value)) return value
    errors.push(`VITE_STORAGE_MODE must be "local" or "remote", but is "${value}".`)
    return 'local'
  }

  const readApiBaseUrl = () => {
    const value = clean(raw.VITE_API_BASE_URL) ?? DEFAULT_API_BASE_URL
    const isRelative = value.startsWith('/')
    const isAbsolute = URL.canParse(value) && /^https?:$/.test(new URL(value).protocol)
    if (isRelative || isAbsolute) return value.replace(/\/+$/, '')
    errors.push(`VITE_API_BASE_URL must start with "/" or "http(s)://", but is "${value}".`)
    return DEFAULT_API_BASE_URL
  }

  const readTimeout = () => {
    const value = clean(raw.VITE_API_TIMEOUT_MS)
    if (value === undefined) return DEFAULT_API_TIMEOUT_MS
    const timeout = Number(value)
    if (Number.isInteger(timeout) && timeout > 0) return timeout
    errors.push(`VITE_API_TIMEOUT_MS must be a positive integer, but is "${value}".`)
    return DEFAULT_API_TIMEOUT_MS
  }

  const readFlag = (name: string, fallback: boolean) => {
    const value = clean(raw[name])?.toLowerCase()
    if (value === undefined) return fallback
    if (FALSE_VALUES.includes(value)) return false
    if (TRUE_VALUES.includes(value)) return true
    errors.push(`${name} must be "true" or "false", but is "${value}".`)
    return fallback
  }

  const env: EnvConfig = {
    configUrl: clean(raw.VITE_CONFIG_URL),
    storageMode: readStorageMode(),
    apiBaseUrl: readApiBaseUrl(),
    apiTimeoutMs: readTimeout(),
    features: Object.fromEntries(
      FEATURE_NAMES.map((feature) => [feature, readFlag(toFeatureVariable(feature), DEFAULT_CONFIG.features[feature])]),
    ) as CalendarConfig['features'],
  }

  if (errors.length > 0) throw new Error(`Invalid environment variables:\n- ${errors.join('\n- ')}`)

  return env
}
