// node scripts/graphics-patch-redrawn.mjs id1 id2 ... — thay svg các icon REDRAWN đã cho trong graphics.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
const { REDRAWN } = await import(pathToFileURL(process.cwd() + '/scripts/graphics-redraw.mjs') + '?t=' + Date.now())
let s = readFileSync('src/lib/graphics.ts', 'utf8')
for (const id of process.argv.slice(2)) {
  const i = s.indexOf(`id: ${JSON.stringify(id)},`)
  if (i < 0) throw new Error('missing ' + id)
  const a = s.indexOf('    svg: ', i), b = s.indexOf('\n', a)
  s = s.slice(0, a) + `    svg: ${JSON.stringify(REDRAWN[id])},` + s.slice(b)
}
writeFileSync('src/lib/graphics.ts', s)
