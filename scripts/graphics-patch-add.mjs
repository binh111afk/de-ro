// node scripts/graphics-patch-add.mjs  (chạy ở gốc dự án) — chèn ADDED còn thiếu vào graphics.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
const { ADDED } = await import(pathToFileURL(process.cwd() + '/scripts/graphics-redraw.mjs') + '?t=' + Date.now())
let s = readFileSync('src/lib/graphics.ts', 'utf8')
let n = 0
for (const { after, ...e } of ADDED) {
  if (s.includes(`id: ${JSON.stringify(e.id)},`)) continue
  const i = s.indexOf(`id: ${JSON.stringify(after)},`)
  if (i < 0) throw new Error('missing after ' + after)
  const end = s.indexOf('\n  },', i) + 5
  s = s.slice(0, end) + `\n  {\n    id: ${JSON.stringify(e.id)},\n    name: ${JSON.stringify(e.name)},\n    category: ${JSON.stringify(e.category)},\n    keywords: ${JSON.stringify(e.keywords)},\n    ratio: 1,\n    svg: ${JSON.stringify(e.svg)},\n  },` + s.slice(end)
  n++
}
writeFileSync('src/lib/graphics.ts', s)
console.log('inserted', n)
