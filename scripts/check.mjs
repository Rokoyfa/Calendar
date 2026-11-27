import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const withE2e = process.argv.includes('--e2e')

const steps = [
  ['Typen', 'npm run typecheck'],
  ['ESLint', 'npx eslint .'],
  ['Modulgrenzen', 'node scripts/check-imports.mjs'],
  ['Unit-Tests', 'npm test'],
  ['Website-Build', 'npm run build'],
  ['Library-Build', 'npm run build:lib'],
  ...(withE2e ? [['Browser-Tests', 'npx playwright test --workers=1']] : []),
]

const results = []
for (const [name, command] of steps) {
  console.log(`\n=== ${name}: ${command}`)
  const started = Date.now()
  const { status } = spawnSync(command, { cwd: root, stdio: 'inherit', shell: true })
  results.push({ name, ok: status === 0, seconds: Math.round((Date.now() - started) / 1000) })
}

console.log('\n=== Ergebnis')
for (const { name, ok, seconds } of results) console.log(`${ok ? 'OK    ' : 'FEHLER'} ${name} (${seconds} s)`)
const failed = results.filter(({ ok }) => !ok)
if (failed.length > 0) {
  console.log(`\n${failed.length} von ${results.length} Prüfungen fehlgeschlagen.`)
  process.exit(1)
}
console.log(`\nAlle ${results.length} Prüfungen bestanden.`)
