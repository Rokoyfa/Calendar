const CLEANUP_MS = 60_000

export const printDocument = (html: string) => {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  Object.assign(frame.style, { position: 'fixed', width: '0', height: '0', border: '0', right: '0', bottom: '0' })
  let removed = false
  const remove = () => {
    if (removed) return
    removed = true
    frame.remove()
  }
  frame.addEventListener('load', () => {
    const view = frame.contentWindow
    if (!view) return remove()
    view.addEventListener('afterprint', () => setTimeout(remove, 0))
    view.focus()
    view.print()
    setTimeout(remove, CLEANUP_MS)
  })
  frame.srcdoc = html
  document.body.append(frame)
}
