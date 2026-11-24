import { useCallback, useMemo, type ReactNode } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { removeById, replaceById } from '../../../utils/list.ts'
import type { PeerCalendar, PeerCalendarChanges } from '../../../utils/peerCalendar.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage, type PeerEventSource, type PersonalSharingRepository } from '../../storage/index.ts'
import { NO_PEER_CALENDARS, PeerCalendarsContext, type PeerCalendarsContextValue } from './PeerCalendarsContext.ts'

const NO_CALENDARS: PeerCalendar[] = []

export function PeerCalendarsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { personalSharing, peerEvents, mode } = useStorage()
  if (!user || mode !== 'remote' || !personalSharing || !peerEvents)
    return <PeerCalendarsContext value={NO_PEER_CALENDARS}>{children}</PeerCalendarsContext>
  return (
    <ActiveProvider repository={personalSharing} source={peerEvents}>
      {children}
    </ActiveProvider>
  )
}

type ActiveProviderProps = {
  repository: PersonalSharingRepository
  source: PeerEventSource
  children: ReactNode
}

function ActiveProvider({ repository, source, children }: ActiveProviderProps) {
  const { invalidate } = useStorage()
  const load = useCallback(async () => {
    const calendars = await repository.listPeers()
    source.setCalendars(calendars)
    return calendars
  }, [repository, source])
  const { data, error, update: updateList } = useAsyncResource(load, NO_CALENDARS)

  const apply = useCallback(
    (change: (current: PeerCalendar[]) => PeerCalendar[]) => {
      updateList((current) => {
        const next = change(current)
        source.setCalendars(next)
        return next
      })
      invalidate()
    },
    [updateList, source, invalidate],
  )

  const value = useMemo<PeerCalendarsContextValue>(
    () => ({
      isAvailable: true,
      calendars: data.filter((calendar) => calendar.status === 'accepted'),
      invitations: data.filter((calendar) => calendar.status === 'pending'),
      error,
      accept: async (id: string) => {
        const accepted = await repository.acceptPeer(id)
        apply((current) => replaceById(current, accepted))
      },
      decline: async (id: string) => {
        await repository.declinePeer(id)
        updateList((current) => removeById(current, id))
      },
      update: async (id: string, changes: PeerCalendarChanges) => {
        const updated = await repository.updatePeer(id, changes)
        apply((current) => replaceById(current, updated))
      },
      leave: async (id: string) => {
        await repository.leavePeer(id)
        apply((current) => removeById(current, id))
      },
    }),
    [data, error, repository, apply, updateList],
  )

  return <PeerCalendarsContext value={value}>{children}</PeerCalendarsContext>
}
