import { useRequiredContext } from '../../../hooks/useRequiredContext.ts'
import { StorageContext } from '../context/StorageContext.ts'

export const useStorage = () => useRequiredContext(StorageContext, 'StorageProvider')

export const useEventRepository = () => useStorage().events

export const useColorRepository = () => useStorage().colors

export const usePreferencesRepository = () => useStorage().preferences
