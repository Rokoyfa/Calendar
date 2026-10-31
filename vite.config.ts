import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import { parseEnv } from './src/config/parseEnv.ts'

const createApiProxy = (apiBaseUrl: string, target: string | undefined): Record<string, ProxyOptions> | undefined => {
  if (!target || !apiBaseUrl.startsWith('/')) return undefined
  return { [apiBaseUrl.replace(/\/+$/, '')]: { target, changeOrigin: true } }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const { apiBaseUrl } = parseEnv(env)
  const proxy = createApiProxy(apiBaseUrl, env.API_PROXY_TARGET?.trim())

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
