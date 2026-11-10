import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = 'dist-lib/npm'
const TYPES = join(OUT, 'types')
const RELATIVE_TS_IMPORT = /((?:from|import)\s*\(?\s*'\.{1,2}\/[^']+)\.tsx?'/g

const entries = await readdir(TYPES, { recursive: true, withFileTypes: true })
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.d.ts')) continue
  const file = join(entry.parentPath, entry.name)
  const source = await readFile(file, 'utf8')
  await writeFile(file, source.replace(RELATIVE_TS_IMPORT, "$1.js'"))
}

for (const name of ['index', 'CalendarWidget', 'element', 'config']) await rm(join(OUT, `${name}.d.ts`), { force: true })
await writeFile(join(OUT, 'index.d.ts'), "export * from './types/lib/index.js'\n")
