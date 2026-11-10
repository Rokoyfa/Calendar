import { createContext, use } from 'react'

export const DraggingEventContext = createContext<string | null>(null)

export const useIsDragging = (occurrenceKey: string) => use(DraggingEventContext) === occurrenceKey
