import { useRequiredContext } from '../../../hooks/useRequiredContext.ts'
import { PreferencesContext } from '../context/PreferencesContext.ts'

export const usePreferences = () => useRequiredContext(PreferencesContext, 'PreferencesProvider')
