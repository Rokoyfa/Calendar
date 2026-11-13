import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from './config/env.ts'
import { Calendar } from './lib/index.ts'

const PAGE_STYLE = { height: '100dvh' }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {env.configUrl ? (
      <Calendar routing="browser" config={env.configUrl} style={PAGE_STYLE} />
    ) : (
      <Calendar
        routing="browser"
        storageMode={env.storageMode}
        apiBaseUrl={env.apiBaseUrl}
        apiTimeoutMs={env.apiTimeoutMs}
        features={env.features}
        style={PAGE_STYLE}
      />
    )}
  </StrictMode>,
)
