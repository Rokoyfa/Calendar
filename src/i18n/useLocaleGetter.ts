import { useCallback, useEffect, useRef } from 'react'
import { useI18n } from './useI18n.ts'

export function useLocaleGetter() {
  const { locale } = useI18n()
  const localeRef = useRef(locale)

  useEffect(() => {
    localeRef.current = locale
  }, [locale])

  return useCallback(() => localeRef.current, [])
}
