import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createEventRepository } from '../repositories/createEventRepository.ts'
import { LocalColorRepository } from '../repositories/LocalColorRepository.ts'
import type { StorageConfig, StorageContextValue } from '../types/storage.ts'
import { StorageContext } from './StorageContext.ts'

const LOCAL_STORAGE_CONFIG: StorageConfig = { mode: 'local' }

type StorageProviderProps = {
  config?: StorageConfig
  children: ReactNode
}

export function StorageProvider({ config = LOCAL_STORAGE_CONFIG, children }: StorageProviderProps) {
  const [version, setVersion] = useState(0)
  const invalidate = useCallback(() => setVersion((current) => current + 1), [])
  const repositories = useMemo(
    () => ({ mode: config.mode, events: createEventRepository(config), colors: new LocalColorRepository() }),
    [config],
  )
  const value = useMemo<StorageContextValue>(
    () => ({ ...repositories, version, invalidate }),
    [repositories, version, invalidate],
  )

  return <StorageContext value={value}>{children}</StorageContext>
}
