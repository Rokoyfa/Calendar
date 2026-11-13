import { useEffect, useMemo, useState } from 'react'
import { loadConfigFile } from './configFile.ts'
import { parseCalendarOptions, type CalendarOptions, type ParsedOptions } from './options.ts'

export type CalendarConfigSource = string | CalendarOptions

type LoadedConfig = { url: string; options: CalendarOptions | null }

export type ConfigState = { status: 'ready'; options: CalendarOptions } | { status: 'loading' } | { status: 'error' }

const NO_OPTIONS: CalendarOptions = {}
const PREFIX = '[calendar]'

const report = (source: string, { issues }: ParsedOptions) => {
  if (issues.length > 0) console.warn(`${PREFIX} Configuration ${source}:\n- ${issues.join('\n- ')}`)
}

export function useCalendarOptions(config: CalendarConfigSource | undefined): ConfigState {
  const url = typeof config === 'string' ? config : null
  const inlineKey = config && typeof config === 'object' ? JSON.stringify(config) : null
  const [loaded, setLoaded] = useState<LoadedConfig | null>(null)

  const inline = useMemo(() => {
    if (inlineKey === null) return NO_OPTIONS
    const parsed = parseCalendarOptions(JSON.parse(inlineKey))
    report('object', parsed)
    return parsed.options
  }, [inlineKey])

  useEffect(() => {
    if (url === null) return
    const controller = new AbortController()
    loadConfigFile(url, controller.signal)
      .then((parsed) => {
        report(url, parsed)
        setLoaded({ url, options: parsed.options })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error(`${PREFIX} Could not load the configuration from ${url}.`, error)
        setLoaded({ url, options: null })
      })
    return () => controller.abort()
  }, [url])

  return useMemo<ConfigState>(() => {
    if (url === null) return { status: 'ready', options: inline }
    if (loaded?.url !== url) return { status: 'loading' }
    return loaded.options ? { status: 'ready', options: loaded.options } : { status: 'error' }
  }, [url, inline, loaded])
}
