import { useEffect, useMemo, useRef } from 'react'
import { HostContext, type HostOptions } from '../context/HostContext.ts'
import { localDataSource, restDataSource, tenantDataSource } from '../data/index.ts'
import { I18nProvider } from '../i18n/index.ts'
import { HOLIDAYS_OFF, isHolidayRegion } from '../utils/holidays.ts'
import { isMapUrlTemplate } from '../utils/location.ts'
import { isTimeZone } from '../utils/timeZone.ts'
import { CalendarApp } from './CalendarApp.tsx'
import { DEFAULT_CONFIG, type CalendarProps } from './config.ts'
import type { EventCallbacks } from './eventCallbacks.ts'
import { IsolatedRoot } from './IsolatedRoot.tsx'
import { DEFAULT_LINK_PARAM, readLinkedPath } from './linkParam.ts'

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
  linkParam = DEFAULT_LINK_PARAM,
  locale,
  messages,
  theme,
  initialView,
  timeZone,
  holidays,
  holidaySource,
  mapUrl,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className,
  style,
}: CalendarProps) {
  const auth = features?.auth ?? DEFAULT_CONFIG.features.auth
  const teams = features?.teams ?? DEFAULT_CONFIG.features.teams
  const dataSource = useMemo(
    () =>
      providedDataSource ??
      (tenant
        ? tenantDataSource({ tenant, baseUrl: apiBaseUrl, timeoutMs: apiTimeoutMs, getUserToken, holidaySource })
        : auth || storageMode === 'remote'
          ? restDataSource({ baseUrl: apiBaseUrl, timeoutMs: apiTimeoutMs, auth, getUserToken, holidaySource })
          : localDataSource()),
    [providedDataSource, tenant, getUserToken, auth, storageMode, apiBaseUrl, apiTimeoutMs, holidaySource],
  )
  const viewerTimeZone = timeZone && isTimeZone(timeZone) ? timeZone : undefined
  const holidayRegion = holidays?.trim().toUpperCase()
  const hostHolidays =
    holidays?.trim().toLowerCase() === HOLIDAYS_OFF
      ? HOLIDAYS_OFF
      : isHolidayRegion(holidayRegion)
        ? holidayRegion
        : undefined
  const hostMapUrl = isMapUrlTemplate(mapUrl) ? mapUrl : undefined
  const host = useMemo<HostOptions>(
    () => ({ teams, theme, initialView, timeZone: viewerTimeZone, holidays: hostHolidays, mapUrl: hostMapUrl }),
    [teams, theme, initialView, viewerTimeZone, hostHolidays, hostMapUrl],
  )
  const callbacks = useRef<EventCallbacks>({})
  useEffect(() => {
    callbacks.current = { onEventCreate, onEventUpdate, onEventDelete }
  }, [onEventCreate, onEventUpdate, onEventDelete])
  const startPath = initialPath ?? (routing === 'memory' && linkParam ? readLinkedPath(linkParam) : undefined)

  return (
    <IsolatedRoot className={className} style={style} autoFocus={routing === 'browser'}>
      <HostContext value={host}>
        <I18nProvider locale={locale} messages={messages}>
          <CalendarApp
            dataSource={dataSource}
            eventCallbacks={callbacks}
            routing={routing}
            basename={basename}
            initialPath={startPath}
          />
        </I18nProvider>
      </HostContext>
    </IsolatedRoot>
  )
}
