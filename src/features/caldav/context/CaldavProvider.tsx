import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { CaldavAccount, CaldavAccountChanges, CaldavAccountInput, CaldavCalendarChanges } from '../utils/caldav.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage, type CaldavEventSource, type CaldavRepository } from '../../storage/index.ts'
import { CaldavContext, NO_CALDAV, type CaldavCalendarEntry, type CaldavContextValue } from './CaldavContext.ts'
import { removeById, replaceById, upsertById } from '../../../utils/list.ts'

const NO_ACCOUNTS: CaldavAccount[] = []

const flatten = (accounts: readonly CaldavAccount[]): CaldavCalendarEntry[] =>
  accounts.flatMap((account) =>
    account.calendars.map((calendar) => ({ ...calendar, accountId: account.id, accountName: account.name })),
  )

export function CaldavProvider({ children }: { children: ReactNode }) {
  const { caldavAccounts: isEnabled } = useFeatures()
  const { user } = useAuth()
  const { caldav: repository, caldavEvents } = useStorage()

  if (!isEnabled || !user || !repository || !caldavEvents)
    return <CaldavContext value={NO_CALDAV}>{children}</CaldavContext>
  return (
    <ActiveProvider repository={repository} source={caldavEvents}>
      {children}
    </ActiveProvider>
  )
}

type ActiveProviderProps = { repository: CaldavRepository; source: CaldavEventSource; children: ReactNode }

function ActiveProvider({ repository, source, children }: ActiveProviderProps) {
  const { invalidate } = useStorage()
  const load = useCallback(() => repository.list(), [repository])
  const { data: accounts, error, isLoading, update: updateList } = useAsyncResource(load, NO_ACCOUNTS)
  const calendars = useMemo(() => flatten(accounts), [accounts])

  useEffect(() => {
    source.setCalendars(calendars)
  }, [source, calendars])

  const apply = useCallback(
    (change: (current: CaldavAccount[]) => CaldavAccount[], forget?: readonly string[]) => {
      updateList((current) => {
        const next = change(current)
        source.setCalendars(flatten(next))
        return next
      })
      source.forget(forget)
      invalidate()
    },
    [updateList, source, invalidate],
  )

  const replace = useCallback(
    (account: CaldavAccount) =>
      apply(
        (current) => upsertById(current, account),
        account.calendars.map((calendar) => calendar.id),
      ),
    [apply],
  )

  const value = useMemo<CaldavContextValue>(
    () => ({
      isAvailable: true,
      accounts,
      calendars,
      isLoading,
      error,
      create: async (input: CaldavAccountInput) => replace(await repository.create(input)),
      update: async (id: string, changes: CaldavAccountChanges) => replace(await repository.update(id, changes)),
      remove: async (id: string) => {
        await repository.remove(id)
        apply((current) => removeById(current, id))
      },
      sync: async (id: string) => replace(await repository.sync(id)),
      updateCalendar: async (id: string, changes: CaldavCalendarChanges) => {
        const updated = await repository.updateCalendar(id, changes)
        apply(
          (current) =>
            current.map((account) => ({
              ...account,
              calendars: replaceById(account.calendars, updated).sort((a, b) => a.position - b.position),
            })),
          [id],
        )
      },
    }),
    [accounts, calendars, isLoading, error, repository, apply, replace],
  )

  return <CaldavContext value={value}>{children}</CaldavContext>
}
