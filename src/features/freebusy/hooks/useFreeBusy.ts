import { useStorage } from '../../storage/index.ts'

export const useFreeBusyRepository = () => useStorage().freeBusy
