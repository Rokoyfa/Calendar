import type { AuthRepository } from '../features/authorization/index.ts'
import type { CalendarRepository } from '../features/calendars/index.ts'
import type { StorageRepositories } from '../features/storage/index.ts'

export type DataRepositories = Omit<StorageRepositories, 'caldavEvents' | 'peerEvents'> & {
  calendars: CalendarRepository
}

export type DataSourceContext = {
  getLanguage: () => string | null
  onUnauthorized: () => void
}

export type DataSession = {
  isAuthenticated: boolean
}

export interface CalendarDataSource {
  createAuthRepository?: (context: Pick<DataSourceContext, 'getLanguage'>) => AuthRepository
  connect: (session: DataSession, context: DataSourceContext) => DataRepositories
}
