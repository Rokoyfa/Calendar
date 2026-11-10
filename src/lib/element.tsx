import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { CalendarDataSource } from '../data/index.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import { isCalendarView } from '../utils/calendarView.ts'
import type { CalendarEvent } from '../utils/event.ts'
import { isOneOf } from '../utils/object.ts'
import { CalendarWidget } from './CalendarWidget.tsx'
import { STORAGE_MODES, type CalendarProps } from './config.ts'
import type { DeletedEvent } from './eventCallbacks.ts'
import { VERSION } from './version.ts'

export const DEFAULT_ELEMENT_NAME = 'calendar-widget'

const FILL = { height: '100%' }

const THEMES = ['light', 'dark'] as const

const ATTRIBUTES = ['storage-mode', 'api-base-url', 'api-timeout-ms', 'auth', 'teams', 'initial-path', 'locale', 'tenant', 'theme', 'initial-view', 'link-param'] as const

export class CalendarElement extends HTMLElement {
  static observedAttributes = ATTRIBUTES
  static readonly version = VERSION

  #root: Root | null = null
  #dataSource: CalendarDataSource | undefined
  #getUserToken: UserTokenProvider | undefined

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

  connectedCallback() {
    this.#adoptEarlyProperty('dataSource')
    this.#adoptEarlyProperty('getUserToken')
    if (!this.style.display) this.style.display = 'block'
    this.#root ??= createRoot(this)
    this.#render()
  }

  #adoptEarlyProperty(name: 'dataSource' | 'getUserToken') {
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

  #flag(name: 'auth' | 'teams') {
    const value = this.getAttribute(name)
    return value === null ? undefined : value !== 'false'
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
    return {
      storageMode: isOneOf(STORAGE_MODES, storageMode) ? storageMode : undefined,
      apiBaseUrl: this.getAttribute('api-base-url') ?? undefined,
      apiTimeoutMs: Number.isInteger(timeout) && timeout > 0 ? timeout : undefined,
      features: { auth: this.#flag('auth'), teams: this.#flag('teams') },
      initialPath: this.getAttribute('initial-path') ?? undefined,
      locale: this.getAttribute('locale') ?? undefined,
      tenant: this.getAttribute('tenant') ?? undefined,
      theme: isOneOf(THEMES, theme) ? theme : undefined,
      initialView: isCalendarView(initialView) ? initialView : undefined,
      linkParam: linkParam === 'false' ? false : (linkParam ?? undefined),
      onEventCreate: this.#onEventCreate,
      onEventUpdate: this.#onEventUpdate,
      onEventDelete: this.#onEventDelete,
      dataSource: this.#dataSource,
      getUserToken: this.#getUserToken,
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
