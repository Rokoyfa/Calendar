import { useLayoutEffect, useState, type RefObject } from 'react'

export type HeaderFit = { isStacked: boolean; isSubtitleBelow: boolean }

const widthOf = (element: Element | null | undefined) => element?.getBoundingClientRect().width ?? 0

const sideBySideWidth = (title: HTMLElement) => {
  const { subtitle } = title.dataset
  title.dataset.subtitle = 'side'
  title.style.width = 'max-content'
  title.style.maxWidth = 'none'
  const width = widthOf(title)
  title.style.width = ''
  title.style.maxWidth = ''
  if (subtitle === undefined) delete title.dataset.subtitle
  else title.dataset.subtitle = subtitle
  return width
}

const measureHeader = (header: HTMLElement): HeaderFit => {
  const nav = header.querySelector(':scope > .headerNav')
  const center = header.querySelector(':scope > .headerCenter')
  const actions = header.querySelector(':scope > .headerActions')
  const title = center?.querySelector<HTMLElement>(':scope > .headerTitle')
  if (!nav || !center || !actions || !title) return { isStacked: false, isSubtitleBelow: false }
  const style = getComputedStyle(header)
  const available = header.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  const gap = parseFloat(style.columnGap) || 0
  const titleWidth = sideBySideWidth(title)
  const others = [...center.children].filter((child) => child !== title).map(widthOf)
  const middle = Math.max(titleWidth, ...others)
  const isStacked = 2 * Math.max(widthOf(nav), widthOf(actions)) + middle + 2 * gap > available + 0.5
  return { isStacked, isSubtitleBelow: isStacked && titleWidth > available + 0.5 }
}

const sameFit = (a: HeaderFit, b: HeaderFit) => a.isStacked === b.isStacked && a.isSubtitleBelow === b.isSubtitleBelow

export function useHeaderFit(headerRef: RefObject<HTMLElement | null>) {
  const [fit, setFit] = useState<HeaderFit>({ isStacked: false, isSubtitleBelow: false })

  useLayoutEffect(() => {
    const header = headerRef.current
    if (!header) return
    let frame = 0
    const update = () => {
      const next = measureHeader(header)
      setFit((current) => (sameFit(current, next) ? current : next))
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    })
    const observeParts = () => {
      observer.disconnect()
      observer.observe(header)
      for (const part of header.querySelectorAll(
        ':scope > .headerNav, :scope > .headerActions, :scope > .headerCenter, :scope > .headerCenter > *',
      ))
        observer.observe(part)
    }
    const mutations = new MutationObserver(() => {
      observeParts()
      update()
    })
    observeParts()
    mutations.observe(header, { childList: true, subtree: true, characterData: true })
    update()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      mutations.disconnect()
    }
  }, [headerRef])

  return fit
}
