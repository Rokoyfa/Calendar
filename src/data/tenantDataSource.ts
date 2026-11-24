import type { UserTokenProvider } from '../features/authorization/index.ts'
import type { HolidaySource } from '../lib/defaults.ts'
import { restDataSource } from './restDataSource.ts'
import type { CalendarDataSource } from './types.ts'

export const TENANT_HEADER = 'X-Calendar-Tenant'

export type TenantDataSourceOptions = {
  tenant: string
  baseUrl: string
  timeoutMs?: number
  getUserToken?: UserTokenProvider
  holidaySource?: HolidaySource
  chat?: boolean
  liveUpdates?: boolean
  notifications?: boolean
}

export const tenantDataSource = ({ tenant, ...options }: TenantDataSourceOptions): CalendarDataSource =>
  restDataSource({ ...options, auth: true, headers: { [TENANT_HEADER]: tenant } })
