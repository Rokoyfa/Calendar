type EventKeyActions = {
  open?: () => void
  duplicate?: () => void
  remove?: () => void
}

export const EVENT_ACTION_KEYS = 'E Delete Backspace Control+D Meta+D'

export const getEventKeyAction = (
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>,
  actions: EventKeyActions,
) => {
  if (event.altKey || event.shiftKey) return undefined
  const key = event.key.toLowerCase()
  const withModifier = event.ctrlKey || event.metaKey
  if (withModifier) return key === 'd' ? actions.duplicate : undefined
  if (key === 'e') return actions.open
  if (event.key === 'Delete' || event.key === 'Backspace') return actions.remove
  return undefined
}
