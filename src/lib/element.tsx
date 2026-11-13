import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { CalendarDataSource } from '../data/index.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import { isCalendarView, type CalendarView } from '../utils/calendarView.ts'
import type { CalendarEvent } from '../utils/event.ts'
import { isOneOf } from '../utils/object.ts'
import { CalendarWidget } from './CalendarWidget.tsx'
import {
  FEATURE_NAMES,
  HOLIDAY_SOURCES,
  HOST_THEMES,
  STORAGE_MODES,
  type CalendarConfigSource,
  type CalendarFeature,
  type CalendarFeatures,
  type CalendarProps,
} from './config.ts'
import type { DeletedEvent } from './eventCallbacks.ts'
import type { MessageOverrides } from '../i18n/index.ts'
import { VERSION } from './version.ts'

export const DEFAULT_ELEMENT_NAME = 'calendar-widget'

const FILL = { height: '100%' }

export const toFeatureAttribute = (feature: CalendarFeature) =>
  `feature-${feature.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`

const FEATURE_ALIASES: Partial<Record<CalendarFeature, string>> = {
  auth: 'auth',
  teams: 'teams',
}

const ATTRIBUTES = [
  'config',
  'storage-mode',
  'api-base-url',
  'api-timeout-ms',
  'auth',
  'teams',
  'views',
  'initial-path',
  'locale',
  'tenant',
  'theme',
  'initial-view',
  'link-param',
  'time-zone',
  'holidays',
  'holiday-source',
  'map-url',
  ...FEATURE_NAMES.map(toFeatureAttribute),
]

export class CalendarElement extends HTMLElement {
  static observedAttributes = ATTRIBUTES
  static readonly version = VERSION

  #root: Root | null = null
  #dataSource: CalendarDataSource | undefined
  #getUserToken: UserTokenProvider | undefined
  #messages: MessageOverrides | undefined
  #config: CalendarConfigSource | undefined

  get dataSource() {
    return this.#dataSource
  }

  set dataSource(value: CalendarDataSource | undefined) {
    this.#dataSource = value
    if (this.#root) this.#render()
  }

  get getUserToken() {
    return this.#getUserToken
  }

  set getUserToken(value: UserTokenProvider | undefined) {
    this.#getUserToken = value
    if (this.#root) this.#render()
  }

  get messages() {
    return this.#messages
  }

  set messages(value: MessageOverrides | undefined) {
    this.#messages = value
    if (this.#root) this.#render()
  }

  get config() {
    return this.#config ?? this.getAttribute('config') ?? undefined
  }

  set config(value: CalendarConfigSource | undefined) {
    this.#config = value
    if (this.#root) this.#render()
  }

  connectedCallback() {
    this.#adoptEarlyProperty('config')
    this.#adoptEarlyProperty('dataSource')
    this.#adoptEarlyProperty('getUserToken')
    this.#adoptEarlyProperty('messages')
    if (!this.style.display) this.style.display = 'block'
    this.#root ??= createRoot(this)
    this.#render()
  }

  #adoptEarlyProperty(name: 'dataSource' | 'getUserToken' | 'messages' | 'config') {
    if (!Object.hasOwn(this, name)) return
    const value = this[name]
    delete (this as Partial<Record<typeof name, unknown>>)[name]
    this[name] = value as never
  }

  disconnectedCallback() {
    const root = this.#root
    this.#root = null
    queueMicrotask(() => root?.unmount())
  }

  attributeChangedCallback() {
    if (this.#root) this.#render()
  }

  #features() {
    const features: Partial<CalendarFeatures> = {}
    for (const feature of FEATURE_NAMES) {
      const alias = FEATURE_ALIASES[feature]
      const value = this.getAttribute(toFeatureAttribute(feature)) ?? (alias ? this.getAttribute(alias) : null)
      if (value !== null) features[feature] = value !== 'false'
    }
    return features
  }

  #views() {
    const views = (this.getAttribute('views') ?? '').split(/[\s,]+/).filter(isCalendarView)
    return views.length > 0 ? (views as CalendarView[]) : undefined
  }

  #emit(type: string, detail: CalendarEvent | DeletedEvent) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }))
  }

  #onEventCreate = (event: CalendarEvent) => this.#emit('event-create', event)
  #onEventUpdate = (event: CalendarEvent) => this.#emit('event-update', event)
  #onEventDelete = (event: DeletedEvent) => this.#emit('event-delete', event)

  #props(): CalendarProps {
    const storageMode = this.getAttribute('storage-mode')
    const timeout = Number(this.getAttribute('api-timeout-ms'))
    const theme = this.getAttribute('theme')
    const initialView = this.getAttribute('initial-view')
    const linkParam = this.getAttribute('link-param')
    const holidaySource = this.getAttribute('holiday-source')
    return {
      storageMode: isOneOf(STORAGE_MODES, storageMode) ? storageMode : undefined,
      apiBaseUrl: this.getAttribute('api-base-url') ?? undefined,
      apiTimeoutMs: Number.isInteger(timeout) && timeout > 0 ? timeout : undefined,
      config: this.config,
      features: this.#features(),
      views: this.#views(),
      initialPath: this.getAttribute('initial-path') ?? undefined,
      locale: this.getAttribute('locale') ?? undefined,
      tenant: this.getAttribute('tenant') ?? undefined,
      theme: isOneOf(HOST_THEMES, theme) ? theme : undefined,
      initialView: isCalendarView(initialView) ? initialView : undefined,
      timeZone: this.getAttribute('time-zone') ?? undefined,
      holidays: this.getAttribute('holidays') ?? undefined,
      mapUrl: this.getAttribute('map-url') ?? undefined,
      holidaySource: isOneOf(HOLIDAY_SOURCES, holidaySource) ? holidaySource : undefined,
      linkParam: linkParam === 'false' ? false : (linkParam ?? undefined),
      onEventCreate: this.#onEventCreate,
      onEventUpdate: this.#onEventUpdate,
      onEventDelete: this.#onEventDelete,
      dataSource: this.#dataSource,
      getUserToken: this.#getUserToken,
      messages: this.#messages,
    }
  }

  #render() {
    this.#root?.render(
      <StrictMode>
        <CalendarWidget {...this.#props()} routing="memory" style={FILL} />
      </StrictMode>,
    )
  }
}

export function defineCalendarElement(name = DEFAULT_ELEMENT_NAME) {
  if (!customElements.get(name)) customElements.define(name, class extends CalendarElement {})
}
