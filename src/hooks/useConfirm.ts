import { useCallback, useState } from 'react'

export function useConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null)
  const ask = useCallback((value: T) => setTarget(() => value), [])
  const close = useCallback(() => setTarget(null), [])
  return { target, ask, close }
}
