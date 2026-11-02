export type User = {
  id: string
  email: string
  name: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput & {
  name: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthRepository {
  getCurrentUser(): Promise<User | null>
  login(input: LoginInput): Promise<User>
  register(input: RegisterInput): Promise<User>
  logout(): Promise<void>
}

export type AuthContextValue = {
  enabled: boolean
  status: AuthStatus
  user: User | null
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
  expireSession: () => void
}
