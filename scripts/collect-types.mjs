import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = 'dist-lib/npm'
const EMITTED = join(OUT, 'types', 'lib')
const PUBLIC_FILES = ['index', 'CalendarWidget', 'element', 'config']
const RELATIVE_TS_IMPORT = /(from\s+'\.\/[^']+)\.tsx?'/g

for (const name of PUBLIC_FILES) {
  const source = await readFile(join(EMITTED, `${name}.d.ts`), 'utf8')
  await writeFile(join(OUT, `${name}.d.ts`), source.replace(RELATIVE_TS_IMPORT, "$1.js'"))
}

await rm(join(OUT, 'types'), { recursive: true, force: true })
