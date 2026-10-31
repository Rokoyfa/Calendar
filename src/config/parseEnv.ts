const STORAGE_MODES = ['local', 'remote'] as const

export type AppStorageMode = (typeof STORAGE_MODES)[number]

export type AppEnv = {
  storageMode: AppStorageMode
  apiBaseUrl: string
  apiTimeoutMs: number
  features: {
    auth: boolean
    teams: boolean
  }
}

const DEFAULT_API_BASE_URL = '/api'
const DEFAULT_API_TIMEOUT_MS = 10_000
const TRUE_VALUES = ['true', '1', 'yes', 'on']
const FALSE_VALUES = ['false', '0', 'no', 'off']

type RawEnv = Record<string, string | undefined>

const clean = (value: string | undefined) => value?.trim() || undefined

export function parseEnv(raw: RawEnv): AppEnv {
  const errors: string[] = []

  const readStorageMode = (): AppStorageMode => {
    const value = clean(raw.VITE_STORAGE_MODE)?.toLowerCase() ?? 'local'
    if (STORAGE_MODES.includes(value as AppStorageMode)) return value as AppStorageMode
    errors.push(`VITE_STORAGE_MODE muss "local" oder "remote" sein, ist aber "${value}".`)
    return 'local'
  }

  const readApiBaseUrl = () => {
    const value = clean(raw.VITE_API_BASE_URL) ?? DEFAULT_API_BASE_URL
    const isRelative = value.startsWith('/')
    const isAbsolute = URL.canParse(value) && /^https?:$/.test(new URL(value).protocol)
    if (isRelative || isAbsolute) return value.replace(/\/+$/, '')
    errors.push(`VITE_API_BASE_URL muss mit "/" oder "http(s)://" beginnen, ist aber "${value}".`)
    return DEFAULT_API_BASE_URL
  }

  const readTimeout = () => {
    const value = clean(raw.VITE_API_TIMEOUT_MS)
    if (value === undefined) return DEFAULT_API_TIMEOUT_MS
    const timeout = Number(value)
    if (Number.isInteger(timeout) && timeout > 0) return timeout
    errors.push(`VITE_API_TIMEOUT_MS muss eine positive ganze Zahl sein, ist aber "${value}".`)
    return DEFAULT_API_TIMEOUT_MS
  }

  const readFlag = (name: 'VITE_FEATURE_AUTH' | 'VITE_FEATURE_TEAMS') => {
    const value = clean(raw[name])?.toLowerCase()
    if (value === undefined || FALSE_VALUES.includes(value)) return false
    if (TRUE_VALUES.includes(value)) return true
    errors.push(`${name} muss "true" oder "false" sein, ist aber "${value}".`)
    return false
  }

  const env: AppEnv = {
    storageMode: readStorageMode(),
    apiBaseUrl: readApiBaseUrl(),
    apiTimeoutMs: readTimeout(),
    features: {
      auth: readFlag('VITE_FEATURE_AUTH'),
      teams: readFlag('VITE_FEATURE_TEAMS'),
    },
  }

  if (errors.length > 0) throw new Error(`Ungültige Umgebungsvariablen:\n- ${errors.join('\n- ')}`)

  return env
}
