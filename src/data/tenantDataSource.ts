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
}

export const tenantDataSource = ({
  tenant,
  baseUrl,
  timeoutMs,
  getUserToken,
  holidaySource,
  chat,
}: TenantDataSourceOptions): CalendarDataSource =>
  restDataSource({
    baseUrl,
    timeoutMs,
    auth: true,
    headers: { [TENANT_HEADER]: tenant },
    getUserToken,
    holidaySource,
    chat,
  })
