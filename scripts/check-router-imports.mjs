/**
 * 构建前检查 router/index.jsx：JSX 里用到的组件是否都已 import。
 * 避免新增路由后漏 import 导致整站白屏。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const routerPath = path.resolve(__dirname, '../src/router/index.jsx')
const content = fs.readFileSync(routerPath, 'utf8')

const importNames = new Set()

for (const match of content.matchAll(/^import\s+(\w+)\s+from/gm)) {
  importNames.add(match[1])
}

for (const match of content.matchAll(/^import\s+\{([^}]+)\}\s+from/gm)) {
  match[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .forEach((name) => importNames.add(name))
}

const usedComponents = new Set()
for (const match of content.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
  usedComponents.add(match[1])
}

const allowedWithoutImport = new Set(['Navigate'])
const missing = [...usedComponents].filter(
  (name) => !importNames.has(name) && !allowedWithoutImport.has(name),
)

if (missing.length > 0) {
  console.error('\n❌ src/router/index.jsx 缺少以下组件的 import：')
  missing.forEach((name) => console.error(`   - ${name}`))
  console.error('\n请补全 import 后再构建/启动。\n')
  process.exit(1)
}

console.log('✓ 路由组件 import 检查通过')
