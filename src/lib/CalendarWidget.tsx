import { useMemo } from 'react'
import { CalendarApp } from './CalendarApp.tsx'
import { DEFAULT_CONFIG, type CalendarConfig, type CalendarProps } from './config.ts'
import { IsolatedRoot } from './IsolatedRoot.tsx'

export function CalendarWidget({
  storageMode = DEFAULT_CONFIG.storageMode,
  apiBaseUrl = DEFAULT_CONFIG.apiBaseUrl,
  apiTimeoutMs = DEFAULT_CONFIG.apiTimeoutMs,
  features,
  routing = 'memory',
  basename,
  initialPath,
  className,
  style,
}: CalendarProps) {
  const auth = features?.auth ?? DEFAULT_CONFIG.features.auth
  const teams = features?.teams ?? DEFAULT_CONFIG.features.teams
  const config = useMemo<CalendarConfig>(
    () => ({ storageMode, apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''), apiTimeoutMs, features: { auth, teams } }),
    [storageMode, apiBaseUrl, apiTimeoutMs, auth, teams],
  )

  return (
    <IsolatedRoot className={className} style={style} autoFocus={routing === 'browser'}>
      <CalendarApp config={config} routing={routing} basename={basename} initialPath={initialPath} />
    </IsolatedRoot>
  )
}
