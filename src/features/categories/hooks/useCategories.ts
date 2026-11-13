import { useCallback, useMemo } from 'react'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { useI18n } from '../../../i18n/index.ts'
import { AppError } from '../../../utils/appError.ts'
import { sortCategories, type Category } from '../../../utils/category.ts'
import { useStorage } from '../../storage/index.ts'

const NO_CATEGORIES: Category[] = []

export function useCategories(calendarIds: readonly string[]) {
  const { categories: repository, version } = useStorage()
  const { categories: enabled } = useFeatures()
  const { locale } = useI18n()
  const active = enabled ? (repository ?? null) : null
  const key = calendarIds.join('|')

  const load = useCallback(async () => (active && key ? active.list(key.split('|')) : NO_CATEGORIES), [active, key])
  const { data, error, update } = useAsyncResource(load, NO_CATEGORIES, version)
  const categories = useMemo(() => sortCategories(data, locale), [data, locale])

  const create = useCallback(
    async (calendarId: string, name: string) => {
      if (!active) throw new AppError('unknown')
      const created = await active.create(calendarId, name)
      update((current) => [...current, created])
      return created
    },
    [active, update],
  )

  const rename = useCallback(
    async (id: string, name: string) => {
      if (!active) return
      const renamed = await active.rename(id, name)
      update((current) => current.map((category) => (category.id === id ? renamed : category)))
    },
    [active, update],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!active) return
      await active.remove(id)
      update((current) => current.filter((category) => category.id !== id))
    },
    [active, update],
  )

  return { isAvailable: active !== null, categories, error, create, rename, remove }
}
