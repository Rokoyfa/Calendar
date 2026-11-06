import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useRootElement } from '../../../context/RootElementContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import { DEFAULT_PREFERENCES, type Preferences, type Theme } from '../../../utils/preferences.ts'
import { usePreferencesRepository } from '../../storage/index.ts'
import { PreferencesContext, type PreferencesContextValue } from './PreferencesContext.ts'

const applyTheme = (root: HTMLElement, theme: Theme) => {
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const root = useRootElement()
  const { setUserLocale } = useI18n()
  const repository = usePreferencesRepository()
  const load = useCallback(() => repository.get(), [repository])
  const { data: preferences, isLoading, apply } = useAsyncResource(load, DEFAULT_PREFERENCES)

  useEffect(() => applyTheme(root, preferences.theme), [root, preferences.theme])

  useEffect(() => {
    setUserLocale(preferences.locale)
    return () => setUserLocale(null)
  }, [setUserLocale, preferences.locale])

  const updatePreferences = useCallback(
    async (changes: Partial<Preferences>) => {
      await apply(repository.update(changes))
    },
    [repository, apply],
  )

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, updatePreferences }),
    [preferences, updatePreferences],
  )

  if (isLoading) return null
  return <PreferencesContext value={value}>{children}</PreferencesContext>
}
