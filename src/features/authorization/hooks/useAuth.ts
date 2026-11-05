import { useRequiredContext } from '../../../hooks/useRequiredContext.ts'
import { AuthContext } from '../context/AuthContext.ts'

export const useAuth = () => useRequiredContext(AuthContext, 'AuthProvider')
