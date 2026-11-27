import type { EventReply, EventResponse } from '../../../domain/event.ts'
export type User = {
  id: string
  email: string
  name: string
  emailVerified: boolean
  twoFactorEnabled?: boolean
  hasPassword?: boolean
}

export type TwoFactorChallenge = {
  twoFactorRequired: true
  challenge: string
}

export type TwoFactorLoginInput = {
  challenge: string
  code?: string
  recoveryCode?: string
}

export type TwoFactorState = {
  enabled: boolean
  recoveryCodesLeft: number
  available: boolean
}

export type TwoFactorSetup = {
  secret: string
  otpauthUri: string
}

export type TwoFactorDisableInput = {
  password: string
  code?: string
  recoveryCode?: string
}

export type UserSession = {
  id: string
  current: boolean
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  userAgent: string | null
  ipAddress: string | null
}

export type SecurityActions = {
  getTwoFactorState(): Promise<TwoFactorState>
  startTwoFactorSetup(password: string): Promise<TwoFactorSetup>
  confirmTwoFactor(code: string): Promise<string[]>
  renewRecoveryCodes(password: string): Promise<string[]>
  disableTwoFactor(input: TwoFactorDisableInput): Promise<void>
  listSessions(): Promise<UserSession[]>
  endSession(id: string): Promise<void>
  endOtherSessions(): Promise<void>
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
  login(input: LoginInput): Promise<User | TwoFactorChallenge>
  completeTwoFactorLogin?(input: TwoFactorLoginInput): Promise<User>
  security?: SecurityActions
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
  exportData?(): Promise<Blob>
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
  completeTwoFactorLogin: (input: TwoFactorLoginInput) => Promise<User>
  security: SecurityActions | null
  refreshUser: () => Promise<void>
  respondToEvent: (token: string, status: EventReply) => Promise<EventResponse>
  exportData: (() => Promise<Blob>) | null
  enabled: boolean
  method: AuthMethod
  status: AuthStatus
  user: User | null
  expireSession: () => void
}
