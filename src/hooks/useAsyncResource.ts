import { useCallback, useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '../utils/error.ts'

type ResourceState<T> = {
  source: object | null
  data: T
  error: string | null
}

export function useAsyncResource<T>(load: () => Promise<T>, initialData: T) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<ResourceState<T>>({ source: null, data: initialData, error: null })
  const source = useMemo(() => ({ load, version }), [load, version])

  useEffect(() => {
    let cancelled = false

    source
      .load()
      .then((data) => {
        if (!cancelled) setState({ source, data, error: null })
      })
      .catch((reason: unknown) => {
        if (!cancelled) setState((previous) => ({ ...previous, source, error: getErrorMessage(reason) }))
      })

    return () => {
      cancelled = true
    }
  }, [source])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const setData = useCallback((data: T) => setState((previous) => ({ ...previous, data })), [])

  return { data: state.data, error: state.error, isLoading: state.source !== source, reload, setData }
}
