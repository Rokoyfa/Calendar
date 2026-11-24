import { createRoot } from 'react-dom/client'
import { Calendar } from '../../src/lib/index.ts'
import { FEATURE_NAMES, type CalendarFeatures } from '../../src/lib/index.ts'

const params = new URLSearchParams(window.location.search)
const enabled = params.get('features')
const storageMode = params.get('storage') === 'local' ? 'local' : 'remote'
const features = Object.fromEntries(
  FEATURE_NAMES.map((name) => [name, enabled === 'all' || (enabled ?? '').split(',').includes(name)]),
) as CalendarFeatures

createRoot(document.getElementById('root')!).render(
  <Calendar
    routing="memory"
    storageMode={storageMode}
    apiBaseUrl="/api"
    features={features}
    initialPath={params.get('path') ?? undefined}
    style={{ height: '100dvh' }}
  />,
)
