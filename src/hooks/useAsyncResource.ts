import { useCallback, useEffect, useMemo, useState } from 'react'
import { getErrorMessage, useI18n } from '../i18n/index.ts'

type ResourceState<T> = {
  source: object | null
  data: T
  failure: { reason: unknown } | null
}

export function useAsyncResource<T>(load: () => Promise<T>, initialData: T, refreshKey: unknown = null) {
  const { m } = useI18n()
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<ResourceState<T>>({ source: null, data: initialData, failure: null })
  const source = useMemo(() => ({ load, version, refreshKey }), [load, version, refreshKey])

  useEffect(() => {
    let cancelled = false

    source
      .load()
      .then((data) => {
        if (!cancelled) setState({ source, data, failure: null })
      })
      .catch((reason: unknown) => {
        if (!cancelled) setState((previous) => ({ ...previous, source, failure: { reason } }))
      })

    return () => {
      cancelled = true
    }
  }, [source])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const setData = useCallback((data: T) => setState((previous) => ({ ...previous, data })), [])
  const update = useCallback(
    (change: (data: T) => T) => setState((previous) => ({ ...previous, data: change(previous.data) })),
    [],
  )

  const apply = useCallback(
    async (request: Promise<T>) => {
      const data = await request
      setData(data)
      return data
    },
    [setData],
  )

  const error = state.failure ? getErrorMessage(state.failure.reason, m) : null

  return { data: state.data, error, isLoading: state.source !== source, reload, setData, update, apply }
}
