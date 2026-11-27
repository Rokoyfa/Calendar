import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../../../components/Button.tsx'
import { useI18n } from '../../../i18n/index.ts'
import {
  buildTourSteps,
  findTourTargets,
  placeTourBubble,
  unionRect,
  type TourOptions,
  type TourRect,
  type TourStep,
} from '../utils/tour.ts'

const RING_PADDING_PX = 6

type Layout = { ring: TourRect | null; bubble: { left: number; top: number } | null }

type OnboardingTourProps = {
  options: TourOptions
  focusOnStart: boolean
  onClose: () => void
}

const rootOf = (element: HTMLElement) => element.getRootNode() as Document | ShadowRoot

export function OnboardingTour({ options, focusOnStart, onClose }: OnboardingTourProps) {
  const { m } = useI18n()
  const text = m.calendar.tour
  const titleId = useId()
  const layerRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const [steps, setSteps] = useState<readonly TourStep[] | null>(null)
  const [index, setIndex] = useState(0)
  const [layout, setLayout] = useState<Layout>({ ring: null, bubble: null })
  const step = steps?.[index]

  useLayoutEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    const root = rootOf(layer)
    setSteps(
      buildTourSteps(text, options).filter(
        (candidate) => !candidate.target || findTourTargets(root, candidate.target).length > 0,
      ),
    )
  }, [text, options])

  useLayoutEffect(() => {
    const layer = layerRef.current
    const bubble = bubbleRef.current
    if (!layer || !bubble || !step) return
    let frame = 0
    if (step.target)
      findTourTargets(rootOf(layer), step.target)[0]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const measure = () => {
      const area = layer.getBoundingClientRect()
      const target = step.target ? unionRect(findTourTargets(rootOf(layer), step.target)) : null
      const ring = target && {
        left: target.left - area.left - RING_PADDING_PX,
        top: target.top - area.top - RING_PADDING_PX,
        width: target.width + RING_PADDING_PX * 2,
        height: target.height + RING_PADDING_PX * 2,
      }
      const size = bubble.getBoundingClientRect()
      setLayout({ ring, bubble: placeTourBubble(ring, size, area) })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    const observer = new ResizeObserver(schedule)
    observer.observe(layer)
    observer.observe(bubble)
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [step])

  const isPlaced = layout.bubble !== null
  const hasFocused = useRef(false)
  useEffect(() => {
    if (!focusOnStart || !isPlaced || hasFocused.current) return
    hasFocused.current = true
    primaryRef.current?.focus({ preventScroll: true })
  }, [focusOnStart, isPlaced])

  if (steps && steps.length === 0) return null
  const isLast = steps !== null && index >= steps.length - 1
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    onClose()
  }

  return (
    <div ref={layerRef} className="tourLayer" data-dimmed={layout.ring === null || undefined}>
      {layout.ring && (
        <div
          className="tourRing"
          aria-hidden="true"
          style={{
            left: layout.ring.left,
            top: layout.ring.top,
            width: layout.ring.width,
            height: layout.ring.height,
          }}
        />
      )}
      <div
        ref={bubbleRef}
        className="tourBubble surface"
        role="dialog"
        aria-labelledby={titleId}
        data-step={step?.id}
        style={layout.bubble ? { left: layout.bubble.left, top: layout.bubble.top } : { visibility: 'hidden' }}
        onKeyDown={handleKeyDown}
      >
        {step && steps && (
          <>
            <p className="tourCount" aria-live="polite">
              {text.count(index + 1, steps.length)}
            </p>
            <h2 id={titleId} className="tourTitle">
              {step.title}
            </h2>
            <p className="tourText">{step.text}</p>
            <div className="tourActions">
              {!isLast && (
                <Button variant="secondary" className="tourClose" onClick={onClose}>
                  {text.close}
                </Button>
              )}
              <span className="tourActionsEnd">
                {index > 0 && (
                  <Button variant="outline" onClick={() => setIndex(index - 1)}>
                    {text.back}
                  </Button>
                )}
                <Button ref={primaryRef} onClick={isLast ? onClose : () => setIndex(index + 1)}>
                  {isLast ? text.done : text.next}
                </Button>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
