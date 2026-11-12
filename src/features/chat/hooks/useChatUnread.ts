import { useCallback, useEffect, useRef, useState } from 'react'
import { getChatId, type ChatKey } from '../../../utils/chat.ts'
import type { ChatRepository } from '../../storage/index.ts'

const NO_UNREAD: ReadonlyMap<string, number> = new Map()

const without = (counts: ReadonlyMap<string, number>, id: string) => {
  if (!counts.has(id)) return counts
  const next = new Map(counts)
  next.delete(id)
  return next
}

export function useChatUnread(repository: ChatRepository, calendarIds: readonly string[], currentUserId: string) {
  const [counts, setCounts] = useState(NO_UNREAD)
  const openChats = useRef(new Set<string>())
  const calendarKey = calendarIds.join(',')

  const refresh = useCallback(async () => {
    if (!calendarKey) return
    try {
      const unread = await repository.unread(calendarKey.split(','))
      setCounts(
        new Map(
          unread.map((entry) => [getChatId(entry), entry.count] as const).filter(([id]) => !openChats.current.has(id)),
        ),
      )
    } catch {
      return
    }
  }, [repository, calendarKey])

  useEffect(() => {
    void refresh()
    const handleFocus = () => void refresh()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  useEffect(
    () =>
      repository.subscribe((event) => {
        if (event.type === 'connected' || event.type === 'message.deleted') void refresh()
        if (event.type !== 'message.created') return
        const { message } = event
        const id = getChatId(message)
        if (!calendarKey.split(',').includes(message.calendarId)) return
        if (message.author?.id === currentUserId || openChats.current.has(id)) return
        setCounts((current) => new Map(current).set(id, (current.get(id) ?? 0) + 1))
      }),
    [repository, refresh, calendarKey, currentUserId],
  )

  const markOpen = useCallback((key: ChatKey) => {
    const id = getChatId(key)
    openChats.current.add(id)
    setCounts((current) => without(current, id))
  }, [])

  const markClosed = useCallback((key: ChatKey) => {
    openChats.current.delete(getChatId(key))
  }, [])

  return { unread: calendarKey ? counts : NO_UNREAD, markOpen, markClosed }
}
