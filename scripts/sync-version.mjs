// 在 `npm version` 升级 package.json 之后、commit 之前运行。
// 把 package.json 的版本号同步到 HeaderSection.tsx 的徽章里。
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = resolve(__dirname, '..')

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'))
const version = `v${pkg.version}`

const headerPath = resolve(root, 'app/components/HeaderSection.tsx')
const original = readFileSync(headerPath, 'utf-8')
const updated = original.replace(/v\d+\.\d+\.\d+/g, version)

if (original === updated) {
  console.log(`[sync-version] HeaderSection.tsx already on ${version}`)
} else {
  writeFileSync(headerPath, updated, 'utf-8')
  console.log(`[sync-version] HeaderSection.tsx -> ${version}`)
}
