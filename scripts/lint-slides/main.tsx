/**
 * Lint slide bằng renderer thật (chạy trong Chrome headless qua `npm run lint:slides`).
 *
 * Dựng mọi layout × theme × bộ nội dung bằng `SlideThumb` rồi đo DOM: chữ tràn
 * hộp, chữ đè chữ/vạch/icon, chữ ra ngoài slide, chữ quá nhỏ, tương phản thấp.
 * Kết quả ghi vào `#lint-result` (base64 JSON) để `lint-slides.mjs` đọc.
 */
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@/index.css'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { SlideThumb } from '@/examEditor/SlideEditor'
import {
  SLIDE_LAYOUTS,
  composeLayout,
  toneBackground,
  withPlaceholders,
  type SlideLayoutContent,
} from '@/lib/slideLayouts'
import { ensureMeasureFonts } from '@/lib/slideMeasure'
import { DECK_THEMES, contrastRatio, normalizeTheme } from '@/lib/slideTheme'
import type { Slide, SlideElement, SlideTone } from '@/store/docs'

const LONG_TITLE = 'Hàm số bậc nhất và đồ thị của hàm số trong chương trình Toán lớp 9'

const STRESS: SlideLayoutContent = {
  title: 'Tổng quan về hàm số bậc hai và ứng dụng trong thực tiễn đời sống',
  kicker: 'CHƯƠNG TRÌNH TOÁN LỚP 10',
  subtitle: 'Định nghĩa, đồ thị, sự biến thiên và các bài toán ứng dụng thường gặp trong đề thi',
  body: 'Hàm số bậc hai có dạng y = ax² + bx + c với a ≠ 0. Đồ thị là một parabol có trục đối xứng x = −b/2a và đỉnh I(−b/2a; −Δ/4a).',
  bullets: [
    'Định nghĩa hàm số bậc hai và điều kiện a khác 0 trong chương trình lớp 10',
    'Cách xác định toạ độ đỉnh, trục đối xứng và hướng bề lõm của parabol',
    'Lập bảng biến thiên và vẽ đồ thị hàm số bậc hai một cách chính xác',
    'Ứng dụng vào bài toán tìm giá trị lớn nhất, nhỏ nhất trong thực tế',
  ],
  items: [
    'Định nghĩa: hàm số có dạng y = ax² + bx + c với a khác 0',
    'Đồ thị: parabol nhận đường thẳng x = −b/2a làm trục đối xứng',
    'Đỉnh: điểm I có toạ độ (−b/2a; −Δ/4a) là điểm cao nhất hoặc thấp nhất',
    'Biến thiên: phụ thuộc dấu của hệ số a và khoảng giá trị của x',
  ],
  left: ['Tập xác định là toàn bộ trục số thực', 'Đồ thị luôn là một parabol', 'Có một điểm cực trị duy nhất'],
  right: ['Có thể có hai nghiệm phân biệt', 'Có thể vô nghiệm trên tập số thực', 'Giá trị nhỏ nhất phụ thuộc dấu a'],
  leftTitle: 'Tính chất cơ bản',
  rightTitle: 'Lưu ý khi giải toán',
  quote: 'Toán học là môn thể thao trí tuệ, nơi mỗi bài toán là một sân chơi để rèn luyện tư duy.',
  author: 'Giáo viên bộ môn Toán — Trường THPT Nguyễn Du',
  rows: [
    ['Đại lượng', 'Công thức', 'Ý nghĩa', 'Ghi chú'],
    ['Toạ độ đỉnh', 'x = −b/2a', 'Trục đối xứng của parabol', 'Bắt buộc nhớ'],
    ['Giá trị đỉnh', 'y = −Δ/4a', 'Giá trị lớn nhất hoặc nhỏ nhất', 'Tuỳ dấu a'],
    ['Delta', 'Δ = b² − 4ac', 'Quyết định số nghiệm', 'Δ ≥ 0 có nghiệm'],
    ['Nghiệm', 'x = (−b ± √Δ)/2a', 'Giao điểm với trục hoành', 'Kiểm tra lại'],
  ],
  stats: [
    { value: '1.234.567', label: 'Tỉ lệ học sinh đạt điểm khá giỏi toàn trường' },
    { value: '98,5%', label: 'Số bài kiểm tra đã hoàn thành đúng hạn' },
    { value: '12', label: 'Chuyên đề ôn tập trong học kỳ' },
  ],
  steps: [
    'Xác định hệ số a, b, c từ đề bài đã cho',
    'Tính toạ độ đỉnh và trục đối xứng của parabol',
    'Lập bảng biến thiên và xét dấu hệ số a',
    'Tìm giao điểm với các trục toạ độ',
    'Vẽ đồ thị và kết luận theo yêu cầu',
  ],
  question: 'Cho hàm số y = x² − 4x + 3. Toạ độ đỉnh của parabol là điểm nào dưới đây?',
  options: ['I(2; −1)', 'I(−2; 1)', 'I(1; 2)', 'I(−1; −2)'],
  answer: 0,
  explanation: 'Hoành độ đỉnh x = −b/2a = 2, thay vào được y = −1 nên đỉnh là I(2; −1), đáp án A đúng.',
  problem: 'Cho hàm số y = x² − 4x + 3. Tìm toạ độ đỉnh, trục đối xứng và vẽ bảng biến thiên của parabol.',
  conclusion: 'Đỉnh I(2; −1), trục đối xứng x = 2, bề lõm hướng lên',
}

/** Nội dung vừa phải, tiêu đề dài 2 dòng — ca hay gặp nhất khi AI sinh slide. */
const MEDIUM: SlideLayoutContent = {
  title: LONG_TITLE,
  kicker: 'TOÁN 9 · CHƯƠNG 2',
  subtitle: 'Khám phá mối quan hệ giữa hai đại lượng biến thiên',
  body: 'Hàm số bậc nhất có dạng y = ax + b với a khác 0.',
  bullets: ['Dạng y = ax + b với a khác 0', 'a là hệ số góc, b là tung độ gốc', 'Đồng biến khi a > 0, nghịch biến khi a < 0'],
  items: ['Lập bảng giá trị hai điểm', 'Xác định toạ độ điểm', 'Vẽ hai điểm lên mặt phẳng', 'Nối thành đường thẳng'],
  left: ['Đồ thị đi lên từ trái sang phải', 'x tăng thì y tăng'],
  right: ['Đồ thị đi xuống', 'x tăng thì y giảm'],
  leftTitle: 'Đồng biến (a > 0)',
  rightTitle: 'Nghịch biến (a < 0)',
  quote: 'Học đi đôi với hành.',
  author: 'Tục ngữ',
  rows: [['Đại lượng', 'Ý nghĩa'], ['a', 'Hệ số góc'], ['b', 'Tung độ gốc']],
  stats: [{ value: '85%', label: 'Học sinh hiểu khái niệm' }, { value: '12', label: 'Bài tập đã làm' }, { value: '3', label: 'Mức độ khó' }],
  steps: ['Khởi động', 'Khám phá', 'Luyện tập', 'Vận dụng', 'Tổng kết'],
  question: 'Hàm số nào sau đây là hàm số bậc nhất?',
  options: ['y = 2x + 1', 'y = x² + 3', 'y = 5', 'y = 1/x'],
  answer: 0,
  explanation: 'Chỉ y = 2x + 1 có dạng y = ax + b với a ≠ 0.',
  problem: 'Rút gọn phân số $\\frac{18}{24}$ bằng ƯCLN.',
  conclusion: 'Kết quả: $\\frac{18}{24} = \\frac{3}{4}$',
}

const TONES: SlideTone[] = ['theme', 'soft', 'accent']

type Rule = 'overflow' | 'overlap' | 'bounds' | 'edge' | 'tiny' | 'contrast'
interface Issue {
  rule: Rule
  severity: 'error' | 'warn'
  theme: string
  layout: string
  tone: string
  content: string
  element: string
  detail: string
}

interface Rect { l: number; t: number; r: number; b: number }
const area = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t))

/** Hộp bao thật của chữ (không phải của khung) — bỏ qua padding và vùng trống dưới. */
function textRect(node: HTMLElement): Rect | null {
  const range = document.createRange()
  range.selectNodeContents(node)
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0)
  if (!rects.length) return null
  return {
    l: Math.min(...rects.map((r) => r.left)),
    t: Math.min(...rects.map((r) => r.top)),
    r: Math.max(...rects.map((r) => r.right)),
    b: Math.max(...rects.map((r) => r.bottom)),
  }
}

const isHex = (v?: string): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v)

/** Nền hiệu dụng dưới tâm chữ: shape có fill nằm dưới (theo thứ tự vẽ) hoặc nền slide. */
function backdropOf(elements: SlideElement[], index: number, rect: Rect, frame: DOMRect, bg: string): string {
  const cx = ((rect.l + rect.r) / 2 - frame.left) / frame.width * 100
  const cy = ((rect.t + rect.b) / 2 - frame.top) / frame.height * 100
  let color = bg
  for (let i = 0; i < index; i++) {
    const el = elements[i]
    if (el.type === 'shape' && isHex(el.fill) && cx >= el.x && cx <= el.x + el.w && cy >= el.y && cy <= el.y + el.h) {
      color = el.fill
    }
  }
  return color
}

function lintSlide(
  frame: HTMLElement,
  slide: Slide,
  meta: Omit<Issue, 'rule' | 'severity' | 'element' | 'detail'>,
  fg: string,
  out: Issue[],
) {
  const push = (rule: Rule, severity: Issue['severity'], element: string, detail: string) =>
    out.push({ ...meta, rule, severity, element, detail })
  const fr = frame.getBoundingClientRect()
  const els = slide.elements
  const nodes = Array.from(frame.children) as HTMLElement[]
  const texts: Array<{ el: SlideElement; rect: Rect }> = []

  els.forEach((el, i) => {
    if (el.type !== 'text' || !el.text?.trim()) return
    const node = nodes[i]
    if (!node) return
    if (node.scrollHeight > node.clientHeight + 1) {
      push('overflow', 'error', el.id, `scrollHeight ${node.scrollHeight} > ${node.clientHeight}px`)
    }
    const rect = textRect(node)
    if (!rect) return
    texts.push({ el, rect })
    if (rect.l < fr.left - 1 || rect.r > fr.right + 1 || rect.t < fr.top - 1 || rect.b > fr.bottom + 1) {
      push('bounds', 'error', el.id, 'chữ nằm ngoài khung slide')
    }
    const size = Number.parseFloat(node.style.fontSize)
    if (size && size < 1.3) push('tiny', 'warn', el.id, `${size}cqw`)
    const color = el.textColor ?? fg
    // ô chữ có nền riêng (đáp án đúng của quiz) thì lấy nền đó, không lấy shape bên dưới
    const back = isHex(el.fill) ? el.fill : backdropOf(els, i, rect, fr, slide.background)
    if (isHex(color) && isHex(back)) {
      const need = size >= 2.2 || (el.fontWeight ?? 0) >= 700 ? 3 : 4.5
      const ratio = contrastRatio(color, back)
      if (ratio < need) push('contrast', 'warn', el.id, `${ratio.toFixed(2)} < ${need}`)
    }
  })

  // lề an toàn: phần tử không tràn nền (bắt đầu sau mép trên/trái) mà đáy/phải > 96% → sát mép
  els.forEach((el) => {
    if (el.type === 'image' || el.y <= 1 || el.x <= 1) return
    if (el.y + el.h > 96 || (el.x + el.w > 96 && el.x + el.w < 99.5)) {
      push('edge', 'error', el.id, `sát mép: đáy ${(el.y + el.h).toFixed(1)}%, phải ${(el.x + el.w).toFixed(1)}%`)
    }
  })
  // chữ ↔ chữ
  for (let a = 0; a < texts.length; a++) {
    for (let b = a + 1; b < texts.length; b++) {
      const hit = area(texts[a].rect, texts[b].rect)
      if (hit > 6) push('overlap', 'error', `${texts[a].el.id} × ${texts[b].el.id}`, `${Math.round(hit)}px²`)
    }
  }
  // chữ ↔ vạch nhấn mảnh / icon / đồ hoạ
  els.forEach((el, i) => {
    const thin = el.type === 'shape' && (el.h <= 1.3 || el.w <= 0.9) && el.w < 40
    const media = el.type === 'icon' || el.type === 'graphic'
    if (!thin && !media) return
    const box: Rect = {
      l: fr.left + (el.x / 100) * fr.width,
      t: fr.top + (el.y / 100) * fr.height,
      r: fr.left + ((el.x + el.w) / 100) * fr.width,
      b: fr.top + ((el.y + el.h) / 100) * fr.height,
    }
    for (const t of texts) {
      if (t.el === els[i]) continue
      const hit = area(box, t.rect)
      if (hit > (media ? 40 : 4)) push('overlap', 'error', `${t.el.id} × ${el.id}`, `${Math.round(hit)}px²`)
    }
  })
}

async function main() {
  await ensureMeasureFonts()
  await document.fonts.ready
  const host = document.getElementById('host')!
  const root = createRoot(host)
  const issues: Issue[] = []
  let slides = 0

  const sets: Array<{ name: string; tones: SlideTone[]; content: (id: (typeof SLIDE_LAYOUTS)[number]['id']) => SlideLayoutContent }> = [
    { name: 'stress', tones: TONES, content: () => STRESS },
    { name: 'medium', tones: ['theme'], content: () => MEDIUM },
    { name: 'demo', tones: ['theme'], content: (id) => withPlaceholders(id, {}) },
  ]

  for (const base of DECK_THEMES) {
    const theme = normalizeTheme(base)
    for (const layout of SLIDE_LAYOUTS) {
      for (const set of sets) {
        for (const tone of set.tones) {
          const slide: Slide = {
            id: `${theme.id}-${layout.id}`,
            layout: layout.id,
            tone,
            background: toneBackground(theme, tone),
            elements: composeLayout(theme, layout.id, set.content(layout.id), tone),
          }
          flushSync(() => root.render(<SlideThumb slide={slide} theme={theme} />))
          // FitText co chữ trong layout effect (đã chạy xong sau flushSync).
          const frame = host.querySelector('.slide-frame') as HTMLElement
          lintSlide(frame, slide, { theme: theme.id, layout: layout.id, tone, content: set.name }, theme.fg, issues)
          slides++
        }
      }
    }
  }
  return { slides, issues }
}

main()
  .then((result) => {
    document.getElementById('lint-result')!.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(result))))
  })
  .catch((err) => {
    document.getElementById('lint-result')!.textContent = btoa(
      unescape(encodeURIComponent(JSON.stringify({ fatal: String(err?.stack ?? err) }))),
    )
  })
