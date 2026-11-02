import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthContextValue, AuthRepository, AuthStatus, LoginInput, RegisterInput, User } from '../types/auth.ts'
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

  const login = useCallback(
    async (input: LoginInput) => {
      const user = await repository.login(input)
      setSession(authenticated(user))
      return user
    },
    [repository],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const user = await repository.register(input)
      setSession(authenticated(user))
      return user
    },
    [repository],
  )

  const logout = useCallback(async () => {
    try {
      await repository.logout()
    } finally {
      setSession(ANONYMOUS)
    }
  }, [repository])

  const expireSession = useCallback(() => setSession(ANONYMOUS), [])

  const value = useMemo<AuthContextValue>(
    () => ({ enabled, ...session, login, register, logout, expireSession }),
    [enabled, session, login, register, logout, expireSession],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
