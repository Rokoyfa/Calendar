import { parseCalendarOptions, type ParsedOptions } from './options.ts'

const YAML_PATH = /\.ya?ml$/i
const JSON_PATH = /\.jsonc?$/i
const JSON_TOKEN = /"(?:\\.|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g

export type ConfigFormat = 'json' | 'yaml'

export const getConfigFormat = (url: string, contentType: string | null): ConfigFormat => {
  const path = url.split(/[?#]/)[0]
  if (YAML_PATH.test(path)) return 'yaml'
  if (JSON_PATH.test(path)) return 'json'
  return contentType?.toLowerCase().includes('json') ? 'json' : 'yaml'
}

export const stripJsonComments = (source: string) =>
  source.replace(JSON_TOKEN, (token) => (token.startsWith('"') ? token : ''))

export async function parseConfigText(source: string, format: ConfigFormat): Promise<ParsedOptions> {
  const value: unknown =
    format === 'json' ? JSON.parse(stripJsonComments(source)) : (await import('yaml')).parse(source)
  return parseCalendarOptions(value)
}

export async function loadConfigFile(url: string, signal?: AbortSignal): Promise<ParsedOptions> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json, application/yaml, text/yaml, */*' },
  })
  if (!response.ok) throw new Error(`The configuration file answered with status ${response.status}.`)
  return parseConfigText(await response.text(), getConfigFormat(url, response.headers.get('content-type')))
}
