/**
 * Đồ thị hàm số y = f(x) kiểu SGK: đọc biểu thức giáo viên gõ (`x^2 - 2x + 1`,
 * `sqrt(x)`, `sin x`, `2/x`…) và vẽ ra SVG (trục có mũi tên, gốc O, vạch chia,
 * lưới mờ). Không dùng thư viện ngoài.
 *
 * Cấu hình được nhúng vào thẻ <desc> của SVG để sau này đọc lại mà sửa tiếp.
 */

export type Fn = (x: number) => number

/* ------------------------------------------------------------------ *
 * Đọc biểu thức
 * ------------------------------------------------------------------ */

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  tg: Math.tan,
  cot: (v) => 1 / Math.tan(v),
  cotg: (v) => 1 / Math.tan(v),
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
}
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E }

type Node = (x: number) => number

/** Ném Error với câu báo lỗi tiếng Việt khi biểu thức sai. */
export function parseExpr(input: string): Fn {
  const src = input
    .toLowerCase()
    .replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=/, '')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/,/g, '.')
  // tách token: số, tên, toán tử, ngoặc
  const tokens = src.match(/\d*\.?\d+|[a-z]+|[-+*/^()|]|\S/g) ?? []
  // tên dính liền ("sinx", "2xpi") → tách thành hàm/hằng/biến đã biết
  const toks: string[] = []
  for (const t of tokens) {
    if (/^[a-z]+$/.test(t) && !(t in FUNCS) && !(t in CONSTS) && t !== 'x') {
      let rest = t
      while (rest) {
        const hit = [...Object.keys(FUNCS), ...Object.keys(CONSTS), 'x']
          .sort((a, b) => b.length - a.length)
          .find((k) => rest.startsWith(k))
        if (!hit) throw new Error(`Không hiểu "${t}"`)
        toks.push(hit)
        rest = rest.slice(hit.length)
      }
    } else toks.push(t)
  }
  if (toks.length === 0) throw new Error('Chưa nhập hàm số')

  let i = 0
  const peek = () => toks[i]
  const take = () => toks[i++]

  // expr := term (('+'|'-') term)*
  function expr(): Node {
    let left = term()
    while (peek() === '+' || peek() === '-') {
      const op = take()
      const a = left
      const b = term()
      left = op === '+' ? (x) => a(x) + b(x) : (x) => a(x) - b(x)
    }
    return left
  }
  // term := unary (('*'|'/'|ngầm) unary)*
  function term(): Node {
    let left = unary()
    for (;;) {
      const t = peek()
      if (t === '*' || t === '/') {
        take()
        const a = left
        const b = unary()
        left = t === '*' ? (x) => a(x) * b(x) : (x) => a(x) / b(x)
      } else if (t !== undefined && (t === '(' || /^[a-z\d.]/.test(t))) {
        // nhân ngầm: 2x, 3(x+1), x sin x
        const a = left
        const b = unary()
        left = (x) => a(x) * b(x)
      } else return left
    }
  }
  // unary := ('-'|'+') unary | power
  function unary(): Node {
    if (peek() === '-') {
      take()
      const a = unary()
      return (x) => -a(x)
    }
    if (peek() === '+') {
      take()
      return unary()
    }
    return power()
  }
  // power := atom ('^' unary)?   (phải kết hợp: 2^3^2 = 2^9)
  function power(): Node {
    const base = atom()
    if (peek() === '^') {
      take()
      const ex = unary()
      return (x) => Math.pow(base(x), ex(x))
    }
    return base
  }
  function atom(): Node {
    const t = take()
    if (t === undefined) throw new Error('Biểu thức bị thiếu ở cuối')
    if (/^\d*\.?\d+$/.test(t)) {
      const v = Number(t)
      return () => v
    }
    if (t === 'x') return (x) => x
    if (t in CONSTS) {
      const v = CONSTS[t]
      return () => v
    }
    if (t in FUNCS) {
      const f = FUNCS[t]
      // sin x, sin(x), sin^2 x
      let pow: Node | null = null
      if (peek() === '^') {
        take()
        pow = atom()
      }
      // không ngoặc: "sin 2x" là sin(2x) — gom các thừa số số/x/hằng liền sau
      let arg = peek() === '(' ? atom() : power()
      if (toks[i - 1] !== ')') {
        while (peek() !== undefined && (peek() === 'x' || peek() in CONSTS || /^\d*\.?\d+$/.test(peek()))) {
          const a = arg
          const b = power()
          arg = (x) => a(x) * b(x)
        }
      }
      return pow ? (x) => Math.pow(f(arg(x)), pow!(x)) : (x) => f(arg(x))
    }
    if (t === '(') {
      const inner = expr()
      if (take() !== ')') throw new Error('Thiếu dấu ")"')
      return inner
    }
    if (t === '|') {
      const inner = expr()
      if (take() !== '|') throw new Error('Thiếu dấu "|" đóng trị tuyệt đối')
      return (x) => Math.abs(inner(x))
    }
    throw new Error(`Không hiểu "${t}"`)
  }

  const root = expr()
  if (i < toks.length) throw new Error(`Thừa "${toks[i]}"`)
  return root
}

/* ------------------------------------------------------------------ *
 * Vẽ SVG
 * ------------------------------------------------------------------ */

export interface PlotCurve {
  expr: string
  color: string
}

export interface PlotSpec {
  curves: PlotCurve[]
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  grid: boolean
  /** ghi nhãn y = f(x) cạnh đường cong */
  labels: boolean
  /** điểm đặt tên, mỗi dòng "M(0; 0)" (thêm "chiếu" để kẻ nét đứt xuống trục) */
  points?: string
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

/** "M(0; 0) chiếu" → điểm; dòng sai bị bỏ qua */
export function parsePlotPoints(text: string | undefined): Array<{ name: string; x: number; y: number; proj: boolean }> {
  const out: Array<{ name: string; x: number; y: number; proj: boolean }> = []
  for (const line of (text ?? '').split(/\n|;\s*(?=[A-Z])/)) {
    const m = /^\s*([A-Z][A-Za-z0-9']*)\s*\(\s*(-?[\d.,]+)\s*;\s*(-?[\d.,]+)\s*\)\s*(chiếu)?/i.exec(line.replace(/−/g, '-'))
    if (!m) continue
    const x = Number(m[2].replace(',', '.'))
    const y = Number(m[3].replace(',', '.'))
    if (Number.isFinite(x) && Number.isFinite(y)) out.push({ name: m[1], x, y, proj: !!m[4] })
  }
  return out
}

export const PLOT_COLORS = ['#1f5fbf', '#c0392b', '#2e7d32', '#8e44ad']

/** bề rộng khung vẽ (px); chiều cao tính theo miền y để hai trục cùng đơn vị */
const W = 640
const PAD = 18
const H_MIN = 220
const H_MAX = 720

/** bước vạch chia "đẹp" (1, 2, 5 × 10^k) cho khoảng `span` */
function niceStep(span: number) {
  // khung vừa phải thì chia theo từng đơn vị như SGK
  if (span >= 4 && span <= 20) return 1
  // khung lớn: chia khoảng 5–8 ô như học sinh vẽ tay (y tới 30 → mỗi ô 5, không phải 2).
  // Lấy bước "đẹp" nhỏ nhất mà không quá 8 ô.
  const raw = span / 8
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const m = raw / p
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p
}

const fmt = (v: number) => String(Math.round(v * 1000) / 1000).replace('.', ',').replace('-', '−')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SUP_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '−': '⁻',
}

/**
 * Định dạng biểu thức toán học đẹp theo phong cách SGK:
 * - x^2 -> x², x^3 -> x³, x^(-1) -> x⁻¹
 * - Bỏ dấu * thô: 2*x -> 2x, 3*(x+1) -> 3(x+1)
 * - Dấu trừ dùng '−' (\u2212)
 * - Số mũ phức tạp x^(1/2) dùng <tspan baseline-shift="super" font-size="70%">
 * - Khoảng trắng cân đối quanh toán tử nhị phân (+, −)
 */
export function prettyExpr(raw: string): string {
  let s = raw.trim().replace(/^\s*(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, '')
  if (!s) return ''

  // 1. Chuẩn hoá dấu nhân: bỏ dấu * giữa số/chữ/ngoặc
  s = s.replace(/(\d|[a-zA-Z\)])\s*[*·×]\s*([a-zA-Z\(])/g, '$1$2')
  s = s.replace(/\s*[*·×]\s*/g, ' ')

  // 2. Chuyển luỹ thừa số nguyên đơn giản sang kí tự Unicode (x^2 -> x², x^3 -> x³, x^-1 -> x⁻¹)
  s = s.replace(/\^([+-]?\d+)/g, (_, exp: string) =>
    exp.split('').map((c) => SUP_DIGITS[c] ?? c).join(''),
  )
  s = s.replace(/\^\(([+-]?\d+)\)/g, (_, exp: string) =>
    exp.split('').map((c) => SUP_DIGITS[c] ?? c).join(''),
  )
  s = s.replace(/\^([nN])/g, 'ⁿ')

  // 3. Luỹ thừa phức tạp: ví dụ x^(1/2) -> <tspan baseline-shift="super" font-size="70%">1/2</tspan>
  s = s.replace(/\^\(([^)]+)\)/g, (_, inner: string) => {
    const formatted = inner
      .replace(/(\d|[a-zA-Z\)])\s*[*·×]\s*([a-zA-Z\(])/g, '$1$2')
      .replace(/[-–]/g, '−')
    return `<tspan baseline-shift="super" font-size="70%">${esc(formatted)}</tspan>`
  })

  // 4. Chuẩn hoá dấu trừ thường '-' thành dấu trừ toán học '−' (u2212) ngoài tag HTML
  s = s.replace(/(<[^>]+>)|[-–]/g, (_, tag) => {
    if (tag) return tag
    return '−'
  })

  // 5. Chuẩn hoá khoảng trắng quanh toán tử nhị phân + và −
  const parts = s.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i += 2) {
    let t = parts[i]
    const opBefore = `[a-zA-Z0-9)⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]`
    t = t.replace(new RegExp(`(${opBefore})\\s*([+−])\\s*`, 'g'), '$1 $2 ')
    t = t.replace(/(^|[(/[])\s*−\s*/g, '$1−')
    t = t.replace(/(^|[(/[])\s*\+\s*/g, '$1+')
    t = t.replace(/\s{2,}/g, ' ')
    parts[i] = t
  }
  return parts.join('').trim()
}

function distToBox(
  px: number,
  py: number,
  cx: number,
  cy: number,
  cosPhi: number,
  sinPhi: number,
  halfW: number,
  halfH: number,
): number {
  const dx = px - cx
  const dy = py - cy
  const u = dx * cosPhi + dy * sinPhi
  const v = -dx * sinPhi + dy * cosPhi
  const du = Math.max(0, Math.abs(u) - halfW)
  const dv = Math.max(0, Math.abs(v) - halfH)
  return Math.hypot(du, dv)
}

function getBoxCorners(
  cx: number,
  cy: number,
  cosPhi: number,
  sinPhi: number,
  halfW: number,
  halfH: number,
): Array<{ x: number; y: number }> {
  return [
    { x: cx - halfW * cosPhi + halfH * sinPhi, y: cy - halfW * sinPhi - halfH * cosPhi },
    { x: cx + halfW * cosPhi + halfH * sinPhi, y: cy + halfW * sinPhi - halfH * cosPhi },
    { x: cx + halfW * cosPhi - halfH * sinPhi, y: cy + halfW * sinPhi + halfH * cosPhi },
    { x: cx - halfW * cosPhi - halfH * sinPhi, y: cy - halfW * sinPhi + halfH * cosPhi },
  ]
}

/**
 * Tự chọn miền y theo các đường cong trên [xMin, xMax]. Giữ khung gần vuông
 * (miền y không dài quá miền x) để hai trục cùng đơn vị: khi đồ thị vọt cao thì
 * chọn khung chứa trục Ox và nhiều điểm đồ thị nhất (đỉnh parabol, giao điểm…).
 */
export function autoYRange(fns: Fn[], xMin: number, xMax: number): [number, number] {
  const ys: number[] = []
  for (const f of fns) {
    for (let k = 0; k <= 400; k++) {
      const y = f(xMin + ((xMax - xMin) * k) / 400)
      if (Number.isFinite(y) && Math.abs(y) < 1e6) ys.push(y)
    }
  }
  const xSpan = xMax - xMin
  if (ys.length === 0) return [-xSpan / 2, xSpan / 2]
  ys.sort((a, b) => a - b)
  const cap = xSpan
  const margin = xSpan * 0.06
  let lo = Math.min(ys[0], 0) - margin
  let hi = Math.max(ys[ys.length - 1], 0) + margin
  if (hi - lo > cap) {
    // trượt khung dài `cap` (luôn chứa y = 0), lấy vị trí phủ nhiều điểm nhất
    const count = (a: number) => upper(ys, a + cap) - upper(ys, a)
    let best = -cap / 2
    let bestN = -1
    for (let k = 0; k <= 200; k++) {
      const a = -cap + (cap * k) / 200
      const n = count(a)
      if (n > bestN) {
        bestN = n
        best = a
      }
    }
    lo = best
    hi = best + cap
    // đồ thị nằm xa trục Ox: bỏ ràng buộc chứa y = 0, trượt khung theo chính các điểm đồ thị
    if (bestN < ys.length * 0.2) {
      for (let k = 0; k < ys.length; k += 4) {
        const a = ys[k] - margin
        const n = count(a)
        if (n > bestN) {
          bestN = n
          best = a
        }
      }
      // vẫn giữ gốc O trong khung (đồ thị hàm số đọc tọa độ bằng đếm ô, không ngắt trục);
      // miền y dài hơn miền x thì renderPlotSvg chia đơn vị trục y khác trục x (vd mỗi vạch = 5)
      const cMin = ys[Math.min(upper(ys, best - 1e-9), ys.length - 1)]
      const cMax = ys[Math.max(upper(ys, best + cap) - 1, 0)]
      const lo0 = Math.min(cMin, 0)
      const hi0 = Math.max(cMax, 0)
      const m = (hi0 - lo0) * 0.1
      lo = lo0 < 0 ? lo0 - m : -m * 0.5
      hi = hi0 > 0 ? hi0 + m : m * 0.5
    }
  } else if (hi - lo < xSpan * 0.4) {
    const mid = (lo + hi) / 2
    lo = mid - xSpan * 0.2
    hi = mid + xSpan * 0.2
  }
  return xSpan >= 4 ? [Math.floor(lo), Math.ceil(hi)] : [lo, hi]
}

/** số phần tử ≤ v trong mảng đã sắp */
function upper(arr: number[], v: number) {
  let l = 0
  let r = arr.length
  while (l < r) {
    const m = (l + r) >> 1
    if (arr[m] <= v) l = m + 1
    else r = m
  }
  return l
}

/** Đọc lại cấu hình đồ thị nhúng trong SVG (chuỗi SVG hoặc data URL). */
export function readPlotSpec(svgOrUrl: string | undefined | null): PlotSpec | null {
  if (!svgOrUrl) return null
  let svg = svgOrUrl
  if (svg.startsWith('data:image/svg+xml;base64,')) {
    try {
      svg = decodeURIComponent(escape(atob(svg.slice(26))))
    } catch {
      return null
    }
  }
  const m = /<desc>([^<]*)<\/desc>/.exec(svg)
  if (!m) return null
  try {
    const raw = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    const spec = (JSON.parse(raw) as { dePlot?: PlotSpec }).dePlot
    return spec && Array.isArray(spec.curves) ? spec : null
  } catch {
    return null
  }
}

export function renderPlotSvg(spec: PlotSpec): { svg: string; width: number; height: number } {
  let { xMin, xMax, yMin, yMax } = spec
  // khung y lớn (bước > 1): kéo hai đầu ra bội của bước như học sinh vẽ tay (y tới 27 → trục tới 30,
  // chia mỗi ô 5), chừa thêm nửa ô cho mũi tên kẻo vạch trên cùng sát mép bị bỏ số.
  const sY = yMax - yMin > 20 ? niceStep(yMax - yMin) : 0
  if (sY) {
    const lo = Math.floor(yMin / sY + 1e-9) * sY
    const hi = Math.ceil(yMax / sY - 1e-9) * sY
    yMin = lo < 0 ? lo - sY * 0.4 : lo
    yMax = hi > 0 ? hi + sY * 0.4 : hi
  }
  let forced = false
  // cùng đơn vị hai trục. Miền y quá dài (vd y = 30 trên x ∈ [−5; 5]) thì KHÔNG kéo giãn riêng trục y
  // mà mở rộng miền x cho vừa khổ hình → hai trục vẫn cùng đơn vị, cùng bước chia, ô lưới vuông.
  const ySpanPx = (yMax - yMin) * ((W - 2 * PAD) / (xMax - xMin)) + 2 * PAD
  if (ySpanPx > H_MAX) {
    const xSpan = ((W - 2 * PAD) * (yMax - yMin)) / (H_MAX - 2 * PAD)
    const c = (xMin + xMax) / 2
    xMin = c - xSpan / 2
    xMax = c + xSpan / 2
    forced = true
  }
  // miền y quá ngắn thì đành co giãn trong [H_MIN, H_MAX]
  const unit = (W - 2 * PAD) / (xMax - xMin)
  const H = Math.round(Math.min(H_MAX, Math.max(H_MIN, (yMax - yMin) * unit + 2 * PAD)))
  const sx = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * (W - 2 * PAD)
  const sy = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin)) * (H - 2 * PAD)
  const out: string[] = []
  const font = `font-family="'Times New Roman',serif" font-size="15"`

  // trục nằm ở 0 nếu 0 trong miền, không thì bám mép
  const ax = Math.min(Math.max(0, yMin), yMax)
  const ay = Math.min(Math.max(0, xMin), xMax)
  const X0 = sx(ay)
  const Y0 = sy(ax)
  // miền x bị nới theo miền y → dùng luôn bước của trục y cho cả hai trục
  const stepX = forced && sY ? sY : niceStep(xMax - xMin)
  // cùng đơn vị thì cùng bước chia (trừ khi đành co giãn)
  const stepY = Math.abs((H - 2 * PAD) / (yMax - yMin) - unit) < 1e-6 ? stepX : sY || niceStep(yMax - yMin)
  const ticks = (lo: number, hi: number, step: number) => {
    const r: number[] = []
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) r.push(Math.round(v / step) * step)
    return r
  }
  // 0 nằm ngoài miền → trục bám mép: kẻ dấu ngắt trục, bỏ số sát chỗ trục (kẻo "29" nằm ngay chỗ O)
  const breakY = ax !== 0
  const breakX = ay !== 0
  const tx = ticks(xMin, xMax, stepX).filter((v) => !breakX || Math.abs(sx(v) - X0) > 24)
  const ty = ticks(yMin, yMax, stepY).filter((v) => !breakY || Math.abs(sy(v) - Y0) > 24)

  if (spec.grid) {
    const g = [
      ...tx.map((v) => `M${sx(v).toFixed(1)} ${PAD}V${H - PAD}`),
      ...ty.map((v) => `M${PAD} ${sy(v).toFixed(1)}H${W - PAD}`),
    ].join('')
    out.push(`<path d="${g}" stroke="#d9dde2" stroke-width="1" fill="none"/>`)
  }

  // trục + mũi tên
  out.push(
    `<path d="M${PAD - 6} ${Y0}H${W - 4}M${X0} ${H - PAD + 6}V4" stroke="#222" stroke-width="1.4" fill="none"/>`,
    `<path d="M${W - 4} ${Y0}l-9 -4v8z M${X0} 4l-4 9h8z" fill="#222"/>`,
    `<text x="${W - 10}" y="${Y0 - 10}" ${font} font-style="italic" text-anchor="end" data-lbl="ax:x">x</text>`,
    `<text x="${X0 + 9}" y="16" ${font} font-style="italic" data-lbl="ax:y">y</text>`,
    `<text x="${X0 - 5}" y="${Y0 + 16}" ${font} font-style="italic" text-anchor="end" data-lbl="ax:O">O</text>`,
  )
  // dấu ngắt trục (hai gạch chéo sát gốc O), nền trắng che khúc trục ở giữa
  if (breakY)
    out.push(`<path d="M${X0 - 5} ${Y0 - 9}h10v6h-10z" fill="#fff"/><path d="M${X0 - 6} ${Y0 - 6}l12 -5M${X0 - 6} ${Y0 - 1}l12 -5" stroke="#222" stroke-width="1.3"/>`)
  if (breakX)
    out.push(`<path d="M${X0 + 9} ${Y0 - 5}h6v10h-6z" fill="#fff"/><path d="M${X0 + 8} ${Y0 + 6}l5 -12M${X0 + 13} ${Y0 + 6}l5 -12" stroke="#222" stroke-width="1.3"/>`)
  // vạch chia + số
  const tickPath: string[] = []
  for (const v of tx) {
    if (Math.abs(v) < 1e-9) continue
    const x = sx(v)
    if (x > W - 22) continue
    tickPath.push(`M${x.toFixed(1)} ${Y0 - 3}v6`)
    out.push(`<text x="${x.toFixed(1)}" y="${Y0 + 17}" ${font} text-anchor="middle" data-lbl="x:${Math.round(v * 1000) / 1000}">${fmt(v)}</text>`)
  }
  for (const v of ty) {
    if (Math.abs(v) < 1e-9) continue
    const y = sy(v)
    if (y < 22) continue
    tickPath.push(`M${X0 - 3} ${y.toFixed(1)}h6`)
    out.push(`<text x="${X0 - 7}" y="${(y + 5).toFixed(1)}" ${font} text-anchor="end" data-lbl="y:${Math.round(v * 1000) / 1000}">${fmt(v)}</text>`)
  }
  out.push(`<path d="${tickPath.join('')}" stroke="#222" stroke-width="1.2"/>`)

  // điểm đặt tên: "M(0; 0)", thêm "chiếu" để kẻ nét đứt xuống hai trục
  const plotPoints = parsePlotPoints(spec.points)

  // đường cong: lấy mẫu dày, ngắt nét ở chỗ không xác định hoặc nhảy vọt (tiệm cận)
  out.push(`<clipPath id="plotclip"><rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/></clipPath>`)
  const N = 1200
  const span = yMax - yMin
  const marginW = (W - 2 * PAD) * 0.08
  const marginH = (H - 2 * PAD) * 0.08
  const safeX0 = PAD + marginW
  const safeX1 = W - PAD - marginW
  const safeY0 = PAD + marginH
  const safeY1 = H - PAD - marginH

  interface CurvePoint {
    px: number
    py: number
    inView: boolean
    isCont: boolean
  }

  interface CurveRecord {
    c: { expr: string; color: string }
    ci: number
    points: CurvePoint[]
    validIndices: number[]
  }

  const curveRecords: CurveRecord[] = []

  spec.curves.forEach((c, ci) => {
    let f: Fn
    try {
      f = parseExpr(c.expr)
    } catch {
      return
    }
    let d = ''
    let pen = false
    let prev = NaN
    const points: CurvePoint[] = []

    for (let k = 0; k <= N; k++) {
      const x = xMin + ((xMax - xMin) * k) / N
      const y = f(x)
      const ok = Number.isFinite(y) && Math.abs(y - yMin) < span * 20 && Math.abs(y - yMax) < span * 20
      const jump = ok && Number.isFinite(prev) && Math.abs(y - prev) > span * 1.5
      const px = sx(x)
      const py = sy(y)
      const inView = ok && y >= yMin && y <= yMax
      const isCont = ok && !jump && Number.isFinite(prev)
      points.push({ px, py, inView, isCont })

      if (!ok || jump) pen = false
      if (ok) {
        d += `${pen ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`
        pen = true
      }
      prev = ok ? y : NaN
    }
    out.push(`<path d="${d}" stroke="${c.color}" stroke-width="2.2" fill="none" stroke-linejoin="round" clip-path="url(#plotclip)"/>`)

    // Tìm các vị trí mỏ neo hợp lệ: trong miền 8% mép trong và không sát chỗ nhảy tiệm cận
    const validIndices: number[] = []
    for (let k = 10; k <= N - 10; k++) {
      const pt = points[k]
      if (!pt.inView) continue
      if (pt.px < safeX0 || pt.px > safeX1 || pt.py < safeY0 || pt.py > safeY1) continue
      let cont = true
      for (let j = k - 8; j <= k + 8; j++) {
        if (!points[j].isCont && j > k - 8) {
          cont = false
          break
        }
      }
      if (cont) validIndices.push(k)
    }

    curveRecords.push({ c, ci, points, validIndices })
  })

  // Đặt nhãn tên hàm cạnh đồ thị theo SGK (xoay theo tiếp tuyến, cách nét, không đè)
  if (spec.labels && curveRecords.length > 0) {
    // Thu thập các vật cản: trục, số, nhãn trục, tên điểm, giao điểm giữa các đường
    const axesPoints: Array<{ x: number; y: number }> = []
    for (let x = PAD; x <= W - PAD; x += 8) axesPoints.push({ x, y: Y0 })
    for (let y = PAD; y <= H - PAD; y += 8) axesPoints.push({ x: X0, y })

    const axisLabels: Array<{ x: number; y: number }> = [
      { x: W - 10, y: Y0 - 10 },
      { x: X0 + 9, y: 16 },
      { x: X0 - 5, y: Y0 + 16 },
      ...tx.map((v) => ({ x: sx(v), y: Y0 + 17 })),
      ...ty.map((v) => ({ x: X0 - 7, y: sy(v) })),
    ]

    const userPoints = plotPoints
      .filter((p) => p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax)
      .map((p) => ({ x: sx(p.x), y: sy(p.y) }))

    const intersections: Array<{ x: number; y: number }> = []
    for (let a = 0; a < curveRecords.length; a++) {
      for (let b = a + 1; b < curveRecords.length; b++) {
        const ptsA = curveRecords[a].points
        const ptsB = curveRecords[b].points
        for (let k = 0; k <= N; k++) {
          if (ptsA[k].inView && ptsB[k].inView && Math.abs(ptsA[k].py - ptsB[k].py) <= 8) {
            intersections.push({ x: ptsA[k].px, y: ptsA[k].py })
            k += 10
          }
        }
      }
    }

    interface PlacedLabelInfo {
      cx: number
      cy: number
      deg: number
      cosPhi: number
      sinPhi: number
      halfW: number
      halfH: number
      corners: Array<{ x: number; y: number }>
    }

    const placedLabels: PlacedLabelInfo[] = []

    curveRecords.forEach((cr) => {
      let anchors = cr.validIndices
      if (anchors.length === 0) {
        anchors = cr.points.map((p, k) => (p.inView ? k : -1)).filter((k) => k >= 0)
      }
      if (anchors.length === 0) return

      const sampleCount = Math.min(20, anchors.length)
      const step = (anchors.length - 1) / Math.max(1, sampleCount - 1)
      const sampledAnchors: number[] = []
      for (let m = 0; m < sampleCount; m++) {
        sampledAnchors.push(anchors[Math.round(m * step)])
      }

      const pretty = prettyExpr(cr.c.expr)
      const visibleText = 'y = ' + pretty.replace(/<[^>]+>/g, '')
      const halfW = Math.max(16, (visibleText.length * 7.5) / 2)
      const halfH = 7.5

      interface Candidate {
        cx: number
        cy: number
        deg: number
        cosPhi: number
        sinPhi: number
        corners: Array<{ x: number; y: number }>
        score: number
      }

      let best: Candidate | null = null

      for (const k of sampledAnchors) {
        const k0 = Math.max(0, k - 4)
        const k1 = Math.min(N, k + 4)
        const dx = cr.points[k1].px - cr.points[k0].px
        const dy = cr.points[k1].py - cr.points[k0].py
        const theta = Math.atan2(dy, dx)
        const deg = (theta * 180) / Math.PI
        const clampedDeg = Math.max(-70, Math.min(70, deg))
        const phi = (clampedDeg * Math.PI) / 180
        const cosPhi = Math.cos(phi)
        const sinPhi = Math.sin(phi)

        const kc0 = Math.max(0, k - 6)
        const kc1 = Math.min(N, k + 6)
        const th1 = Math.atan2(cr.points[k].py - cr.points[kc0].py, cr.points[k].px - cr.points[kc0].px)
        const th2 = Math.atan2(cr.points[kc1].py - cr.points[k].py, cr.points[kc1].px - cr.points[k].px)
        const curvature = Math.abs(th2 - th1)

        const nx = Math.sin(theta)
        const ny = -Math.cos(theta)
        const D_NORM = 12

        const sides = [
          { side: 1, cx: cr.points[k].px + D_NORM * nx, cy: cr.points[k].py + D_NORM * ny },
          { side: -1, cx: cr.points[k].px - D_NORM * nx, cy: cr.points[k].py - D_NORM * ny },
        ]

        for (const s of sides) {
          const corners = getBoxCorners(s.cx, s.cy, cosPhi, sinPhi, halfW, halfH)
          let score = 0

          // 1. Phạt tràn khung
          const xMinF = PAD + 4
          const xMaxF = W - PAD - 4
          const yMinF = PAD + 4
          const yMaxF = H - PAD - 4
          for (const c of corners) {
            let ox = 0
            let oy = 0
            if (c.x < xMinF) ox += xMinF - c.x
            if (c.x > xMaxF) ox += c.x - xMaxF
            if (c.y < yMinF) oy += yMinF - c.y
            if (c.y > yMaxF) oy += c.y - yMaxF
            if (ox > 0 || oy > 0) score += 20000 + (ox + oy) * 200
          }

          // 2. Phạt cắt đường cong
          for (const other of curveRecords) {
            const isSelf = other.ci === cr.ci
            for (let i = 0; i < other.points.length; i += 3) {
              const pt = other.points[i]
              if (!pt.inView) continue
              const d = distToBox(pt.px, pt.py, s.cx, s.cy, cosPhi, sinPhi, halfW, halfH)
              if (isSelf) {
                if (d === 0) score += 8000
                else if (d < 2.5) score += (2.5 - d) * 600
                else if (d < 3.8) score += (3.8 - d) * 40
              } else {
                if (d === 0) score += 15000
                else if (d < 3.5) score += 3000 + (3.5 - d) * 800
                else if (d < 10) score += (10 - d) * 80
              }
            }
          }

          // 3. Phạt cắt trục toạ độ
          for (const ap of axesPoints) {
            const d = distToBox(ap.x, ap.y, s.cx, s.cy, cosPhi, sinPhi, halfW, halfH)
            if (d === 0) score += 10000
            else if (d < 3.5) score += 2000 + (3.5 - d) * 500
            else if (d < 8) score += (8 - d) * 30
          }

          // 4. Phạt đè số/nhãn trục
          for (const lp of axisLabels) {
            const d = distToBox(lp.x, lp.y, s.cx, s.cy, cosPhi, sinPhi, halfW, halfH)
            if (d < 12) score += 2000 + (12 - d) * 300
          }

          // 5. Phạt đè tên điểm
          for (const up of userPoints) {
            const d = distToBox(up.x, up.y, s.cx, s.cy, cosPhi, sinPhi, halfW, halfH)
            if (d < 15) score += 2500 + (15 - d) * 250
          }

          // 6. Phạt đè nhãn hàm đã đặt
          for (const pl of placedLabels) {
            const distCenter = Math.hypot(s.cx - pl.cx, s.cy - pl.cy)
            if (distCenter < halfW + pl.halfW + 15) {
              let minD = distToBox(pl.cx, pl.cy, s.cx, s.cy, cosPhi, sinPhi, halfW, halfH)
              for (const cor of pl.corners) {
                minD = Math.min(minD, distToBox(cor.x, cor.y, s.cx, s.cy, cosPhi, sinPhi, halfW, halfH))
              }
              for (const cor of corners) {
                minD = Math.min(minD, distToBox(cor.x, cor.y, pl.cx, pl.cy, pl.cosPhi, pl.sinPhi, pl.halfW, pl.halfH))
              }
              if (minD === 0) score += 40000
              else if (minD < 12) score += 5000 + (12 - minD) * 600
            }
          }

          // 7. Phạt nhẹ gần giao điểm các đường cong
          for (const ip of intersections) {
            const d = Math.hypot(s.cx - ip.x, s.cy - ip.y)
            if (d < 35) score += (35 - d) * 5
          }

          // 8. Ưu tiên đường cong ít cong
          score += curvature * 40

          // 9. Ưu tiên bên phải, gần cuối đường
          const t = k / Math.max(1, N)
          score += (1 - t) * 35
          score += (1 - s.cx / W) * 25

          // 10. Ưu tiên nhẹ phía trên nếu cả hai phía đều thoáng
          if (s.side === -1) score += 5

          if (!best || score < best.score) {
            best = {
              cx: s.cx,
              cy: s.cy,
              deg: clampedDeg,
              cosPhi,
              sinPhi,
              corners,
              score,
            }
          }
        }
      }

      if (best) {
        placedLabels.push({
          cx: best.cx,
          cy: best.cy,
          deg: best.deg,
          cosPhi: best.cosPhi,
          sinPhi: best.sinPhi,
          halfW,
          halfH,
          corners: best.corners,
        })
        out.push(
          `<text x="${best.cx.toFixed(1)}" y="${best.cy.toFixed(1)}" dominant-baseline="central" transform="rotate(${best.deg.toFixed(1)} ${best.cx.toFixed(1)} ${best.cy.toFixed(1)})" text-anchor="middle" ${font} fill="${cr.c.color}" font-style="italic" data-lbl="cv:${cr.ci}">y = ${pretty}</text>`,
        )
      }
    })
  }

  // điểm đặt tên: "M(0; 0)", thêm "chiếu" để kẻ nét đứt xuống hai trục
  for (const p of plotPoints) {
    if (p.x < xMin || p.x > xMax || p.y < yMin || p.y > yMax) continue
    const [px, py] = [sx(p.x), sy(p.y)]
    if (p.proj) out.push(`<path d="M${px.toFixed(1)} ${py.toFixed(1)}V${Y0.toFixed(1)}M${px.toFixed(1)} ${py.toFixed(1)}H${X0.toFixed(1)}" stroke="#222" stroke-width="1" stroke-dasharray="4 3" fill="none"/>`)
    out.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.6" fill="#111"/>`)
    // nằm trên đường cong ở đáy lõm (cực tiểu) thì ghi tên phía dưới, kẻo đè lên nét
    let below = py < 40
    try {
      const f = parseExpr(spec.curves[0]?.expr ?? '')
      const h = (xMax - xMin) / 200
      if (Math.abs(f(p.x) - p.y) < (yMax - yMin) / 50 && f(p.x - h) > p.y && f(p.x + h) > p.y) below = sy(p.y) < H - 30
    } catch {
      /* không có đường cong */
    }
    const right = px < W - 40
    out.push(`<text x="${(px + (right ? 8 : -8)).toFixed(1)}" y="${(py + (below ? 20 : -8)).toFixed(1)}" ${font} font-style="italic" font-weight="bold" text-anchor="${right ? 'start' : 'end'}" data-lbl="pt:${esc(p.name)}">${esc(p.name)}</text>`)
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<desc>${esc(JSON.stringify({ dePlot: spec }))}</desc>` +
    `<rect width="${W}" height="${H}" fill="#fff"/>` +
    `<g fill="#222">` +
    out.join('') +
    `</g>` +
    `</svg>`
  return { svg, width: W, height: H }
}

export const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`

/** SVG → PNG data URL (bản xuất Word không đọc được SVG) */
export function svgToPng(svg: string, width: number, height: number, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Trình duyệt không hỗ trợ canvas'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Không dựng được ảnh đồ thị'))
    img.src = svgDataUrl(svg)
  })
}
