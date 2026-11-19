import { useFeatures } from '../../../context/HostContext.ts'
import { useAuth } from '../../authorization/index.ts'
import { useStorage } from '../../storage/index.ts'

export const useIsCaldavServerAvailable = () => {
  const { caldav } = useFeatures()
  const { user } = useAuth()
  const { appPasswords } = useStorage()
  return Boolean(caldav && user && appPasswords)
}
