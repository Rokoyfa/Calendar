import { useState, type RefObject } from 'react'
import type { HourSlot } from '../../../utils/event.ts'
import { findSlotAt, getSlotFromTarget, isSameSlot, toSlotRange, type SlotRange, type SlotSelection } from '../utils/slotSelection.ts'
import { usePressDrag } from './usePressDrag.ts'

const DELAY = { mouse: 0, touch: 350 }

type SlotPress = { anchor: HourSlot; current: HourSlot }

export function useSlotSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onSelect: (range: SlotRange) => void,
) {
  const [selection, setSelection] = useState<SlotSelection | null>(null)

  usePressDrag<SlotPress>({
    containerRef,
    enabled,
    delay: DELAY,
    start: (target) => {
      const slot = getSlotFromTarget(target)
      return slot && { anchor: slot, current: slot }
    },
    activate: (press) => setSelection({ ...press }),
    move: (press, { x, y }) => {
      const scope = containerRef.current?.getRootNode() as Document | ShadowRoot | undefined
      const slot = scope && findSlotAt(scope, x, y)
      if (!slot || isSameSlot(slot, press.current)) return
      press.current = slot
      setSelection({ ...press })
    },
    finish: (press, commit, wasActive) => {
      if (!wasActive) return
      setSelection(null)
      if (commit) onSelect(toSlotRange(press))
    },
  })

  return selection
}
