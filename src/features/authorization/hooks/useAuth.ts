import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.ts'

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.')
  return auth
}
