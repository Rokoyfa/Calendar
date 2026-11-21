import { describe, expect, it } from 'vitest'
import { removeById, replaceById, upsertById } from './list.ts'

const items = [
  { id: 'a', value: 1 },
  { id: 'b', value: 2 },
]

describe('list helpers', () => {
  it('replaces, inserts and removes by id', () => {
    expect(replaceById(items, { id: 'b', value: 3 })).toEqual([items[0], { id: 'b', value: 3 }])
    expect(replaceById(items, { id: 'c', value: 3 })).toEqual(items)
    expect(upsertById(items, { id: 'c', value: 3 })).toEqual([...items, { id: 'c', value: 3 }])
    expect(upsertById(items, { id: 'a', value: 0 })).toEqual([{ id: 'a', value: 0 }, items[1]])
    expect(removeById(items, 'a')).toEqual([items[1]])
  })
})
