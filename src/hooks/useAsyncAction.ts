import { useCallback, useState } from 'react'
import { getErrorMessage } from '../utils/error.ts'

export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: Args) => {
      setIsPending(true)
      setError(null)
      try {
        await action(...args)
      } catch (reason) {
        setError(getErrorMessage(reason))
      } finally {
        setIsPending(false)
      }
    },
    [action],
  )

  return { run, isPending, error }
}
