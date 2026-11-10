import { useMemo } from 'react'
import { localDataSource, restDataSource, tenantDataSource } from '../data/index.ts'
import { I18nProvider } from '../i18n/index.ts'
import { CalendarApp } from './CalendarApp.tsx'
import { DEFAULT_CONFIG, type CalendarProps } from './config.ts'
import { IsolatedRoot } from './IsolatedRoot.tsx'

export function CalendarWidget({
  dataSource: providedDataSource,
  tenant,
  getUserToken,
  storageMode = DEFAULT_CONFIG.storageMode,
  apiBaseUrl = DEFAULT_CONFIG.apiBaseUrl,
  apiTimeoutMs = DEFAULT_CONFIG.apiTimeoutMs,
  features,
  routing = 'memory',
  basename,
  initialPath,
  locale,
  className,
  style,
}: CalendarProps) {
  const auth = features?.auth ?? DEFAULT_CONFIG.features.auth
  const dataSource = useMemo(
    () =>
      providedDataSource ??
      (tenant
        ? tenantDataSource({ tenant, baseUrl: apiBaseUrl, timeoutMs: apiTimeoutMs, getUserToken })
        : auth || storageMode === 'remote'
          ? restDataSource({ baseUrl: apiBaseUrl, timeoutMs: apiTimeoutMs, auth, getUserToken })
          : localDataSource()),
    [providedDataSource, tenant, getUserToken, auth, storageMode, apiBaseUrl, apiTimeoutMs],
  )

  return (
    <IsolatedRoot className={className} style={style} autoFocus={routing === 'browser'}>
      <I18nProvider locale={locale}>
        <CalendarApp dataSource={dataSource} routing={routing} basename={basename} initialPath={initialPath} />
      </I18nProvider>
    </IsolatedRoot>
  )
}
