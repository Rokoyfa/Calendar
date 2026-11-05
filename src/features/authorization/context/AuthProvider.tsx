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
import { AuthContext } from './AuthContext.ts'

type AuthProviderProps = {
  repository: AuthRepository
  enabled: boolean
  children: ReactNode
}

type Session = {
  status: AuthStatus
  user: User | null
}

const ANONYMOUS: Session = { status: 'anonymous', user: null }

const authenticated = (user: User): Session => ({ status: 'authenticated', user })

export function AuthProvider({ repository, enabled, children }: AuthProviderProps) {
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
    }),
    [repository],
  )

  const expireSession = useCallback(() => setSession(ANONYMOUS), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled,
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
    [enabled, session, accountRequests, login, register, logout, updateProfile, deleteAccount, verifyEmail, expireSession],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
