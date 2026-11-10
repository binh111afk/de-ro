import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withPage } from './lib/cdp.mjs'

const OUT_DIR = join(process.cwd(), 'docs/handoff/mau-slide-anh')
const COLOR_PNG = join(OUT_DIR, 'bang-so-sanh-8-bo.png')
const GRAY_PNG = join(OUT_DIR, 'bang-so-sanh-8-bo-grayscale.png')

async function main() {
  console.log('--- Chụp ảnh bảng so sánh 8 bộ thiết kế ---')
  const url = 'http://127.0.0.1:5184/preview-designs'

  await withPage(url, { width: 1500, height: 4200 }, async ({ evaluate, screenshot }) => {
    // Chờ 3 giây để font và KaTeX render đầy đủ
    await new Promise((r) => setTimeout(r, 3000))

    // 1. Chụp bản màu
    console.log('Đang chụp bản màu...')
    const colorBuf = await screenshot()
    writeFileSync(COLOR_PNG, colorBuf)
    console.log(`✅ Đã lưu bản màu: ${COLOR_PNG}`)

    // 2. Chuyển sang trắng đen bằng CSS filter
    console.log('Đang chuyển sang trắng đen và chụp...')
    await evaluate(`
      const el = document.getElementById('comparison-matrix');
      if (el) {
        el.style.filter = 'grayscale(100%) contrast(115%)';
      }
    `)
    await new Promise((r) => setTimeout(r, 500))

    const grayBuf = await screenshot()
    writeFileSync(GRAY_PNG, grayBuf)
    console.log(`✅ Đã lưu bản trắng đen: ${GRAY_PNG}`)
  })

  console.log('Hoàn thành chụp ảnh ma trận so sánh!')
}

main().catch((err) => {
  console.error('Lỗi khi chụp ảnh:', err)
  process.exit(1)
})
