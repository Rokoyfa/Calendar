import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { classNames } from '../utils/classNames.ts'

export type TabDefinition<T extends string> = {
  value: T
  label: string
  content: ReactNode
  invalid?: boolean
}

type TabsProps<T extends string> = {
  label: string
  tabs: readonly TabDefinition<T>[]
  value: T
  stable?: boolean
  onChange: (value: T) => void
}

const STEP_BY_KEY: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 }

export function Tabs<T extends string>({ label, tabs, value, stable = false, onChange }: TabsProps<T>) {
  const idPrefix = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.value === value),
    0,
  )
  const active = tabs[activeIndex]
  const tabId = (tab: T) => `${idPrefix}-tab-${tab}`
  const panelId = (tab: T) => `${idPrefix}-panel-${tab}`
  const renderPanel = (tab: TabDefinition<T>) => {
    const isActive = tab.value === active.value
    return (
      <div
        key={tab.value}
        id={panelId(tab.value)}
        role="tabpanel"
        aria-labelledby={tabId(tab.value)}
        className="tabPanel"
        inert={!isActive}
      >
        {tab.content}
      </div>
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = STEP_BY_KEY[event.key]
    if (!step) return
    event.preventDefault()
    const next = tabs[(activeIndex + step + tabs.length) % tabs.length]
    onChange(next.value)
    listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(tabId(next.value))}`)?.focus()
  }

  return (
    <div className={classNames('tabs', stable && 'tabs--stable')}>
      <div ref={listRef} className="tabList" role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
        {tabs.map((tab) => {
          const isActive = tab.value === active.value
          return (
            <button
              key={tab.value}
              id={tabId(tab.value)}
              type="button"
              role="tab"
              className={classNames('tab', isActive && 'active', tab.invalid && 'tab--invalid')}
              aria-selected={isActive}
              aria-controls={panelId(tab.value)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {stable ? <div className="tabPanels">{tabs.map(renderPanel)}</div> : renderPanel(active)}
    </div>
  )
}
