import { useEffect, useRef } from 'react'
import { useHost } from '../../../context/HostContext.ts'
import type { CalendarController, CalendarState } from '../../../context/HostBridge.ts'

export function useHostController(controller: CalendarController, state: CalendarState) {
  const { bridge } = useHost()
  const latest = useRef(controller)

  useEffect(() => {
    latest.current = controller
  }, [controller])

  useEffect(() => bridge?.attach(() => latest.current), [bridge])

  useEffect(() => {
    bridge?.report(state)
  }, [bridge, state])
}
