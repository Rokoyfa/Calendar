import { useContext } from 'react'
import { StorageContext } from '../context/StorageContext.ts'

export function useStorage() {
  const storage = useContext(StorageContext)
  if (!storage) throw new Error('useStorage muss innerhalb von <StorageProvider> verwendet werden.')
  return storage
}

export function useEventRepository() {
  return useStorage().events
}

export function useColorRepository() {
  return useStorage().colors
}
