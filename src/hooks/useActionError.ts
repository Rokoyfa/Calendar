import { useCallback, useState } from 'react'
import { getErrorMessage, useI18n } from '../i18n/index.ts'

export function useActionError() {
  const { m } = useI18n()
  const [error, setError] = useState<string | null>(null)
  const attempt = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null)
      try {
        await action()
        return true
      } catch (caught) {
        setError(getErrorMessage(caught, m))
        return false
      }
    },
    [m],
  )
  return { error, setError, attempt }
}
