import { useContext } from 'react'
import { PreferencesContext } from '../context/PreferencesContext.ts'

export function usePreferences() {
  const preferences = useContext(PreferencesContext)
  if (!preferences) throw new Error('usePreferences muss innerhalb von <PreferencesProvider> verwendet werden.')
  return preferences
}
