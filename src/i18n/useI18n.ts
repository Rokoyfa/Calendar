import { useRequiredContext } from '../hooks/useRequiredContext.ts'
import { I18nContext } from './I18nContext.ts'

export const useI18n = () => useRequiredContext(I18nContext, 'I18nProvider')
