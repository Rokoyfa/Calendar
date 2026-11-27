export const withShortcut = (label: string, key: string) => `${label} (${key.length === 1 ? key.toUpperCase() : key})`

export const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export const modifierKey = (control: string) => (isApplePlatform() ? '⌘' : control)
