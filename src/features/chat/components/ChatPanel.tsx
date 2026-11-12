import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../../../components/Button.tsx'
import { ErrorMessage } from '../../../components/StatusMessage.tsx'
import { useViewerTimeZone } from '../../../context/TimeZoneContext.ts'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useI18n } from '../../../i18n/index.ts'
import { classNames } from '../../../utils/classNames.ts'
import { CHAT_MESSAGE_MAX_LENGTH, getChatId, type ChatKey, type ChatMessage } from '../../../utils/chat.ts'
import { useChatContext, type ChatContextValue } from '../context/ChatContext.ts'
import { useChatMessages } from '../hooks/useChatMessages.ts'
import { formatMessageTime, toLocalDate } from '../utils/time.ts'

const BOTTOM_THRESHOLD_PX = 48

type ChatPanelProps = {
  chatKey: ChatKey
  calendarId: string
  isActive: boolean
}

export function ChatPanel(props: ChatPanelProps) {
  const context = useChatContext()
  return context ? <ChatView {...props} context={context} /> : null
}

const submitsOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing

function ChatView({ chatKey, calendarId, isActive, context }: ChatPanelProps & { context: ChatContextValue }) {
  const i18n = useI18n()
  const { m, locale } = i18n
  const texts = m.events.chat
  const viewerTimeZone = useViewerTimeZone()
  const { repository, currentUserId, canModerate, markOpen, markClosed } = context
  const chat = useChatMessages(repository, chatKey, isActive)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const chatId = getChatId(chatKey)
  const mayModerate = canModerate(calendarId)

  const sending = useAsyncAction(async () => {
    const text = draft.trim()
    if (!text) return
    stickToBottom.current = true
    await chat.send(text)
    setDraft('')
  })
  const saving = useAsyncAction(async () => {
    if (!editing?.text.trim()) return
    await chat.edit(editing.id, editing.text.trim())
    setEditing(null)
  })
  const removing = useAsyncAction(async (id: string) => {
    await chat.remove(id)
    setConfirmDelete(null)
  })
  const olderLoading = useAsyncAction(chat.loadOlder)

  useEffect(() => {
    if (!isActive) return
    const key = { eventId: chatKey.eventId, occurrenceDate: chatKey.occurrenceDate }
    markOpen(key)
    return () => markClosed(key)
  }, [isActive, chatId, chatKey.eventId, chatKey.occurrenceDate, markOpen, markClosed])

  useLayoutEffect(() => {
    const list = listRef.current
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight
  }, [chat.messages, isActive])

  const handleScroll = () => {
    const list = listRef.current
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < BOTTOM_THRESHOLD_PX
  }

  const authorName = (message: ChatMessage) =>
    message.author?.id === currentUserId ? texts.you : (message.author?.name ?? texts.removedAuthor)

  let previousDate: string | null = null

  return (
    <div className="chat">
      <div ref={listRef} className="chatMessages" role="log" aria-live="polite" onScroll={handleScroll}>
        {chat.hasMore && (
          <button
            type="button"
            className="chatLoadOlder"
            disabled={olderLoading.isPending}
            onClick={() => {
              stickToBottom.current = false
              void olderLoading.run()
            }}
          >
            {texts.loadOlder}
          </button>
        )}
        {chat.isLoading ? (
          <p className="formHint">{m.common.loading}</p>
        ) : chat.messages.length === 0 ? (
          <p className="formHint chatEmpty">{texts.empty}</p>
        ) : (
          chat.messages.map((message) => {
            const date = toLocalDate(message.createdAt, viewerTimeZone)
            const showDate = date !== previousDate
            previousDate = date
            const isOwn = message.author?.id === currentUserId
            const isEditing = editing?.id === message.id
            return (
              <div key={message.id} className="chatEntry">
                {showDate && <p className="chatDate">{i18n.format.longDate(date)}</p>}
                <div className={classNames('chatMessage', isOwn && 'chatMessage--own')}>
                  <div className="chatMeta">
                    <span className="chatAuthor">{authorName(message)}</span>
                    <time dateTime={message.createdAt}>
                      {formatMessageTime(message.createdAt, locale, viewerTimeZone)}
                    </time>
                    {message.editedAt && <span className="chatEdited">{texts.edited}</span>}
                  </div>
                  {isEditing ? (
                    <div className="chatEdit">
                      <textarea
                        className="textarea chatInput"
                        value={editing.text}
                        maxLength={CHAT_MESSAGE_MAX_LENGTH}
                        aria-label={texts.edit}
                        onChange={(event) => setEditing({ id: message.id, text: event.target.value })}
                        onKeyDown={(event) => {
                          if (submitsOnEnter(event)) {
                            event.preventDefault()
                            void saving.run()
                          } else if (event.key === 'Escape') {
                            event.stopPropagation()
                            setEditing(null)
                          }
                        }}
                        autoFocus
                      />
                      <div className="chatActions">
                        <button type="button" className="chatAction" onClick={() => void saving.run()}>
                          {m.common.save}
                        </button>
                        <button type="button" className="chatAction" onClick={() => setEditing(null)}>
                          {m.common.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="chatText">{message.text}</p>
                  )}
                  {!isEditing && (isOwn || mayModerate) && (
                    <div className="chatActions">
                      {isOwn && (
                        <button
                          type="button"
                          className="chatAction"
                          onClick={() => setEditing({ id: message.id, text: message.text })}
                        >
                          {texts.edit}
                        </button>
                      )}
                      {confirmDelete === message.id ? (
                        <>
                          <button
                            type="button"
                            className="chatAction chatAction--danger"
                            onClick={() => void removing.run(message.id)}
                          >
                            {texts.confirmDelete}
                          </button>
                          <button type="button" className="chatAction" onClick={() => setConfirmDelete(null)}>
                            {m.common.cancel}
                          </button>
                        </>
                      ) : (
                        <button type="button" className="chatAction" onClick={() => setConfirmDelete(message.id)}>
                          {m.common.delete}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      {chat.isOffline && <p className="formHint">{texts.offline}</p>}
      <ErrorMessage message={chat.error ?? sending.error ?? saving.error ?? removing.error ?? olderLoading.error} />
      <div className="chatComposer">
        <textarea
          className="textarea chatInput"
          name="chatMessage"
          rows={2}
          value={draft}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          placeholder={texts.placeholder}
          aria-label={texts.placeholder}
          title={texts.sendHint}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (!submitsOnEnter(event)) return
            event.preventDefault()
            void sending.run()
          }}
        />
        <Button isPending={sending.isPending} disabled={!draft.trim()} onClick={() => void sending.run()}>
          {texts.send}
        </Button>
      </div>
    </div>
  )
}
