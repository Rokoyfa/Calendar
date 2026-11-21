import { useCallback, useState } from 'react'
import { useAsyncAction } from '../../../hooks/useAsyncAction.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { isApiError } from '../../../utils/apiError.ts'

export type SecretLinkOperations = {
  get: (calendarId: string) => Promise<string | null>
  create: (calendarId: string) => Promise<string>
  remove: (calendarId: string) => Promise<void>
}

type LinkState = { supported: boolean; value: string | null }

const UNSUPPORTED: LinkState = { supported: false, value: null }

export function useSecretLink(calendarId: string, operations: SecretLinkOperations) {
  const [current, setCurrent] = useState<LinkState | null>(null)
  const load = useCallback(
    () =>
      operations
        .get(calendarId)
        .then((value): LinkState => ({ supported: true, value }))
        .catch((error: unknown) => {
          if (isApiError(error) && error.isNotFound) return UNSUPPORTED
          throw error
        }),
    [operations, calendarId],
  )
  const { data: loaded, error: loadError, isLoading } = useAsyncResource(load, UNSUPPORTED)
  const state = current ?? loaded

  const create = useAsyncAction(async () => {
    setCurrent({ supported: true, value: await operations.create(calendarId) })
  })
  const remove = useAsyncAction(async () => {
    await operations.remove(calendarId)
    setCurrent({ supported: true, value: null })
  })

  return {
    isAvailable: !isLoading && state.supported,
    value: state.value,
    create,
    remove,
    error: loadError ?? create.error ?? remove.error,
  }
}

export type SecretLink = ReturnType<typeof useSecretLink>
