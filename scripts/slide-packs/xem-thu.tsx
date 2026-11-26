// Xem thử bộ Chuyên nghiệp trên dev server (không vào bản build):
// http://localhost:5184/scripts/slide-packs/xem-thu.html?bo=giao-thong-ve-tay,tap-chi-do
// Thêm &nguon=1 để có dòng nguồn (kiểm không đè nội dung).
import { createRoot } from 'react-dom/client'
import '@/index.css'
// Lora nạp toàn cục ở src/main.tsx, trang này phải tự nạp (thiếu thì chữ hoa tiếng Việt bị tách dấu)
import '@fontsource/lora/400.css'
import '@fontsource/lora/600.css'
import '@fontsource/lora/700.css'
import { SlideThumb } from '@/examEditor/slideRender'
import '@/examEditor/slide.css'
import { composeLayout, defaultTone, toneBackground, type SlideLayoutContent } from '@/lib/slideLayouts'
import { PRO_THEMES, normalizeTheme } from '@/lib/slideTheme'

const LONG = 'Ý này dài như câu AI hay viết: nêu khái niệm, điều kiện áp dụng và một ví dụ gần gũi với học sinh.'
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ value: ['Quan sát', 'Dừng lại', 'Suy nghĩ', 'Hành động', 'Nhắc bạn'][i], label: LONG.slice(0, 80) }))

const SAMPLES: Array<[string, SlideLayoutContent]> = [
  ['photo-full', { title: 'Tiêu đề bài giảng khá dài của bộ', subtitle: 'Phụ đề nêu môn và lớp' }],
  ['editorial-text', { title: 'Mở đầu', bullets: [LONG, LONG, LONG] }],
  ['editorial-text', { title: 'Bốn ý', bullets: [LONG, LONG, LONG, LONG] }],
  ['rules', { title: 'Ba việc cần nhớ', stats: rows(3) }],
  ['rules', { title: 'Năm việc cần nhớ', stats: rows(5) }],
  ['bignum', { value: '75%', label: 'Tỉ lệ ví dụ để thử chữ', subtitle: LONG }],
  ['manifesto', { kicker: 'Mục tiêu', body: LONG }],
  ['photo-full', { title: 'Cảm ơn!', subtitle: 'Mời các em đặt câu hỏi' }],
]

const params = new URLSearchParams(location.search)
const ids = (params.get('bo') ?? 'giao-thong-ve-tay').split(',')
const credit = params.get('nguon') ? 'Nguồn: số liệu ví dụ, 2025' : undefined

const host = document.createElement('div')
host.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:5px;background:#555'
document.body.appendChild(host)
createRoot(host).render(<>{ids.flatMap((id) => {
  const theme = PRO_THEMES.find((x) => x.id === id)
  if (!theme) return [<p key={id}>Không có bộ {id}</p>]
  return SAMPLES.map(([layout, content], i) => (
    <div key={id + i}>
      <SlideThumb
        theme={normalizeTheme(theme)}
        slide={{ id: `s${i}`, layout, background: toneBackground(theme, defaultTone(layout as never)), elements: composeLayout(theme, layout, { ...content, credit }) }}
      />
    </div>
  ))
})}</>)
