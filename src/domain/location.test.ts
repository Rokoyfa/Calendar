import { describe, expect, it } from 'vitest'
import { getLocationUrl, isMapUrlTemplate } from './location.ts'

describe('location', () => {
  it('builds map links and keeps web addresses', () => {
    expect(getLocationUrl(' Buschkamp 2, 25365 Sparrieshoop ')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Buschkamp%202%2C%2025365%20Sparrieshoop',
    )
    expect(getLocationUrl('https://meet.example.com/abc')).toBe('https://meet.example.com/abc')
    expect(getLocationUrl('Halle', 'https://www.openstreetmap.org/search?query={query}')).toBe(
      'https://www.openstreetmap.org/search?query=Halle',
    )
    expect(getLocationUrl('  ')).toBeNull()
  })

  it('accepts only web templates with a placeholder', () => {
    expect(isMapUrlTemplate('https://maps.apple.com/?q={query}')).toBe(true)
    expect(isMapUrlTemplate('https://maps.apple.com/')).toBe(false)
    expect(isMapUrlTemplate('javascript:alert({query})')).toBe(false)
  })
})
