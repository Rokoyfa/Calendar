import { describe, expect, it } from 'vitest'
import { parseEventChange } from './eventChange.ts'

describe('parseEventChange', () => {
  it('reads a changed event', () => {
    expect(
      parseEventChange({ type: 'event.changed', calendarId: 'c', eventId: 'e', version: 3, changedBy: 'u' }),
    ).toEqual({ type: 'event.changed', calendarId: 'c', eventId: 'e', version: 3, changedBy: 'u' })
  })

  it('treats a missing version as a deleted event', () => {
    expect(parseEventChange({ type: 'event.changed', calendarId: 'c', eventId: 'e', version: null })).toMatchObject({
      version: null,
      changedBy: null,
    })
  })

  it('passes connection changes and ignores other messages', () => {
    expect(parseEventChange({ type: 'connected' })).toEqual({ type: 'connected' })
    expect(parseEventChange({ type: 'disconnected' })).toEqual({ type: 'disconnected' })
    expect(parseEventChange({ type: 'message.created' })).toBeNull()
    expect(parseEventChange('event.changed')).toBeNull()
  })
})
