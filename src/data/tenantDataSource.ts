import type { UserTokenProvider } from '../features/authorization/index.ts'
import { restDataSource } from './restDataSource.ts'
import type { CalendarDataSource } from './types.ts'

export const TENANT_HEADER = 'X-Calendar-Tenant'

export type TenantDataSourceOptions = {
  tenant: string
  baseUrl: string
  timeoutMs?: number
  getUserToken?: UserTokenProvider
}

export const tenantDataSource = ({ tenant, baseUrl, timeoutMs, getUserToken }: TenantDataSourceOptions): CalendarDataSource =>
  restDataSource({ baseUrl, timeoutMs, auth: true, headers: { [TENANT_HEADER]: tenant }, getUserToken })
