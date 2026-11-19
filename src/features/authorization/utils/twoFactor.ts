const CODE_PATTERN = /^\d{6}$/
const RECOVERY_CODE_MIN_LENGTH = 8
const RECOVERY_CODE_MAX_LENGTH = 32

export const normalizeTwoFactorCode = (value: string) => value.replace(/[\s-]/g, '')

export const isTwoFactorCode = (value: string) => CODE_PATTERN.test(normalizeTwoFactorCode(value))

export const normalizeRecoveryCode = (value: string) => value.trim().toLowerCase()

export const isRecoveryCode = (value: string) => {
  const length = normalizeRecoveryCode(value).replace(/[^0-9a-z]/g, '').length
  return length >= RECOVERY_CODE_MIN_LENGTH && length <= RECOVERY_CODE_MAX_LENGTH
}

export const formatSecret = (secret: string) => secret.replace(/(.{4})/g, '$1 ').trim()

export const recoveryCodesFile = (codes: readonly string[], heading: string) =>
  new Blob([`${heading}\n\n${codes.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })

const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
]

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/iPhone|iPad/, 'iOS'],
  [/Android/, 'Android'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux'],
]

export const describeUserAgent = (userAgent: string | null) => {
  if (!userAgent) return null
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1]
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1]
  if (!browser && !system) return null
  return [browser, system].filter(Boolean).join(' · ')
}
