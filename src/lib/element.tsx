import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CalendarWidget } from './CalendarWidget.tsx'
import { STORAGE_MODES, type CalendarProps } from './config.ts'
import { isOneOf } from '../utils/object.ts'

export const DEFAULT_ELEMENT_NAME = 'calendar-widget'

const FILL = { height: '100%' }

const ATTRIBUTES = ['storage-mode', 'api-base-url', 'api-timeout-ms', 'auth', 'teams', 'initial-path'] as const

export class CalendarElement extends HTMLElement {
  static observedAttributes = ATTRIBUTES

  #root: Root | null = null

  connectedCallback() {
    if (!this.style.display) this.style.display = 'block'
    this.#root ??= createRoot(this)
    this.#render()
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
