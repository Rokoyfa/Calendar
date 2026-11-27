const LOCAL_PREFIX = 'calendar.'

export const LOCAL_EXPORT_FORMAT = 'calendar-browser-export'

type ReadableStorage = Pick<Storage, 'length' | 'key' | 'getItem'>

const readValue = (raw: string | null) => {
  if (raw === null) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return raw
  }
}

export const collectLocalData = (storage: ReadableStorage, exportedAt = new Date()) => {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(LOCAL_PREFIX)) keys.push(key)
  }
  return {
    format: LOCAL_EXPORT_FORMAT,
    version: 1,
    exportedAt: exportedAt.toISOString(),
    data: Object.fromEntries(keys.sort().map((key) => [key, readValue(storage.getItem(key))])),
  }
}

export const toJsonBlob = (value: unknown) => new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })

export const exportFileName = (date: string) => `calendar-export-${date}.json`
