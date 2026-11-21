/**
 * Đóng gói chữ prompt slide / bảng vẽ / tìm web thành MỘT file JS cho server (`server/generated/prompts.js`).
 * Prompt slide dựng từ nhiều module client (layout, bộ màu, kho đồ hoạ…) dùng alias `@/` và import không đuôi `.js`,
 * Vercel (ESM) không nạp thẳng được; esbuild gộp lại thì chữ prompt giống hệt code gốc, không phải tách tay.
 *
 *   npm run build:prompts     (node scripts/build-server-prompts.mjs --write) ghi lại file (chạy mỗi khi sửa prompt slide / bảng vẽ; test:ai-prompts báo lỗi nếu file cũ)
 */
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../', import.meta.url)
const ENTRY = fileURLToPath(new URL('src/lib/prompts/slideTasks.ts', ROOT))
export const OUT = fileURLToPath(new URL('server/generated/prompts.js', ROOT))
const BANNER = '// GENERATED bởi scripts/build-server-prompts.mjs — KHÔNG sửa tay; chạy `npm run build:prompts`.\n'

/** nội dung file đã đóng gói (không ghi ra đĩa) */
export async function bundlePrompts() {
  const res = await build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    tsconfig: fileURLToPath(new URL('tsconfig.app.json', ROOT)),
    write: false,
    legalComments: 'none',
    logLevel: 'warning',
    banner: { js: BANNER },
    // phông chữ chỉ dùng ở trình duyệt: server không cần (và không được kéo cả gói phông vào hàm Vercel)
    plugins: [
      {
        name: 'bo-phong-chu',
        setup(b) {
          b.onResolve({ filter: /^@fontsource(-variable)?\// }, (a) => ({ path: a.path, namespace: 'bo-phong-chu' }))
          b.onLoad({ filter: /.*/, namespace: 'bo-phong-chu' }, () => ({ contents: '', loader: 'js' }))
        },
      },
    ],
  })
  return res.outputFiles[0].text
}

if (process.argv.includes('--write')) {
  mkdirSync(fileURLToPath(new URL('server/generated/', ROOT)), { recursive: true })
  const code = await bundlePrompts()
  writeFileSync(OUT, code)
  console.log(`✓ ${OUT} (${Math.round(code.length / 1024)} KB)`)
}
