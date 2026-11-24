import { useCallback } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { BookingPage, BookingPageSettings } from '../../../utils/booking.ts'
import type { BookingRepository } from '../../storage/index.ts'

const EMPTY: BookingPage[] = []

export function useBookingPages(repository: BookingRepository, calendarId: string) {
  const load = useCallback(() => repository.listPages(calendarId), [repository, calendarId])
  const { data: pages, error, isLoading, update } = useAsyncResource(load, EMPTY)

  const replace = useCallback(
    (page: BookingPage) => {
      update((current) => current.map((entry) => (entry.id === page.id ? page : entry)))
      return page
    },
    [update],
  )

  const create = useCallback(
    async (settings: BookingPageSettings) => {
      const page = await repository.createPage(calendarId, settings)
      update((current) => [...current, page])
      return page
    },
    [repository, calendarId, update],
  )

  const change = useCallback(
    async (id: string, changes: Partial<BookingPageSettings>) => replace(await repository.updatePage(id, changes)),
    [repository, replace],
  )

  const renew = useCallback(async (id: string) => replace(await repository.renewPage(id)), [repository, replace])

  const remove = useCallback(
    async (id: string) => {
      await repository.removePage(id)
      update((current) => current.filter((entry) => entry.id !== id))
    },
    [repository, update],
  )

  return { pages, error, isLoading, create, change, renew, remove }
}
