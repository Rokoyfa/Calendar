import { createApiClient } from '../../../utils/api.ts'
import type { RemoteStorageConfig } from '../types/storage.ts'

export const createRemoteApi = ({ baseUrl, timeoutMs, getAccessToken, getLanguage, onUnauthorized }: RemoteStorageConfig) =>
  createApiClient({ baseUrl, timeoutMs, getAccessToken, getLanguage, onUnauthorized })
