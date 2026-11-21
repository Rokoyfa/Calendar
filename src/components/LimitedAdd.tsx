import type { ReactNode } from 'react'

type LimitedAddProps = {
  count: number
  max: number
  limitText: (max: number) => string
  children: ReactNode
}

export function LimitedAdd({ count, max, limitText, children }: LimitedAddProps) {
  return count < max ? children : <p className="formHint">{limitText(max)}</p>
}
