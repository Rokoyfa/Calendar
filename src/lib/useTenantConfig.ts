import { useEffect, useState } from 'react'
import { loadTenantConfig } from './tenantConfig.ts'
import type { CalendarOptions } from './options.ts'

const PREFIX = '[calendar]'

type Loaded = { key: string; options: CalendarOptions }

export function useTenantConfig(tenant: string | undefined, apiBaseUrl: string, enabled: boolean) {
  const key = enabled && tenant ? `${apiBaseUrl}\n${tenant}` : null
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (key === null || !tenant) return
    const controller = new AbortController()
    loadTenantConfig(apiBaseUrl, tenant, controller.signal)
      .then(({ options, issues }) => {
        if (issues.length > 0) console.warn(`${PREFIX} Tenant configuration:\n- ${issues.join('\n- ')}`)
        setLoaded({ key, options })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.warn(`${PREFIX} Could not load the tenant configuration, using the page settings only.`, error)
        setLoaded({ key, options: {} })
      })
    return () => controller.abort()
  }, [key, tenant, apiBaseUrl])

  if (key === null) return { status: 'ready' as const, options: null }
  return loaded?.key === key ? { status: 'ready' as const, options: loaded.options } : { status: 'loading' as const }
}
