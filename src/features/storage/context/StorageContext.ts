import { createContext } from 'react'
import type { StorageContextValue } from '../types/storage.ts'

export const StorageContext = createContext<StorageContextValue | null>(null)
