import { ApiError, isApiError } from '../../../utils/apiError.ts'
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

type StatusMessages = Partial<Record<number, string>>

const withMessages = (error: unknown, messages: StatusMessages) => {
  if (!isApiError(error) || error.status === null || error.body !== undefined) return error
  const message = messages[error.status]
  if (!message) return error
  return new ApiError(message, { kind: error.kind, status: error.status, body: error.body, cause: error })
}

const translateErrors = async <T>(request: Promise<T>, messages: StatusMessages) => {
  try {
    return await request
  } catch (error) {
    throw withMessages(error, messages)
  }
}

const INVALID_LINK = 'Der Link ist ungültig oder abgelaufen.'

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
      401: 'E-Mail-Adresse oder Passwort ist falsch.',
    })
  }

  register(input: RegisterInput) {
    return translateErrors(this.#api.post<User>(`${AUTH_PATH}/register`, input), {
      409: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.',
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
      403: 'Das aktuelle Passwort ist falsch.',
    })
  }

  deleteAccount(input: AccountDeletionInput) {
    return translateErrors(this.#api.request<void>('DELETE', ME_PATH, { body: input }), {
      403: 'Das Passwort ist falsch.',
      409: 'Du bist einziger Owner eines Teams mit weiteren Mitgliedern. Bitte übergib zuerst die Leitung.',
    })
  }

  async requestPasswordReset(input: PasswordResetRequestInput) {
    await this.#api.post<void>(`${AUTH_PATH}/password-reset`, input)
  }

  resetPassword(input: PasswordResetInput) {
    return translateErrors(this.#api.post<void>(`${AUTH_PATH}/password-reset/confirm`, input), {
      410: `${INVALID_LINK} Bitte fordere einen neuen an.`,
    })
  }

  verifyEmail(token: string) {
    return translateErrors(this.#api.post<void>(`${AUTH_PATH}/verify-email`, { token }), { 410: INVALID_LINK })
  }

  async resendVerificationEmail() {
    await this.#api.post<void>(`${AUTH_PATH}/verify-email/resend`)
  }
}
