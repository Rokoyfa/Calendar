import { useI18n } from '../i18n/index.ts'

export function PageLoading() {
  const { m } = useI18n()
  return <p className="appLoading">{m.common.loading}</p>
}
