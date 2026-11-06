import { createContext, use } from 'react'

export const RootElementContext = createContext<HTMLElement | null>(null)

export function useRootElement() {
  const root = use(RootElementContext)
  if (!root) throw new Error('useRootElement must be used inside <Calendar>.')
  return root
}
