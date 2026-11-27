import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import type { AppNotification } from '../utils/notification.ts'
import type { NotificationRepository } from '../../storage/index.ts'
import { removeById } from '../../../utils/list.ts'

type State = { notifications: AppNotification[]; unread: number; hasMore: boolean }

const EMPTY: State = { notifications: [], unread: 0, hasMore: false }

export function useNotifications(repository: NotificationRepository | undefined) {
  const { m } = useI18n()
  const [state, setState] = useState<State>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (before?: string) => {
      if (!repository) return
      try {
        const page = await repository.list({ before })
        setState((current) => ({
          notifications: before ? [...current.notifications, ...page.notifications] : page.notifications,
          unread: page.unread,
          hasMore: page.hasMore,
        }))
        setError(null)
      } catch (caught) {
        setError(getErrorMessage(caught, m))
      }
    },
    [repository, m],
  )

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    repository
      .list()
      .then((page) => {
        if (!cancelled) setState(page)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(getErrorMessage(caught, m))
      })
    const unsubscribe = repository.subscribe((notification) =>
      setState((current) =>
        current.notifications.some((entry) => entry.id === notification.id)
          ? current
          : {
              ...current,
              notifications: [notification, ...current.notifications],
              unread: current.unread + (notification.readAt ? 0 : 1),
            },
      ),
    )
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [repository, m])

  const markRead = useCallback(
    async (ids?: readonly string[]) => {
      if (!repository) return
      const selected = ids ? new Set(ids) : null
      const timestamp = new Date().toISOString()
      setState((current) => {
        const changed = current.notifications.filter(
          (entry) => !entry.readAt && (selected === null || selected.has(entry.id)),
        ).length
        return {
          ...current,
          notifications: current.notifications.map((entry) =>
            !entry.readAt && (selected === null || selected.has(entry.id)) ? { ...entry, readAt: timestamp } : entry,
          ),
          unread: selected === null ? 0 : Math.max(0, current.unread - changed),
        }
      })
      try {
        await repository.markRead(ids)
      } catch (caught) {
        setError(getErrorMessage(caught, m))
      }
    },
    [repository, m],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!repository) return
      try {
        await repository.remove(id)
        setState((current) => {
          const removed = current.notifications.find((entry) => entry.id === id)
          return {
            ...current,
            notifications: removeById(current.notifications, id),
            unread: removed && !removed.readAt ? Math.max(0, current.unread - 1) : current.unread,
          }
        })
      } catch (caught) {
        setError(getErrorMessage(caught, m))
      }
    },
    [repository, m],
  )

  const loadMore = useCallback(() => load(state.notifications.at(-1)?.id), [load, state.notifications])

  return { ...state, error, markRead, remove, loadMore }
}
