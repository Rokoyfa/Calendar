import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIRECTORY = 'dist-lib/cdn'
const ENTRY = 'calendar-widget.js'
const BUDGET_KB = 200
const STATIC_IMPORT = /(?:from|import)\s*"\.\/([^"]+\.js)"/g

const loaded = new Set()
const pending = [ENTRY]
while (pending.length > 0) {
  const file = pending.pop()
  if (loaded.has(file)) continue
  loaded.add(file)
  for (const [, dependency] of readFileSync(join(DIRECTORY, file), 'utf8').matchAll(STATIC_IMPORT))
    pending.push(dependency)
}

const gzipBytes = [...loaded].reduce((sum, file) => sum + gzipSync(readFileSync(join(DIRECTORY, file))).length, 0)
const sizeKb = Math.round(gzipBytes / 1024)
console.log(`Initial load of ${ENTRY}: ${loaded.size} files, ${sizeKb} KB gzip (budget ${BUDGET_KB} KB)`)
if (sizeKb > BUDGET_KB) {
  console.error('The initial bundle is over budget. Load the new code lazily with import().')
  process.exit(1)
}
