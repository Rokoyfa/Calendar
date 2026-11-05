import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { DEFAULT_PREFERENCES, type Preferences, type Theme } from '../../../utils/preferences.ts'
import { usePreferencesRepository } from '../../storage/index.ts'
import { PreferencesContext, type PreferencesContextValue } from './PreferencesContext.ts'

const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const repository = usePreferencesRepository()
  const load = useCallback(() => repository.get(), [repository])
  const { data: preferences, isLoading, setData } = useAsyncResource(load, DEFAULT_PREFERENCES)

  useEffect(() => applyTheme(preferences.theme), [preferences.theme])

  const updatePreferences = useCallback(
    async (changes: Partial<Preferences>) => setData(await repository.update(changes)),
    [repository, setData],
  )

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, updatePreferences }),
    [preferences, updatePreferences],
  )

  if (isLoading) return null
  return <PreferencesContext value={value}>{children}</PreferencesContext>
}
