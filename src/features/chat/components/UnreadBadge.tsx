import { ChatIcon } from '../../../components/Icons.tsx'
import { useI18n } from '../../../i18n/index.ts'
import type { ChatKey } from '../../../utils/chat.ts'
import { useUnreadCount } from '../context/ChatContext.ts'

export function UnreadBadge({ chatKey }: { chatKey: ChatKey }) {
  const { m } = useI18n()
  const count = useUnreadCount(chatKey)
  if (count === 0) return null
  const label = m.events.chat.unread(count)
  return (
    <span className="unreadBadge" title={label} aria-label={label}>
      <ChatIcon size={10} />
      {count > 99 ? '99+' : count}
    </span>
  )
}
