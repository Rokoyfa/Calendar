import type { CSSProperties } from 'react'
import { classNames } from '../../../utils/classNames.ts'
import { useI18n } from '../../../i18n/index.ts'

type NowIndicatorProps = {
  minutes: number
  isToday: boolean
}

export function NowIndicator({ minutes, isToday }: NowIndicatorProps) {
  const { m, format } = useI18n()
  return (
    <div
      className={classNames('nowIndicator', isToday && 'nowIndicator--today')}
      style={{ '--now-minutes': minutes } as CSSProperties}
      title={isToday ? m.calendar.now(format.time(minutes)) : undefined}
      aria-hidden="true"
    />
  )
}
