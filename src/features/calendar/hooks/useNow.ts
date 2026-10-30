import { useEffect, useState } from 'react'

const MINUTE = 60_000

export function useNow() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let interval: number | undefined
    const tick = () => setNow(new Date())
    const timeout = window.setTimeout(() => {
      tick()
      interval = window.setInterval(tick, MINUTE)
    }, MINUTE - (Date.now() % MINUTE))

    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [])

  return now
}
