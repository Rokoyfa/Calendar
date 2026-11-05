import { createContext } from 'react'
import type { Preferences } from '../../../utils/preferences.ts'

export type PreferencesContextValue = {
  preferences: Preferences
  updatePreferences: (changes: Partial<Preferences>) => Promise<void>
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)
