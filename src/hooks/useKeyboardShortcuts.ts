import { useEffect, useRef } from 'react'
import { useRootElement } from '../context/RootElementContext.ts'

export type Shortcuts = Partial<Record<string, () => void>>

let lastUsedRoot: HTMLElement | null = null
let wasUsed = false

const precedes = (a: HTMLElement, b: HTMLElement) =>
  (a.getRootNode() as ShadowRoot).host.compareDocumentPosition((b.getRootNode() as ShadowRoot).host) &
  Node.DOCUMENT_POSITION_FOLLOWING

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"], dialog') !== null)

const isNothingFocused = (target: EventTarget | null) =>
  target === null || target === document.body || target === document.documentElement || target === document

const isVisible = (element: HTMLElement) => {
  const { top, bottom, width, height } = element.getBoundingClientRect()
  return width > 0 && height > 0 && bottom > 0 && top < window.innerHeight
}

const getInnerTarget = (event: KeyboardEvent) => event.composedPath()[0] ?? null

export const toShortcutKey = (event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'>) => {
  if (event.altKey) return null
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  return event.ctrlKey || event.metaKey ? `mod+${key}` : key
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  const root = useRootElement()
  const current = useRef(shortcuts)

  useEffect(() => {
    current.current = shortcuts
  })

  useEffect(() => {
    if (!lastUsedRoot || (!wasUsed && precedes(root, lastUsedRoot))) lastUsedRoot = root
    const markUsed = () => {
      lastUsedRoot = root
      wasUsed = true
    }
    root.addEventListener('pointerdown', markUsed)
    root.addEventListener('focusin', markUsed)
    return () => {
      root.removeEventListener('pointerdown', markUsed)
      root.removeEventListener('focusin', markUsed)
      if (lastUsedRoot === root) lastUsedRoot = null
    }
  }, [root])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      const key = toShortcutKey(event)
      const action = key === null ? undefined : current.current[key]
      if (!action) return

      const target = getInnerTarget(event)
      const isInside = event.composedPath().includes(root)
      if (isInside) {
        if (isEditableTarget(target)) return
      } else if (!isNothingFocused(target) || lastUsedRoot !== root || !isVisible(root)) return

      event.preventDefault()
      action()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [root])
}
