import { createApiClient } from '../utils/api.ts'
import { env } from './env.ts'

export const apiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  timeoutMs: env.apiTimeoutMs,
})
