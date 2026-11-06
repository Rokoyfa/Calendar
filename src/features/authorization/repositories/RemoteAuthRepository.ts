import { ApiError, isApiError } from '../../../utils/apiError.ts'
import type { ErrorCode } from '../../../utils/appError.ts'
import type { ApiClient } from '../../../utils/api.ts'
import type {
  AccountDeletionInput,
  AuthRepository,
  LoginInput,
  PasswordChangeInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  ProfileInput,
  RegisterInput,
  User,
} from '../types/auth.ts'

const AUTH_PATH = '/auth'
const ME_PATH = `${AUTH_PATH}/me`

type StatusCodes = Partial<Record<number, ErrorCode>>

const withCode = (error: unknown, codes: StatusCodes) => {
  if (!isApiError(error) || error.status === null) return error
  const code = codes[error.status]
  if (!code) return error
  return new ApiError(error.message, { kind: error.kind, code, status: error.status, body: error.body, cause: error })
}

const translateErrors = async <T>(request: Promise<T>, codes: StatusCodes) => {
  try {
    return await request
  } catch (error) {
    throw withCode(error, codes)
  }
}

export class RemoteAuthRepository implements AuthRepository {
  readonly #api: ApiClient

  constructor(api: ApiClient) {
    this.#api = api
  }

  async getCurrentUser() {
    try {
      return await this.#api.get<User>(ME_PATH)
    } catch (error) {
      if (isApiError(error) && error.isUnauthorized) return null
      throw error
    }
  }

  login(input: LoginInput) {
    return translateErrors(this.#api.post<User>(`${AUTH_PATH}/login`, input), {
      401: 'invalidCredentials',
    })
  }

  register(input: RegisterInput) {
    return translateErrors(this.#api.post<User>(`${AUTH_PATH}/register`, input), {
      409: 'emailTaken',
    })
  }

  async logout() {
    await this.#api.post<void>(`${AUTH_PATH}/logout`)
  }

  updateProfile(input: ProfileInput) {
    return this.#api.patch<User>(ME_PATH, input)
  }

  changePassword(input: PasswordChangeInput) {
    return translateErrors(this.#api.post<void>(`${ME_PATH}/password`, input), {
      403: 'wrongCurrentPassword',
    })
  }

  deleteAccount(input: AccountDeletionInput) {
    return translateErrors(this.#api.request<void>('DELETE', ME_PATH, { body: input }), {
      403: 'wrongPassword',
      409: 'soleOwner',
    })
  }

  async requestPasswordReset(input: PasswordResetRequestInput) {
    await this.#api.post<void>(`${AUTH_PATH}/password-reset`, input)
  }

  resetPassword(input: PasswordResetInput) {
    return translateErrors(this.#api.post<void>(`${AUTH_PATH}/password-reset/confirm`, input), {
      410: 'invalidResetLink',
    })
  }

  verifyEmail(token: string) {
    return translateErrors(this.#api.post<void>(`${AUTH_PATH}/verify-email`, { token }), { 410: 'invalidLink' })
  }

  async resendVerificationEmail() {
    await this.#api.post<void>(`${AUTH_PATH}/verify-email/resend`)
  }
}
