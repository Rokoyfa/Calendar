import { ApiError, isApiError } from '../../../utils/apiError.ts'
import type { ApiClient } from '../../../utils/api.ts'
import type { AuthRepository, LoginInput, RegisterInput, User } from '../types/auth.ts'

const AUTH_PATH = '/auth'

const withMessage = (error: unknown, status: number, message: string) => {
  if (!isApiError(error) || error.status !== status || error.body !== undefined) return error
  return new ApiError(message, { kind: error.kind, status, body: error.body, cause: error })
}

export class RemoteAuthRepository implements AuthRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async getCurrentUser() {
    try {
      return await this.#api.get<User>(`${AUTH_PATH}/me`)
    } catch (error) {
      if (isApiError(error) && error.isUnauthorized) return null
      throw error
    }
  }

  async login(input: LoginInput) {
    try {
      return await this.#api.post<User>(`${AUTH_PATH}/login`, input)
    } catch (error) {
      throw withMessage(error, 401, 'E-Mail-Adresse oder Passwort ist falsch.')
    }
  }

  async register(input: RegisterInput) {
    try {
      return await this.#api.post<User>(`${AUTH_PATH}/register`, input)
    } catch (error) {
      throw withMessage(error, 409, 'Für diese E-Mail-Adresse gibt es bereits ein Konto.')
    }
  }

  async logout() {
    await this.#api.post<void>(`${AUTH_PATH}/logout`)
  }
}
