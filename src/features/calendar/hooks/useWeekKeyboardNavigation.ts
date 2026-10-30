import { useEffect } from 'react'

type WeekKeyboardNavigationOptions = {
  onPreviousWeek: () => void
  onNextWeek: () => void
}

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select, [role="dialog"], dialog') !== null)

export function useWeekKeyboardNavigation({ onPreviousWeek, onNextWeek }: WeekKeyboardNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isEditableTarget(event.target)) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPreviousWeek()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNextWeek()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPreviousWeek, onNextWeek])
}
