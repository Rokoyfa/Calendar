import { createContext } from 'react'
import type { AuthContextValue } from '../types/auth.ts'

export const AuthContext = createContext<AuthContextValue | null>(null)
