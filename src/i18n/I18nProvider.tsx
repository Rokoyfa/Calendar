import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRootElement } from '../context/RootElementContext.ts'
import { createFormatter } from './format.ts'
import { I18nContext, type I18nContextValue } from './I18nContext.ts'
import { getBrowserLanguages, getLanguage, resolveLocale } from './locale.ts'
import { MESSAGES } from './messages/index.ts'
import { getWeekInfo } from './weekInfo.ts'

type I18nProviderProps = {
  locale?: string
  children: ReactNode
}

export function I18nProvider({ locale: hostLocale, children }: I18nProviderProps) {
  const root = useRootElement()
  const [userLocale, setUserLocale] = useState<string | null>(null)
  const locale = useMemo(
    () => resolveLocale({ user: userLocale, host: hostLocale, browser: getBrowserLanguages() }),
    [userLocale, hostLocale],
  )

  useEffect(() => root.setAttribute('lang', locale), [root, locale])

  const value = useMemo<I18nContextValue>(() => {
    const language = getLanguage(locale)
    const weekInfo = getWeekInfo(locale)
    return {
      locale,
      language,
      m: MESSAGES[language],
      format: createFormatter(locale, weekInfo.firstDay),
      weekInfo,
      setUserLocale,
    }
  }, [locale])

  return <I18nContext value={value}>{children}</I18nContext>
}
