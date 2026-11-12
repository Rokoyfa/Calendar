import type { EventReply, EventResponse } from '../../../utils/event.ts'
export type User = {
  id: string
  email: string
  name: string
  emailVerified: boolean
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput & {
  name: string
}

export type ProfileInput = Pick<User, 'name'>

export type PasswordChangeInput = {
  currentPassword: string
  newPassword: string
}

export type PasswordResetRequestInput = Pick<User, 'email'>

export type PasswordResetInput = {
  token: string
  password: string
}

export type AccountDeletionInput = {
  password: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthMethod = 'password' | 'hostToken'

export type UserTokenProvider = () => string | null | Promise<string | null>

export interface AuthRepository {
  readonly method?: AuthMethod
  getCurrentUser(): Promise<User | null>
  login(input: LoginInput): Promise<User>
  register(input: RegisterInput): Promise<User>
  logout(): Promise<void>
  updateProfile(input: ProfileInput): Promise<User>
  changePassword(input: PasswordChangeInput): Promise<void>
  deleteAccount(input: AccountDeletionInput): Promise<void>
  requestPasswordReset(input: PasswordResetRequestInput): Promise<void>
  resetPassword(input: PasswordResetInput): Promise<void>
  verifyEmail(token: string): Promise<void>
  resendVerificationEmail(): Promise<void>
  respondToEvent?(token: string, status: EventReply): Promise<EventResponse>
}

type AccountActions = Pick<
  AuthRepository,
  | 'login'
  | 'register'
  | 'logout'
  | 'updateProfile'
  | 'changePassword'
  | 'deleteAccount'
  | 'requestPasswordReset'
  | 'resetPassword'
  | 'verifyEmail'
  | 'resendVerificationEmail'
>

export type AuthContextValue = AccountActions & {
  respondToEvent: (token: string, status: EventReply) => Promise<EventResponse>
  enabled: boolean
  method: AuthMethod
  status: AuthStatus
  user: User | null
  expireSession: () => void
}
