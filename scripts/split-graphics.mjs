/**
 * Sinh `src/lib/graphicsMeta.ts` từ `src/lib/graphics.ts`: chỉ id/tên/nhóm/từ khoá/tỉ lệ/màu chủ đạo,
 * không có SVG (~1,4 MB). Trang slide nạp danh mục nhẹ này ngay, SVG thì tải sau (`loadGraphics`).
 * Chạy lại mỗi khi `graphics.ts` đổi (import-graphics và graphics-patch-* tự gọi ở cuối).
 *   node scripts/split-graphics.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { transformSync } from 'esbuild'

const SRC = 'src/lib/graphics.ts'
const OUT = 'src/lib/graphicsMeta.ts'
const INK = '#22333B'

const js = transformSync(readFileSync(SRC, 'utf8'), { loader: 'ts', format: 'esm' }).code
const { GRAPHICS } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

/** giống `dominantFill` trong slideGraphics.ts: màu fill gặp nhiều nhất, trừ màu nét và trắng */
function dominantFill(svg) {
  const count = new Map()
  for (const [, color] of svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)) {
    if (color.toUpperCase() === INK || color.toUpperCase() === '#FFFFFF') continue
    count.set(color, (count.get(color) ?? 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

const rows = GRAPHICS.map(({ id, name, category, keywords, ratio, svg }) =>
  JSON.stringify({ id, name, category, keywords, ratio, main: dominantFill(svg) }),
)

writeFileSync(
  OUT,
  `/* AUTO-GENERATED bởi scripts/split-graphics.mjs từ graphics.ts — đừng sửa tay. */
import type { GraphicCategory } from './graphics'

export interface GraphicMeta {
  id: string
  name: string
  category: GraphicCategory
  keywords: string
  ratio: number
  /** màu fill chủ đạo của SVG gốc (null nếu không có) */
  main: string | null
}

// category để kiểu string khi khai báo (giống graphics.ts): literal union >1000 phần tử làm tsc báo TS2590
const RAW: (Omit<GraphicMeta, 'category'> & { category: string })[] = [
${rows.map((r) => `  ${r},`).join('\n')}
]

export const GRAPHIC_META = RAW as GraphicMeta[]
`,
)
console.log(`${OUT}: ${rows.length} mục`)
