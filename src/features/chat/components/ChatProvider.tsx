import { useMemo, type ReactNode } from 'react'
import { useStorage, type ChatRepository } from '../../storage/index.ts'
import { ChatContext } from '../context/ChatContext.ts'
import { useChatUnread } from '../hooks/useChatUnread.ts'

export type ChatAccess = {
  currentUserId: string
  isAvailable: (calendarId: string) => boolean
  canModerate: (calendarId: string) => boolean
}

type ChatProviderProps = {
  access: ChatAccess | undefined
  calendarIds: readonly string[]
  children: ReactNode
}

export function ChatProvider({ access, calendarIds, children }: ChatProviderProps) {
  const { chat } = useStorage()
  if (!chat || !access) return children
  return (
    <ConnectedChat repository={chat} access={access} calendarIds={calendarIds}>
      {children}
    </ConnectedChat>
  )
}

function ConnectedChat({
  repository,
  access,
  calendarIds,
  children,
}: Omit<ChatProviderProps, 'access'> & { repository: ChatRepository; access: ChatAccess }) {
  const chatCalendarIds = useMemo(() => calendarIds.filter(access.isAvailable), [calendarIds, access])
  const { unread, markOpen, markClosed } = useChatUnread(repository, chatCalendarIds, access.currentUserId)
  const value = useMemo(
    () => ({ repository, ...access, unread, markOpen, markClosed }),
    [repository, access, unread, markOpen, markClosed],
  )
  return <ChatContext value={value}>{children}</ChatContext>
}
