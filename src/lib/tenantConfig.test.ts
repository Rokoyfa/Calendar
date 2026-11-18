import { describe, expect, it } from 'vitest'
import { applyTenantConfig, toTenantOptions } from './tenantConfig.ts'

describe('toTenantOptions', () => {
  it('keeps display settings and features but never backend switches', () => {
    const { options } = toTenantOptions({
      features: { auth: false, attachments: false, registration: false },
      appearance: { accentColor: '#365caf' },
      locale: 'de-DE',
      tenant: 'other',
      apiBaseUrl: 'https://evil.example',
      storageMode: 'local',
    })
    expect(options).toEqual({
      features: { attachments: false, registration: false },
      appearance: { accentColor: '#365caf' },
      locale: 'de-DE',
    })
  })

  it('overrides the settings on the page where it sets something', () => {
    const { options } = toTenantOptions({ features: { attachments: false, trash: false }, locale: 'de-DE' })
    const merged = applyTenantConfig(
      { tenant: 'acme', features: { attachments: true, chat: false }, locale: 'en-GB', readOnly: true },
      options,
    )
    expect(merged.features).toEqual({ attachments: false, trash: false, chat: false, auth: true })
    expect(merged.locale).toBe('de-DE')
    expect(merged.readOnly).toBe(true)
  })

  it('always turns sign-in on and keeps the connection settings of the page', () => {
    const merged = applyTenantConfig(
      { tenant: 'acme', apiBaseUrl: 'https://api.example.com', features: { auth: false } },
      toTenantOptions({ features: { auth: false }, apiBaseUrl: 'https://evil.example' }).options,
    )
    expect(merged.features?.auth).toBe(true)
    expect(merged.apiBaseUrl).toBe('https://api.example.com')
    expect(merged.tenant).toBe('acme')
  })

  it('uses the page settings with sign-in when the backend sends nothing', () => {
    const merged = applyTenantConfig({ tenant: 'acme', locale: 'en-GB' }, null)
    expect(merged.locale).toBe('en-GB')
    expect(merged.features?.auth).toBe(true)
  })

  it('ignores the tenant when the page stores locally', () => {
    const merged = applyTenantConfig({ tenant: 'acme', storageMode: 'local', locale: 'en-GB' }, { locale: 'de-DE' })
    expect(merged.tenant).toBeUndefined()
    expect(merged.locale).toBe('en-GB')
    expect(merged.features?.auth).toBeUndefined()
  })
})
