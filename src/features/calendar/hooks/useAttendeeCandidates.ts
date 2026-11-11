import { useEffect, useState } from 'react'
import type { AttendeeCandidate } from '../../events/index.ts'

export type AttendeeCandidateLoader = (calendarId: string) => Promise<AttendeeCandidate[]>

type Loaded = { calendarId: string; candidates: AttendeeCandidate[] }

const NO_CANDIDATES: AttendeeCandidate[] = []

export function useAttendeeCandidates(load: AttendeeCandidateLoader | undefined, calendarId: string | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!load || !calendarId) return
    let isCurrent = true
    load(calendarId)
      .then((candidates) => {
        if (isCurrent) setLoaded({ calendarId, candidates })
      })
      .catch(() => {
        if (isCurrent) setLoaded({ calendarId, candidates: NO_CANDIDATES })
      })
    return () => {
      isCurrent = false
    }
  }, [load, calendarId])

  return loaded && loaded.calendarId === calendarId ? loaded.candidates : NO_CANDIDATES
}
