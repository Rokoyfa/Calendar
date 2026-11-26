import { useStorage } from '../../storage/hooks/useStorage.ts'

export const useFreeBusyRepository = () => useStorage().freeBusy
