export const withoutPropagation = (action: () => void) => (event: { stopPropagation: () => void }) => {
  event.stopPropagation()
  action()
}
