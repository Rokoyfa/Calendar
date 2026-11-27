import { lazy } from 'react'

export const LazyEventModal = lazy(async () => ({ default: (await import('./EventModal.tsx')).EventModal }))
