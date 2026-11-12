import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import { versionDefine } from './scripts/packageVersion.ts'
import { parseEnv } from './src/config/parseEnv.ts'

const createApiProxy = (apiBaseUrl: string, target: string | undefined): Record<string, ProxyOptions> | undefined => {
  if (!target || !apiBaseUrl.startsWith('/')) return undefined
  return { [apiBaseUrl.replace(/\/+$/, '')]: { target, changeOrigin: true, ws: true } }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const { apiBaseUrl } = parseEnv(env)
  const proxy = createApiProxy(apiBaseUrl, env.API_PROXY_TARGET?.trim())

  return {
    plugins: [react()],
    define: versionDefine,
    server: { proxy },
    preview: { proxy },
  }
})
