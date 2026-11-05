import { useCallback, useState } from 'react'
import { getErrorMessage } from '../utils/error.ts'

export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (...args: Args) => {
      setIsPending(true)
      setIsSuccess(false)
      setError(null)
      try {
        await action(...args)
        setIsSuccess(true)
      } catch (reason) {
        setError(getErrorMessage(reason))
      } finally {
        setIsPending(false)
      }
    },
    [action],
  )

  return { run, isPending, isSuccess, error }
}
