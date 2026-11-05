import { createContext } from 'react'
import type { EventSources } from '../types/eventSource.ts'

export const NO_EVENT_SOURCES: EventSources = new Map()

export const EventSourcesContext = createContext<EventSources>(NO_EVENT_SOURCES)
