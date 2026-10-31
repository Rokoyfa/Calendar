import type { CSSProperties } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { minutesToTime } from '../../../utils/date.ts'

type NowIndicatorProps = {
  minutes: number
  isToday: boolean
}

export function NowIndicator({ minutes, isToday }: NowIndicatorProps) {
  return (
    <div
      className={classNames('nowIndicator', isToday && 'nowIndicator--today')}
      style={{ '--now-minutes': minutes } as CSSProperties}
      title={isToday ? `Jetzt: ${minutesToTime(minutes)}` : undefined}
      aria-hidden="true"
    />
  )
}
