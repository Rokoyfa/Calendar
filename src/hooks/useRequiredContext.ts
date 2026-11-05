import { useContext, type Context } from 'react'

export function useRequiredContext<T>(context: Context<T | null>, providerName: string) {
  const value = useContext(context)
  if (value === null) throw new Error(`Dieser Hook muss innerhalb von <${providerName}> verwendet werden.`)
  return value
}
