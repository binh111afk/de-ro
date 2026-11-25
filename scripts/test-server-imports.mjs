/** Vercel chạy ESM: mọi import chạy thật mà server/api kéo theo phải có đuôi .js, thiếu là hàm 500. Chạy: npm run test:server-imports */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const IMPORT = /^[ \t]*(?:import|export)(?![ \t]+type\b)(?:[^'"()=;]*?[ \t\n}]from)?[ \t]*['"]((?:\.{1,2}\/|@\/)[^'"]+)['"]|\bawait import\(\s*['"]((?:\.{1,2}\/|@\/)[^'"]+)['"]/gm
const queue = readdirSync(path.join(root, 'api')).map((f) => path.join(root, 'api', f))
const seen = new Set()
const bad = []
while (queue.length) {
  const file = queue.pop()
  if (seen.has(file)) continue
  seen.add(file)
  for (const m of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    const spec = m[1] ?? m[2]
    if (spec.startsWith('@/') || !/\.(js|json|mjs)$/.test(spec)) bad.push(`${path.relative(root, file)} -> ${spec}`)
    const base = spec.startsWith('@/') ? path.join(root, 'src', spec.slice(2)) : path.resolve(path.dirname(file), spec)
    const next = [base.replace(/\.js$/, '.ts'), `${base}.ts`, `${base}.tsx`].find((p) => /\.tsx?$/.test(p) && existsSync(p))
    if (next) queue.push(next)
  }
}
if (bad.length) {
  console.error('Import thiếu đuôi .js hoặc dùng @/ trong mã chạy trên server:\n' + bad.join('\n'))
  process.exit(1)
}
console.log(`test-server-imports: OK (${seen.size} file)`)
