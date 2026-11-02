import { RemoteAuthRepository } from '../features/authorization/index.ts'
import { apiClient } from './api.ts'

export const authRepository = new RemoteAuthRepository(apiClient)
