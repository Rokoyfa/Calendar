import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CalendarWidget } from './CalendarWidget.tsx'
import type { CalendarDataSource } from '../data/index.ts'
import type { UserTokenProvider } from '../features/authorization/index.ts'
import { STORAGE_MODES, type CalendarProps } from './config.ts'
import { isOneOf } from '../utils/object.ts'

export const DEFAULT_ELEMENT_NAME = 'calendar-widget'

const FILL = { height: '100%' }

const ATTRIBUTES = ['storage-mode', 'api-base-url', 'api-timeout-ms', 'auth', 'teams', 'initial-path', 'locale', 'tenant'] as const

export class CalendarElement extends HTMLElement {
  static observedAttributes = ATTRIBUTES

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
    return value !== null && value !== 'false'
  }

  #props(): CalendarProps {
    const storageMode = this.getAttribute('storage-mode')
    const timeout = Number(this.getAttribute('api-timeout-ms'))
    return {
      storageMode: isOneOf(STORAGE_MODES, storageMode) ? storageMode : undefined,
      apiBaseUrl: this.getAttribute('api-base-url') ?? undefined,
      apiTimeoutMs: Number.isInteger(timeout) && timeout > 0 ? timeout : undefined,
      features: { auth: this.#flag('auth'), teams: this.#flag('teams') },
      initialPath: this.getAttribute('initial-path') ?? undefined,
      locale: this.getAttribute('locale') ?? undefined,
      tenant: this.getAttribute('tenant') ?? undefined,
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
