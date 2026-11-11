import { useEffect } from 'react'
import { useRootElement } from '../context/RootElementContext.ts'

type ArrowKeyNavigationOptions = {
  onPrevious: () => void
  onNext: () => void
}

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

export function useArrowKeyNavigation({ onPrevious, onNext }: ArrowKeyNavigationOptions) {
  const root = useRootElement()

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
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const action = event.key === 'ArrowLeft' ? onPrevious : event.key === 'ArrowRight' ? onNext : null
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
  }, [root, onPrevious, onNext])
}
