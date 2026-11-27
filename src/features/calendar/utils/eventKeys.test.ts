import { describe, expect, it } from 'vitest'
import { getEventKeyAction } from './eventKeys.ts'

const actions = { open: () => 'open', duplicate: () => 'duplicate', remove: () => 'remove' }
const press = (key: string, modifiers: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) =>
  getEventKeyAction({ key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...modifiers }, actions)?.()

describe('getEventKeyAction', () => {
  it('opens with E, deletes with Delete or Backspace and duplicates with Ctrl or Cmd+D', () => {
    expect(press('e')).toBe('open')
    expect(press('E')).toBe('open')
    expect(press('Delete')).toBe('remove')
    expect(press('Backspace')).toBe('remove')
    expect(press('d', { ctrlKey: true })).toBe('duplicate')
    expect(press('d', { metaKey: true })).toBe('duplicate')
  })

  it('ignores other keys and modifier combinations', () => {
    expect(press('d')).toBeUndefined()
    expect(press('e', { ctrlKey: true })).toBeUndefined()
    expect(press('e', { altKey: true })).toBeUndefined()
    expect(press('Delete', { shiftKey: true })).toBeUndefined()
    expect(press('x')).toBeUndefined()
  })

  it('leaves out actions that are not allowed', () => {
    expect(
      getEventKeyAction({ key: 'Delete', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, {}),
    ).toBeUndefined()
  })
})
