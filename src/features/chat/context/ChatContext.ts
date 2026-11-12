import { createContext, use } from 'react'
import type { ChatRepository } from '../../storage/index.ts'
import { getChatId, type ChatKey } from '../../../utils/chat.ts'

export type ChatContextValue = {
  repository: ChatRepository
  currentUserId: string
  isAvailable: (calendarId: string) => boolean
  canModerate: (calendarId: string) => boolean
  unread: ReadonlyMap<string, number>
  markOpen: (key: ChatKey) => void
  markClosed: (key: ChatKey) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export const useChatContext = () => use(ChatContext)

export const useUnreadCount = (key: ChatKey) => use(ChatContext)?.unread.get(getChatId(key)) ?? 0
