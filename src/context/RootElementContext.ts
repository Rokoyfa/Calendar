import { createContext, use } from 'react'

export const RootElementContext = createContext<HTMLElement | null>(null)

export function useRootElement() {
  const root = use(RootElementContext)
  if (!root) throw new Error('useRootElement muss innerhalb von <Calendar> verwendet werden.')
  return root
}
