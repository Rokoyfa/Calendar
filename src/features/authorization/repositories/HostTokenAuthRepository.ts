import { parseEventResponse, type EventReply } from '../../../utils/event.ts'
import { isApiError } from '../../../utils/apiError.ts'
import { AppError } from '../../../utils/appError.ts'
import type { ApiClient } from '../../../utils/api.ts'
import type { AuthRepository, User, UserTokenProvider } from '../types/auth.ts'

const AUTH_PATH = '/auth'

const notAvailable = () => Promise.reject(new AppError('managedByHost'))

export class HostTokenAuthRepository implements AuthRepository {
  readonly method = 'hostToken'
  readonly #api: ApiClient
  readonly #getUserToken: UserTokenProvider

  constructor(api: ApiClient, getUserToken: UserTokenProvider) {
    this.#api = api
    this.#getUserToken = getUserToken
  }

  async getCurrentUser() {
    try {
      return await this.#api.get<User>(`${AUTH_PATH}/me`)
    } catch (error) {
      if (!isApiError(error) || !error.isUnauthorized) throw error
    }
    const token = await this.#getUserToken()
    if (!token) return null
    return this.#api.post<User>(`${AUTH_PATH}/token`, { token })
  }

  async logout() {
    await this.#api.post<void>(`${AUTH_PATH}/logout`)
  }

  login = notAvailable
  register = notAvailable
  updateProfile = notAvailable
  changePassword = notAvailable
  deleteAccount = notAvailable
  requestPasswordReset = notAvailable
  resetPassword = notAvailable
  verifyEmail = notAvailable
  resendVerificationEmail = notAvailable

  async respondToEvent(token: string, status: EventReply) {
    return parseEventResponse(await this.#api.post<unknown>('/events/respond', { token, status }))
  }
}
