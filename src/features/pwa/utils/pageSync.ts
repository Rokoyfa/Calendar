let enabled = false

export const enablePageSync = () => {
  enabled = true
}

export const isPageSyncEnabled = () => enabled

const TRANSPARENT = /^(transparent|rgba\(0, 0, 0, 0\))$/

export const applyThemeColor = (root: HTMLElement) => {
  const color = getComputedStyle(root).backgroundColor
  if (!color || TRANSPARENT.test(color)) return
  const [first, ...others] = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
  for (const other of others) other.remove()
  let meta = first
  meta?.removeAttribute('media')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
  }
  if (meta.content !== color) meta.content = color
}
