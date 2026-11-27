import { defineConfig, devices } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { API_PORT, API_URL, APP_PORT, APP_URL } from './e2e/env.ts'

process.env.E2E_DATA_DIR ??= mkdtempSync(join(tmpdir(), 'calendar-e2e-'))
const dataDir = process.env.E2E_DATA_DIR
const backendDir = resolve(process.env.E2E_BACKEND_DIR ?? '../TestBE')

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: APP_URL,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    viewport: { width: 1300, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1300, height: 900 } } }],
  webServer: [
    {
      command: 'npx tsx src/server.ts',
      cwd: backendDir,
      url: `${API_URL}/dev/mails`,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        APP_URL,
        DATA_FILE: join(dataDir, 'data.json'),
        ATTACHMENTS_DIR: join(dataDir, 'attachments'),
        TENANT_CONFIG_FILE: join(dataDir, 'tenant-config.json'),
        CREDENTIAL_KEY_FILE: join(dataDir, 'credential.key'),
        ALLOW_PRIVATE_NETWORK_FETCH: 'true',
      },
    },
    {
      command: `npx vite --port ${APP_PORT} --strictPort`,
      url: APP_URL,
      reuseExistingServer: false,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}`, VITE_FEATURE_AUTH: 'true', VITE_FEATURE_TIPS: 'false' },
      stderr: process.env.E2E_DEBUG ? 'pipe' : 'ignore',
    },
  ],
})
