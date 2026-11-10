import { defineConfig } from 'vitest/config'
import { versionDefine } from './scripts/packageVersion.ts'

process.env.TZ = 'Europe/Berlin'

export default defineConfig({
  define: versionDefine,
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
