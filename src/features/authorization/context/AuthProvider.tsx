import type { EventReply } from '../../../utils/event.ts'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AccountDeletionInput,
  AuthContextValue,
  AuthRepository,
  AuthStatus,
  LoginInput,
  PasswordChangeInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  ProfileInput,
  RegisterInput,
  User,
} from '../types/auth.ts'
import { AppError } from '../../../utils/appError.ts'
import { AuthContext } from './AuthContext.ts'

type AuthProviderProps = {
  repository: AuthRepository | null
  children: ReactNode
}

const unavailable = () => Promise.reject(new AppError('unknown'))

const DISABLED_AUTH: AuthRepository = {
  getCurrentUser: async () => null,
  login: unavailable,
  register: unavailable,
  logout: async () => undefined,
  updateProfile: unavailable,
  changePassword: unavailable,
  deleteAccount: unavailable,
  requestPasswordReset: unavailable,
  resetPassword: unavailable,
  verifyEmail: unavailable,
  resendVerificationEmail: unavailable,
}

type Session = {
  status: AuthStatus
  user: User | null
}

const ANONYMOUS: Session = { status: 'anonymous', user: null }

const authenticated = (user: User): Session => ({ status: 'authenticated', user })

export function AuthProvider({ repository: configuredRepository, children }: AuthProviderProps) {
  const enabled = configuredRepository !== null
  const repository = configuredRepository ?? DISABLED_AUTH
  const method = repository.method ?? 'password'
  const [session, setSession] = useState<Session>(enabled ? { status: 'loading', user: null } : ANONYMOUS)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    repository
      .getCurrentUser()
      .then((user) => {
        if (!cancelled) setSession(user ? authenticated(user) : ANONYMOUS)
      })
      .catch(() => {
        if (!cancelled) setSession(ANONYMOUS)
      })
    return () => {
      cancelled = true
    }
  }, [repository, enabled])

  const signIn = useCallback(async (request: Promise<User>) => {
    const user = await request
    setSession(authenticated(user))
    return user
  }, [])

  const login = useCallback((input: LoginInput) => signIn(repository.login(input)), [repository, signIn])

  const register = useCallback((input: RegisterInput) => signIn(repository.register(input)), [repository, signIn])

  const updateProfile = useCallback(
    (input: ProfileInput) => signIn(repository.updateProfile(input)),
    [repository, signIn],
  )

  const logout = useCallback(async () => {
    try {
      await repository.logout()
    } finally {
      setSession(ANONYMOUS)
    }
  }, [repository])

  const deleteAccount = useCallback(
    async (input: AccountDeletionInput) => {
      await repository.deleteAccount(input)
      setSession(ANONYMOUS)
    },
    [repository],
  )

  const verifyEmail = useCallback(
    async (token: string) => {
      await repository.verifyEmail(token)
      setSession((current) => (current.user ? authenticated({ ...current.user, emailVerified: true }) : current))
    },
    [repository],
  )

  const accountRequests = useMemo(
    () => ({
      changePassword: (input: PasswordChangeInput) => repository.changePassword(input),
      requestPasswordReset: (input: PasswordResetRequestInput) => repository.requestPasswordReset(input),
      resetPassword: (input: PasswordResetInput) => repository.resetPassword(input),
      resendVerificationEmail: () => repository.resendVerificationEmail(),
      respondToEvent: (token: string, status: EventReply) =>
        repository.respondToEvent ? repository.respondToEvent(token, status) : unavailable(),
    }),
    [repository],
  )

  const expireSession = useCallback(() => {
    if (method !== 'hostToken') {
      setSession(ANONYMOUS)
      return
    }
    repository
      .getCurrentUser()
      .then((user) => setSession(user ? authenticated(user) : ANONYMOUS))
      .catch(() => setSession(ANONYMOUS))
  }, [method, repository])

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled,
      method,
      ...session,
      ...accountRequests,
      login,
      register,
      logout,
      updateProfile,
      deleteAccount,
      verifyEmail,
      expireSession,
    }),
    [
      enabled,
      method,
      session,
      accountRequests,
      login,
      register,
      logout,
      updateProfile,
      deleteAccount,
      verifyEmail,
      expireSession,
    ],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
