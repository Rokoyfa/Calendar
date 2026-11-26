export type BusyInterval = { start: number; end: number }

export type FreeBusyPerson = {
  email: string
  name: string | null
  available: boolean
  busy: BusyInterval[]
  blockedDates: string[]
}

export type FreeBusyQuery = {
  from: number
  to: number
  emails: readonly string[]
  excludeEventId?: string
}

export type FreeBusyRepository = {
  lookup: (query: FreeBusyQuery) => Promise<FreeBusyPerson[]>
}
