import type { ReactNode } from 'react'

export function Locked({ isLocked, children }: { isLocked: boolean; children: ReactNode }) {
  if (!isLocked) return children
  return (
    <fieldset className="readOnlyFields" disabled>
      {children}
    </fieldset>
  )
}
