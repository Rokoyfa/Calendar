import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import { isSameChat, type ChatKey, type ChatMessage } from '../../../utils/chat.ts'
import type { ChatRepository } from '../../storage/index.ts'

const READ_DELAY_MS = 500

type ChatState = {
  messages: ChatMessage[]
  hasMore: boolean
  isLoading: boolean
  isOffline: boolean
  error: string | null
}

const INITIAL: ChatState = { messages: [], hasMore: false, isLoading: true, isOffline: false, error: null }

const mergeMessages = (current: readonly ChatMessage[], incoming: readonly ChatMessage[]) => {
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function useChatMessages(repository: ChatRepository, chatKey: ChatKey, isActive: boolean) {
  const { m } = useI18n()
  const [state, setState] = useState(INITIAL)
  const { eventId, occurrenceDate } = chatKey
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(isActive)

  const markRead = useCallback(() => {
    if (!activeRef.current) return
    if (readTimer.current) clearTimeout(readTimer.current)
    readTimer.current = setTimeout(() => {
      repository.markRead({ eventId, occurrenceDate }).catch(() => undefined)
    }, READ_DELAY_MS)
  }, [repository, eventId, occurrenceDate])

  const loadLatest = useCallback(async () => {
    try {
      const page = await repository.list({ eventId, occurrenceDate })
      setState((current) => ({
        ...current,
        messages: mergeMessages(current.messages, page.messages),
        hasMore: current.messages.length === 0 ? page.hasMore : current.hasMore,
        isLoading: false,
        error: null,
      }))
      markRead()
    } catch (error) {
      setState((current) => ({ ...current, isLoading: false, error: getErrorMessage(error, m) }))
    }
  }, [repository, eventId, occurrenceDate, markRead, m])

  useEffect(() => {
    activeRef.current = isActive
    if (isActive) markRead()
  }, [isActive, markRead])

  useEffect(() => {
    void loadLatest()
    return () => {
      if (readTimer.current) clearTimeout(readTimer.current)
    }
  }, [loadLatest])

  useEffect(
    () =>
      repository.subscribe((event) => {
        if (event.type === 'connected') {
          setState((current) => ({ ...current, isOffline: false }))
          void loadLatest()
        } else if (event.type === 'disconnected') setState((current) => ({ ...current, isOffline: true }))
        else if (event.type === 'message.deleted') {
          if (isSameChat(event, { eventId, occurrenceDate }))
            setState((current) => ({ ...current, messages: current.messages.filter(({ id }) => id !== event.id) }))
        } else if (isSameChat(event.message, { eventId, occurrenceDate })) {
          setState((current) => ({ ...current, messages: mergeMessages(current.messages, [event.message]) }))
          if (event.type === 'message.created') markRead()
        }
      }),
    [repository, eventId, occurrenceDate, loadLatest, markRead],
  )

  const loadOlder = useCallback(async () => {
    const [oldest] = state.messages
    if (!oldest) return
    const page = await repository.list({ eventId, occurrenceDate }, { before: oldest.id })
    setState((current) => ({
      ...current,
      messages: mergeMessages(page.messages, current.messages),
      hasMore: page.hasMore,
    }))
  }, [repository, eventId, occurrenceDate, state.messages])

  const send = useCallback(
    async (text: string) => {
      const message = await repository.send({ eventId, occurrenceDate }, text)
      setState((current) => ({ ...current, messages: mergeMessages(current.messages, [message]) }))
    },
    [repository, eventId, occurrenceDate],
  )

  const edit = useCallback(
    async (id: string, text: string) => {
      const message = await repository.edit(id, text)
      setState((current) => ({ ...current, messages: mergeMessages(current.messages, [message]) }))
    },
    [repository],
  )

  const remove = useCallback(
    async (id: string) => {
      await repository.remove(id)
      setState((current) => ({ ...current, messages: current.messages.filter((message) => message.id !== id) }))
    },
    [repository],
  )

  return { ...state, loadOlder, send, edit, remove }
}
