import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from '../assets/css/index.css?inline'
import { RootElementContext } from '../context/RootElementContext.ts'
import { getAppearanceVariables } from './appearance.ts'
import type { CalendarAppearance } from './options.ts'

const ROOT_CLASS = 'calendarRoot'

let sharedSheet: CSSStyleSheet | null = null

const getStyleSheet = () => {
  if (!sharedSheet) {
    sharedSheet = new CSSStyleSheet()
    sharedSheet.replaceSync(styles)
  }
  return sharedSheet
}

type IsolatedRootProps = {
  className?: string
  style?: CSSProperties
  autoFocus?: boolean
  appearance?: CalendarAppearance
  children: ReactNode
}

export function IsolatedRoot({ className, style, autoFocus = false, appearance, children }: IsolatedRootProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [root, setRoot] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    shadow.adoptedStyleSheets = [getStyleSheet()]
    const element = document.createElement('div')
    element.className = ROOT_CLASS
    element.tabIndex = -1
    shadow.append(element)
    setRoot(element)
    if (autoFocus) element.focus({ preventScroll: true })
    return () => {
      element.remove()
      setRoot(null)
    }
  }, [autoFocus])

  const appearanceKey = JSON.stringify(appearance ?? {})
  useLayoutEffect(() => {
    if (!root) return
    const current = JSON.parse(appearanceKey) as CalendarAppearance
    const variables = getAppearanceVariables(current)
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value)
    root.toggleAttribute('data-compact', current.density === 'compact')
    return () => {
      for (const name of Object.keys(variables)) root.style.removeProperty(name)
    }
  }, [root, appearanceKey])

  return (
    <div ref={hostRef} className={className} style={style}>
      {root && createPortal(<RootElementContext value={root}>{children}</RootElementContext>, root)}
    </div>
  )
}
