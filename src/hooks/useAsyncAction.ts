import { useCallback, useState } from 'react'
import { getErrorMessage, useI18n } from '../i18n/index.ts'

export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { m } = useI18n()
  const [failure, setFailure] = useState<{ reason: unknown } | null>(null)

  const run = useCallback(
    async (...args: Args) => {
      setIsPending(true)
      setIsSuccess(false)
      setFailure(null)
      try {
        await action(...args)
        setIsSuccess(true)
      } catch (reason) {
        setFailure({ reason })
      } finally {
        setIsPending(false)
      }
    },
    [action],
  )

  const error = failure ? getErrorMessage(failure.reason, m) : null

  return { run, isPending, isSuccess, error }
}
