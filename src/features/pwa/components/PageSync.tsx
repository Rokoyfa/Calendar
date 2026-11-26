import { useEffect } from 'react'
import { useRootElement } from '../../../context/RootElementContext.ts'
import { useI18n } from '../../../i18n/index.ts'
import { usePreferences } from '../../preferences/index.ts'
import { applyThemeColor, isPageSyncEnabled } from '../utils/pageSync.ts'

export function PageSync() {
  const root = useRootElement()
  const { locale } = useI18n()
  const { preferences } = usePreferences()
  const enabled = isPageSyncEnabled()

  useEffect(() => {
    if (enabled) document.documentElement.lang = locale
  }, [enabled, locale])

  useEffect(() => {
    if (!enabled) return
    const update = () => applyThemeColor(root)
    update()
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)')
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'style'] })
    const onTransition = (event: TransitionEvent) => {
      if (event.target === root) update()
    }
    root.addEventListener('transitionend', onTransition)
    scheme?.addEventListener('change', update)
    return () => {
      observer.disconnect()
      root.removeEventListener('transitionend', onTransition)
      scheme?.removeEventListener('change', update)
    }
  }, [enabled, root, preferences.theme])

  return null
}
