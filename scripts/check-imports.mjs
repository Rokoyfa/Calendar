import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, sep } from 'node:path'

const SRC = 'src'
const IMPORT = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"?]+)/g
const LAYERS = [
  'utils',
  'domain',
  'i18n',
  'hooks',
  'components',
  'context',
  'config',
  'features',
  'data',
  'pages',
  'lib',
]
const MAY_NOT_IMPORT = {
  utils: ['domain', 'features', 'data', 'pages', 'lib', 'components', 'context'],
  domain: ['features', 'data', 'pages', 'lib', 'components', 'context'],
  components: ['features', 'data', 'pages', 'lib'],
  hooks: ['features', 'data', 'pages', 'lib'],
  features: ['pages', 'lib'],
  data: ['pages', 'lib'],
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : /\.tsx?$/.test(name) ? [path] : []
  })

const parts = (path) => relative(SRC, path).split(sep)
const problems = []

for (const file of walk(SRC)) {
  const [layer, feature] = parts(file)
  if (!LAYERS.includes(layer)) continue
  for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    const target = normalize(join(dirname(file), match[1]))
    const [targetLayer, targetFeature, ...rest] = parts(target)
    if (MAY_NOT_IMPORT[layer]?.includes(targetLayer))
      problems.push(`${file}: ${layer}/ must not import ${targetLayer}/ (${match[1]})`)
    else if (
      targetLayer === 'features' &&
      !(layer === 'features' && feature === targetFeature) &&
      rest.join('/') !== 'index.ts'
    )
      problems.push(`${file}: import features/${targetFeature} through its index.ts (${match[1]})`)
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} import(s) cross a module boundary.`)
  process.exit(1)
}
console.log('Module boundaries ok')
