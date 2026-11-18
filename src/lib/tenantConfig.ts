import { TENANT_HEADER } from '../data/tenantDataSource.ts'
import { mergeCalendarOptions, parseCalendarOptions, type CalendarOptionName, type CalendarOptions } from './options.ts'

const TENANT_OPTIONS: readonly CalendarOptionName[] = [
  'features',
  'views',
  'locale',
  'messages',
  'theme',
  'initialView',
  'timeZone',
  'holidays',
  'holidaySource',
  'mapUrl',
  'readOnly',
  'appearance',
]

const BACKEND_FEATURES = ['auth'] as const

export const toTenantOptions = (value: unknown) => {
  const parsed = parseCalendarOptions(value)
  const options: Record<string, unknown> = {}
  for (const name of TENANT_OPTIONS) if (parsed.options[name] !== undefined) options[name] = parsed.options[name]
  const features = { ...parsed.options.features }
  for (const name of BACKEND_FEATURES) delete features[name]
  if (options.features) options.features = features
  return { options: options as CalendarOptions, issues: parsed.issues }
}

export const usesTenant = (options: CalendarOptions) => Boolean(options.tenant) && options.storageMode !== 'local'

export const applyTenantConfig = (page: CalendarOptions, tenant: CalendarOptions | null): CalendarOptions => {
  if (!usesTenant(page)) {
    const local = { ...page }
    delete local.tenant
    return local
  }
  const merged = tenant ? mergeCalendarOptions(page, tenant) : page
  return { ...merged, features: { ...merged.features, auth: true } }
}

export const tenantConfigUrl = (apiBaseUrl: string) => `${apiBaseUrl.replace(/\/+$/, '')}/tenant/config`

export async function loadTenantConfig(apiBaseUrl: string, tenant: string, signal?: AbortSignal) {
  const response = await fetch(tenantConfigUrl(apiBaseUrl), {
    headers: { Accept: 'application/json', [TENANT_HEADER]: tenant },
    credentials: 'omit',
    signal,
  })
  if (response.status === 404) return { options: {}, issues: [] }
  if (!response.ok) throw new Error(`The tenant configuration answered ${response.status}.`)
  return toTenantOptions(await response.json())
}
