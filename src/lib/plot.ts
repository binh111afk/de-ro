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
}

export const PLOT_COLORS = ['#1f5fbf', '#c0392b', '#2e7d32', '#8e44ad']

/** bề rộng khung vẽ (px); chiều cao tính theo miền y để hai trục cùng đơn vị */
const W = 640
const PAD = 18
const H_MIN = 220
const H_MAX = 720

/** bước vạch chia "đẹp" (1, 2, 5 × 10^k) cho khoảng `span` */
function niceStep(span: number) {
  const raw = span / 10
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const m = raw / p
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p
}

const fmt = (v: number) => String(Math.round(v * 1000) / 1000).replace('.', ',').replace('-', '−')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

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
      lo = best
      hi = best + cap
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
  const { xMin, xMax, yMin, yMax } = spec
  // cùng đơn vị hai trục; miền y quá dài/ngắn so với miền x thì đành co giãn trong [H_MIN, H_MAX]
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
  const stepX = niceStep(xMax - xMin)
  // cùng đơn vị thì cùng bước chia (trừ khi đành co giãn)
  const stepY = Math.abs((H - 2 * PAD) / (yMax - yMin) - unit) < 1e-6 ? stepX : niceStep(yMax - yMin)
  const ticks = (lo: number, hi: number, step: number) => {
    const r: number[] = []
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) r.push(Math.round(v / step) * step)
    return r
  }
  const tx = ticks(xMin, xMax, stepX)
  const ty = ticks(yMin, yMax, stepY)

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
    `<text x="${W - 10}" y="${Y0 - 10}" ${font} font-style="italic" text-anchor="end">x</text>`,
    `<text x="${X0 + 9}" y="16" ${font} font-style="italic">y</text>`,
    `<text x="${X0 - 5}" y="${Y0 + 16}" ${font} font-style="italic" text-anchor="end">O</text>`,
  )
  // vạch chia + số
  const tickPath: string[] = []
  for (const v of tx) {
    if (Math.abs(v) < 1e-9) continue
    const x = sx(v)
    if (x > W - 22) continue
    tickPath.push(`M${x.toFixed(1)} ${Y0 - 3}v6`)
    out.push(`<text x="${x.toFixed(1)}" y="${Y0 + 17}" ${font} text-anchor="middle">${fmt(v)}</text>`)
  }
  for (const v of ty) {
    if (Math.abs(v) < 1e-9) continue
    const y = sy(v)
    if (y < 22) continue
    tickPath.push(`M${X0 - 3} ${y.toFixed(1)}h6`)
    out.push(`<text x="${X0 - 7}" y="${(y + 5).toFixed(1)}" ${font} text-anchor="end">${fmt(v)}</text>`)
  }
  out.push(`<path d="${tickPath.join('')}" stroke="#222" stroke-width="1.2"/>`)

  // đường cong: lấy mẫu dày, ngắt nét ở chỗ không xác định hoặc nhảy vọt (tiệm cận)
  out.push(`<clipPath id="plotclip"><rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}"/></clipPath>`)
  const N = 1200
  const span = yMax - yMin
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
    let last: [number, number] | null = null
    for (let k = 0; k <= N; k++) {
      const x = xMin + ((xMax - xMin) * k) / N
      const y = f(x)
      const ok = Number.isFinite(y) && Math.abs(y - yMin) < span * 20 && Math.abs(y - yMax) < span * 20
      const jump = ok && Number.isFinite(prev) && Math.abs(y - prev) > span * 1.5
      if (!ok || jump) pen = false
      if (ok) {
        d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`
        pen = true
        if (y >= yMin && y <= yMax) last = [x, y]
      }
      prev = ok ? y : NaN
    }
    out.push(`<path d="${d}" stroke="${c.color}" stroke-width="2.2" fill="none" stroke-linejoin="round" clip-path="url(#plotclip)"/>`)
    if (spec.labels && last) {
      const lx = Math.min(sx(last[0]) - 6, W - 30)
      const ly = Math.max(sy(last[1]) - 8 - ci * 2, 30)
      out.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" ${font} fill="${c.color}" font-style="italic" text-anchor="end">y = ${esc(c.expr.trim())}</text>`)
    }
  })

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
