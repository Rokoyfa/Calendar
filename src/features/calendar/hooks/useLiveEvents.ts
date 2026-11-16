import { useEffect, useRef } from 'react'
import type { EventChange } from '../../../utils/eventChange.ts'
import { useStorage } from '../../storage/index.ts'

const REFRESH_DELAY_MS = 300

type EventChanged = Extract<EventChange, { type: 'event.changed' }>

type UseLiveEventsOptions = {
  enabled: boolean
  calendarIds: readonly string[]
  onChange?: (change: EventChanged) => void
}

export function useLiveEvents({ enabled, calendarIds, onChange }: UseLiveEventsOptions) {
  const { events: repository, invalidate } = useStorage()
  const onChangeRef = useRef(onChange)
  const calendarKey = calendarIds.join('\n')

  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!enabled || !repository.subscribe) return
    const shown = new Set(calendarKey.split('\n'))
    let timer: ReturnType<typeof setTimeout> | null = null
    let wasDisconnected = false
    const refresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        invalidate()
      }, REFRESH_DELAY_MS)
    }
    const unsubscribe = repository.subscribe((change) => {
      if (change.type === 'disconnected') {
        wasDisconnected = true
        return
      }
      if (change.type === 'connected') {
        if (wasDisconnected) refresh()
        wasDisconnected = false
        return
      }
      if (change.calendarId !== null && !shown.has(change.calendarId)) return
      onChangeRef.current?.(change)
      refresh()
    })
    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [enabled, repository, calendarKey, invalidate])
}
