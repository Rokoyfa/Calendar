import { useState } from 'react'
import { Button } from '../../../components/Button.tsx'
import { useI18n } from '../../../i18n/index.ts'

const tipsKey = (scope: string) => `calendar.tipsSeen.v1.${scope}`

const readTipsSeen = (scope: string) => {
  try {
    return localStorage.getItem(tipsKey(scope)) === 'true'
  } catch {
    return false
  }
}

const writeTipsSeen = (scope: string) => {
  try {
    localStorage.setItem(tipsKey(scope), 'true')
  } catch {
    return
  }
}

const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

type OnboardingTipsProps = {
  scope: string
  canCreate: boolean
  canSwitch: boolean
  hasShortcuts: boolean
  hasTasks: boolean
}

export function OnboardingTips({ scope, canCreate, canSwitch, hasShortcuts, hasTasks }: OnboardingTipsProps) {
  const { m } = useI18n()
  const text = m.calendar.tips
  const [isDone, setIsDone] = useState(() => readTipsSeen(scope))
  const [index, setIndex] = useState(0)
  const touch = isTouchDevice()
  const tips = [
    canCreate && (touch ? text.createTouch : text.create),
    text.peek,
    canSwitch && text.switch,
    text.jump,
    touch ? text.swipe : hasShortcuts && text.shortcuts,
    hasTasks && text.tasks,
  ].filter((tip): tip is string => typeof tip === 'string')

  if (isDone || tips.length === 0) return null

  const finish = () => {
    writeTipsSeen(scope)
    setIsDone(true)
  }
  const isLast = index >= tips.length - 1

  return (
    <aside className="onboardingTip surface" aria-label={text.label} aria-live="polite">
      <p className="onboardingTipCount">{text.count(index + 1, tips.length)}</p>
      <p className="onboardingTipText">{tips[index]}</p>
      <div className="onboardingTipActions">
        {!isLast && (
          <Button variant="secondary" onClick={finish}>
            {text.skip}
          </Button>
        )}
        <Button onClick={isLast ? finish : () => setIndex(index + 1)}>{isLast ? text.done : text.next}</Button>
      </div>
    </aside>
  )
}
