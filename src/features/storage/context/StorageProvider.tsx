import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { StorageContextValue, StorageRepositories } from '../types/storage.ts'
import { StorageContext } from './StorageContext.ts'

type StorageProviderProps = {
  repositories: StorageRepositories
  children: ReactNode
}

export function StorageProvider({ repositories, children }: StorageProviderProps) {
  const [version, setVersion] = useState(0)
  const invalidate = useCallback(() => setVersion((current) => current + 1), [])
  const value = useMemo<StorageContextValue>(
    () => ({ ...repositories, version, invalidate }),
    [repositories, version, invalidate],
  )

  return <StorageContext value={value}>{children}</StorageContext>
}
