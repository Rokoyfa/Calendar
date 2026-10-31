import { useEffect } from 'react'

type ArrowKeyNavigationOptions = {
  onPrevious: () => void
  onNext: () => void
}

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"], dialog') !== null)

export function useArrowKeyNavigation({ onPrevious, onNext }: ArrowKeyNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isEditableTarget(event.target)) return

      const action = event.key === 'ArrowLeft' ? onPrevious : event.key === 'ArrowRight' ? onNext : null
      if (!action) return
      event.preventDefault()
      action()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext])
}
