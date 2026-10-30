import { useMemo, type ReactNode } from 'react'
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
  const value = useMemo<StorageContextValue>(
    () => ({
      mode: config.mode,
      events: createEventRepository(config),
      colors: new LocalColorRepository(),
    }),
    [config],
  )

  return <StorageContext value={value}>{children}</StorageContext>
}
