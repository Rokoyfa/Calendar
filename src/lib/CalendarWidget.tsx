import { useEffect, useMemo, useRef } from 'react'
import { HostContext, type HostOptions } from '../context/HostContext.ts'
import { localDataSource, restDataSource, tenantDataSource } from '../data/index.ts'
import { I18nProvider, useI18n } from '../i18n/index.ts'
import { HOLIDAYS_OFF, isHolidayRegion } from '../utils/holidays.ts'
import { isMapUrlTemplate } from '../utils/location.ts'
import { isTimeZone } from '../utils/timeZone.ts'
import { CalendarApp } from './CalendarApp.tsx'
import { DEFAULT_CONFIG, type CalendarProps } from './config.ts'
import { resolveFeatures, resolveViews } from './defaults.ts'
import type { EventCallbacks } from './eventCallbacks.ts'
import { IsolatedRoot } from './IsolatedRoot.tsx'
import { DEFAULT_LINK_PARAM, readLinkedPath } from './linkParam.ts'
import { mergeCalendarOptions, type CalendarOptions } from './options.ts'
import { useCalendarOptions } from './useCalendarOptions.ts'

type ConfiguredCalendarProps = EventCallbacks &
  Pick<CalendarProps, 'dataSource' | 'getUserToken'> & {
    options: CalendarOptions
  }

function ConfigStatus({ failed }: { failed: boolean }) {
  const { m } = useI18n()
  return (
    <p className="appLoading" role={failed ? 'alert' : 'status'}>
      {failed ? m.common.configError : m.common.loading}
    </p>
  )
}

function ConfiguredCalendar({
  options,
  dataSource: providedDataSource,
  getUserToken,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
}: ConfiguredCalendarProps) {
  const {
    tenant,
    storageMode = DEFAULT_CONFIG.storageMode,
    apiBaseUrl = DEFAULT_CONFIG.apiBaseUrl,
    apiTimeoutMs = DEFAULT_CONFIG.apiTimeoutMs,
    routing = 'memory',
    basename,
    initialPath,
    linkParam = DEFAULT_LINK_PARAM,
    theme,
    initialView,
    timeZone,
    holidays,
    holidaySource,
    mapUrl,
  } = options
  const featureKey = JSON.stringify(options.features ?? {})
  const features = useMemo(() => resolveFeatures(JSON.parse(featureKey) as CalendarOptions['features']), [featureKey])
  const viewKey = options.views?.join() ?? ''
  const views = useMemo(
    () => resolveViews(viewKey ? (viewKey.split(',') as CalendarOptions['views']) : undefined),
    [viewKey],
  )
  const { auth, chat } = features
  const holidayBackend = features.holidays ? holidaySource : 'library'
  const dataSource = useMemo(() => {
    if (providedDataSource) return providedDataSource
    const rest = {
      baseUrl: apiBaseUrl,
      timeoutMs: apiTimeoutMs,
      getUserToken,
      holidaySource: holidayBackend,
      chat,
    }
    if (tenant) return tenantDataSource({ ...rest, tenant })
    return auth || storageMode === 'remote' ? restDataSource({ ...rest, auth }) : localDataSource()
  }, [providedDataSource, tenant, getUserToken, auth, chat, storageMode, apiBaseUrl, apiTimeoutMs, holidayBackend])
  const viewerTimeZone = timeZone && isTimeZone(timeZone) ? timeZone : undefined
  const holidayRegion = holidays?.trim().toUpperCase()
  const hostHolidays =
    holidays?.trim().toLowerCase() === HOLIDAYS_OFF
      ? HOLIDAYS_OFF
      : isHolidayRegion(holidayRegion)
        ? holidayRegion
        : undefined
  const hostMapUrl = isMapUrlTemplate(mapUrl) ? mapUrl : undefined
  const hostView = initialView && views.includes(initialView) ? initialView : undefined
  const host = useMemo<HostOptions>(
    () => ({
      features,
      views,
      theme,
      initialView: hostView,
      timeZone: viewerTimeZone,
      holidays: hostHolidays,
      mapUrl: hostMapUrl,
    }),
    [features, views, theme, hostView, viewerTimeZone, hostHolidays, hostMapUrl],
  )
  const callbacks = useRef<EventCallbacks>({})
  useEffect(() => {
    callbacks.current = { onEventCreate, onEventUpdate, onEventDelete }
  }, [onEventCreate, onEventUpdate, onEventDelete])
  const startPath = initialPath ?? (routing === 'memory' && linkParam ? readLinkedPath(linkParam) : undefined)

  return (
    <HostContext value={host}>
      <CalendarApp
        dataSource={dataSource}
        eventCallbacks={callbacks}
        routing={routing}
        basename={basename}
        initialPath={startPath}
      />
    </HostContext>
  )
}

export function CalendarWidget({
  config,
  dataSource,
  getUserToken,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  className,
  style,
  ...direct
}: CalendarProps) {
  const state = useCalendarOptions(config)
  const options = state.status === 'ready' ? mergeCalendarOptions(state.options, direct) : direct
  const routing = options.routing ?? 'memory'

  return (
    <IsolatedRoot className={className} style={style} autoFocus={routing === 'browser'}>
      <I18nProvider locale={options.locale} messages={options.messages}>
        {state.status === 'ready' ? (
          <ConfiguredCalendar
            options={options}
            dataSource={dataSource}
            getUserToken={getUserToken}
            onEventCreate={onEventCreate}
            onEventUpdate={onEventUpdate}
            onEventDelete={onEventDelete}
          />
        ) : (
          <ConfigStatus failed={state.status === 'error'} />
        )}
      </I18nProvider>
    </IsolatedRoot>
  )
}
