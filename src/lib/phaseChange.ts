/**
 * Đồ thị chuyển thể (Vật lí 12): biểu diễn sự thay đổi nhiệt độ theo thời gian
 * (nóng chảy, sôi, đông đặc, ngưng tụ). Hỗ trợ gốc O tại min(0, yMin), đặt tên
 * điểm A, B, C, kí hiệu trên trục (60 = T_1 → T₁), nét đứt gióng và kéo dài
 * ngang sau điểm cuối.
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
const cleanZero = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n)
const fmt = (n: number) => String(Math.round(cleanZero(n) * 1000) / 1000).replace('.', ',').replace('-', '−')
const ARROW = `<defs><marker id="phasearr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`
const SUB = '₀₁₂₃₄₅₆₇₈₉'

export interface PhaseSpec {
  yName: string
  tName: string
  /** mỗi dòng / cách nhau bằng dấu cách một điểm: "(0; -45)", có tên: "A: (15; -8,83)";
   *  toạ độ có thể kèm kí hiệu hiện trên trục: "C: (60 = T_1; 0)" hoặc "(70 = T_2; 0)";
   *  thêm "_" trước toạ độ "_(80; 20)" để vẽ đoạn tiếp theo mà không hiện vạch số trên trục */
  points: string
  /** phần kéo dài sau điểm cuối (đoạn ngang ra mép đồ thị), mặc định true */
  extend: boolean
  dashed: boolean
  dots: boolean
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

export const PHASE_DEFAULT: PhaseSpec = {
  yName: 't (°C)',
  tName: 'T (phút)',
  points: '(0; -20)\n(4; 0)\n(14; 0)\n(24; 100)',
  extend: true,
  dashed: true,
  dots: true,
}

export interface PhasePoint {
  name?: string
  hidden: boolean
  x: number
  y: number
  xSymbol?: string
  ySymbol?: string
}

const NUM_RE = /^-?\d+(?:\.\d+)?$/

function parseNum(s: string): number | null {
  const norm = s.trim().replace(/−/g, '-').replace(',', '.')
  if (!NUM_RE.test(norm)) return null
  const v = Number(norm)
  return Number.isFinite(v) ? cleanZero(v) : null
}

function parseCoord(raw: string, axisLabel: string): { value: number; symbol?: string } {
  const parts = raw.split('=')
  if (parts.length > 2) throw new Error(`Sai cú pháp toạ độ "${raw.trim()}" (dư dấu "=")`)
  if (parts.length === 1) {
    const v = parseNum(parts[0])
    if (v !== null) return { value: v }
    const sym = parts[0].trim()
    if (/^[\p{L}][\p{L}\p{N}_'’{}]*$/u.test(sym)) {
      throw new Error(`Thiếu giá trị số cho "${sym}" ở ${axisLabel} (viết dạng "60 = ${sym}")`)
    }
    throw new Error(`Không đọc được giá trị "${raw.trim()}" ở ${axisLabel}`)
  }
  const left = parts[0].trim()
  const right = parts[1].trim()
  if (!left || !right) throw new Error(`Thiếu giá trị hoặc kí hiệu quanh dấu "=" ở "${raw.trim()}"`)
  const vLeft = parseNum(left)
  const vRight = parseNum(right)
  if (vLeft !== null) return { value: vLeft, symbol: right }
  if (vRight !== null) return { value: vRight, symbol: left }
  throw new Error(`Toạ độ "${raw.trim()}" ở ${axisLabel} cần gồm một số và một kí hiệu, vd. "60 = T_1"`)
}

export function parsePhasePoints(text: string): PhasePoint[] {
  const out: PhasePoint[] = []
  const seenNames = new Set<string>()
  const pointRe = /(?:([\p{L}\p{N}_'’]+)\s*(?::|=)?\s*)?\(\s*([^;()]+?)\s*;\s*([^;()]+?)\s*\)/uy
  let pos = 0
  while (pos < text.length) {
    while (pos < text.length && /\s/.test(text[pos])) pos++
    if (pos >= text.length) break
    pointRe.lastIndex = pos
    const m = pointRe.exec(text)
    if (!m) {
      const rest = text.slice(pos).split(/\r?\n/)[0].trim().slice(0, 32)
      throw new Error(`Sai cú pháp điểm gần "${rest}". Viết dạng "(0; -45)" hoặc "A: (15; -8,83)"`)
    }
    pos = pointRe.lastIndex
    if (text[pos] === ';') pos++

    const rawName = m[1]?.trim()
    const hidden = Boolean(rawName && rawName.startsWith('_'))
    const name = rawName && !hidden ? rawName : undefined
    if (name) {
      if (seenNames.has(name)) throw new Error(`Trùng tên điểm "${name}"`)
      seenNames.add(name)
    }
    const cx = parseCoord(m[2], 'trục ngang')
    const cy = parseCoord(m[3], 'trục dọc')
    if (cx.value < 0) throw new Error(`Thời gian không được âm (${m[2].trim()})`)
    if (out.length && cx.value <= out[out.length - 1].x) {
      throw new Error(`Thời gian phải tăng dần (${fmt(out[out.length - 1].x)} → ${fmt(cx.value)})`)
    }
    out.push({
      name,
      hidden,
      x: cx.value,
      y: cy.value,
      xSymbol: cx.symbol,
      ySymbol: cy.symbol,
    })
  }
  if (out.length < 2) throw new Error('Cần ít nhất 2 điểm dạng (thời gian; nhiệt độ), vd. (0; -20) (4; 0)')
  return out
}

function applySubscripts(escaped: string): string {
  return escaped.replace(/_\{([^{}]+)\}|_([\p{L}\p{N}]+)/gu, (_, braced?: string, plain?: string) => {
    const subTxt = braced ?? plain ?? ''
    return /^\d+$/.test(subTxt)
      ? [...subTxt].map((c) => SUB[Number(c)]).join('')
      : `<tspan baseline-shift="sub" font-size="70%">${subTxt}</tspan>`
  })
}

function formatSymbol(raw: string): string {
  const trimmed = raw.trim()
  if (/^[\p{L}]$/u.test(trimmed)) return `<tspan font-style="italic">${esc(trimmed)}</tspan>`
  const s = esc(trimmed).replace(/([\p{L}])(?=_|[₀-₉])/gu, '<tspan font-style="italic">$1</tspan>')
  return applySubscripts(s)
}

function formatPointName(raw: string): string {
  return applySubscripts(esc(raw.trim()))
}

function formatAxisName(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  const m = /^([^\s(]{1,4})\s*(\([^)]+\))$/u.exec(t)
  if (m) return `${formatSymbol(m[1])} ${esc(m[2])}`
  if (/^[\p{L}](?:_\{[^{}]+\}|_[\p{L}\p{N}]+|[₀-₉]+)?$/u.test(t)) return formatSymbol(t)
  return applySubscripts(esc(t))
}

function estTextW(raw: string, fontSize: number): number {
  const clean = raw.replace(/[{}]/g, '')
  let w = 0
  let inSub = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (ch === '_') {
      inSub = true
      continue
    }
    if (!/[\p{L}\p{N}]/u.test(ch)) inSub = false
    const scale = inSub || /[₀-₉]/.test(ch) ? 0.72 : 1
    let cw = 0.52
    if (/[MWmŵw@#%&]/.test(ch)) cw = 0.78
    else if (/[.,:;!|()[\]' ]/.test(ch)) cw = 0.32
    else if (/[iljtfrI1]/.test(ch)) cw = 0.36
    else if (ch !== ch.toLowerCase() || /[0-9−-]/.test(ch)) cw = 0.56
    w += cw * scale
  }
  return w * fontSize
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-9) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

interface YTick {
  v: number
  rawLabel: string
  htmlLabel: string
  trueY: number
  ly: number
}

interface XTick {
  v: number
  rawLabel: string
  htmlLabel: string
  w: number
  trueX: number
  lx: number
}

export function renderPhaseSvg(spec: PhaseSpec, desc: string): { svg: string; width: number; height: number } {
  const pts = parsePhasePoints(spec.points)
  const yMin = Math.min(...pts.map((p) => p.y))
  const yMax = Math.max(...pts.map((p) => p.y))
  const yBase = Math.min(0, yMin)
  const xMax = Math.max(...pts.map((p) => p.x)) || 1
  const willExtend = Boolean(spec.extend && !pts[pts.length - 1].hidden)

  // gom nhãn trục dọc theo giá trị y (mỗi giá trị ghi một lần)
  const yMap = new Map<number, string[]>()
  for (const p of pts) {
    if (p.hidden || p.ySymbol === '_') continue
    const key = Math.round(p.y * 1e6) / 1e6
    const syms = yMap.get(key) ?? []
    if (p.ySymbol && !syms.includes(p.ySymbol)) syms.push(p.ySymbol)
    yMap.set(key, syms)
  }
  if (yBase < 0) {
    const baseKey = Math.round(yBase * 1e6) / 1e6
    if (!yMap.has(baseKey)) yMap.set(baseKey, [])
  }

  const rawYTicks: Array<{ v: number; syms: string[] }> = []
  for (const [v, syms] of yMap) {
    if (yBase === 0 && Math.abs(v) < 1e-9 && syms.length === 0) continue
    rawYTicks.push({ v, syms })
  }
  rawYTicks.sort((a, b) => b.v - a.v)

  const yTickMeta = rawYTicks.map((t) => ({
    v: t.v,
    rawLabel: t.syms.length ? t.syms.join(' = ') : fmt(t.v),
    htmlLabel: t.syms.length ? t.syms.map(formatSymbol).join(' = ') : fmt(t.v),
  }))

  const maxYW = Math.max(0, ...yTickMeta.map((t) => estTextW(t.rawLabel, 13)))
  const W = 450
  const H = 310
  const left = Math.max(56, Math.ceil(maxYW) + 16)
  const right = W - 44
  const top = 38
  const plotTop = top + 20
  const bottom = H - 46

  const xRightVal = xMax * (willExtend ? 1.26 : 1.14)
  const X = (t: number) => left + (t / xRightVal) * (right - left)
  const Y = (v: number) => (yMax > yBase ? bottom - ((v - yBase) / (yMax - yBase)) * (bottom - plotTop) : bottom)

  // tính vị trí và giãn nhãn trục dọc nếu quá sát
  const yTicks: YTick[] = yTickMeta.map((t) => {
    const ty = Y(t.v)
    return { ...t, trueY: ty, ly: ty + 4.5 }
  })
  const minYGap = 14
  const yLo = top + 4
  const yHi = bottom + 4.5
  const pinnedBottom = yBase < 0 && yTicks.length > 0 && Math.abs(yTicks[yTicks.length - 1].v - yBase) < 1e-9
  for (let pass = 0; pass < 24; pass++) {
    for (let i = 0; i < yTicks.length - 1; i++) {
      const gap = yTicks[i + 1].ly - yTicks[i].ly
      if (gap < minYGap) {
        const need = minYGap - gap
        if (pinnedBottom && i + 1 === yTicks.length - 1) {
          yTicks[i].ly -= need
        } else {
          yTicks[i].ly -= need * 0.5
          yTicks[i + 1].ly += need * 0.5
        }
      }
    }
    if (yTicks.length) {
      yTicks[0].ly = Math.max(yLo, yTicks[0].ly)
      if (pinnedBottom) yTicks[yTicks.length - 1].ly = yHi
      else yTicks[yTicks.length - 1].ly = Math.min(yHi, yTicks[yTicks.length - 1].ly)
      for (let i = yTicks.length - 2; i >= 0; i--) {
        if (yTicks[i + 1].ly - yTicks[i].ly < minYGap) yTicks[i].ly = yTicks[i + 1].ly - minYGap
      }
      if (yTicks[0].ly < yLo) {
        yTicks[0].ly = yLo
        for (let i = 1; i < yTicks.length; i++) {
          if (yTicks[i].ly - yTicks[i - 1].ly < minYGap) yTicks[i].ly = yTicks[i - 1].ly + minYGap
        }
      }
    }
  }

  // nhãn trục ngang (tránh đè nhau)
  const xTicks: XTick[] = []
  for (const p of pts) {
    if (p.hidden || p.xSymbol === '_') continue
    if (Math.abs(p.x) < 1e-9 && !p.xSymbol) continue
    const rawLabel = p.xSymbol ?? fmt(p.x)
    const htmlLabel = p.xSymbol ? formatSymbol(p.xSymbol) : fmt(p.x)
    const tx = X(p.x)
    xTicks.push({ v: p.x, rawLabel, htmlLabel, w: estTextW(rawLabel, 13), trueX: tx, lx: tx })
  }
  for (let pass = 0; pass < 16; pass++) {
    if (xTicks.length) xTicks[0].lx = Math.max(left + 12 + xTicks[0].w / 2, xTicks[0].lx)
    for (let i = 0; i < xTicks.length - 1; i++) {
      const minDist = (xTicks[i].w + xTicks[i + 1].w) / 2 + 6
      const gap = xTicks[i + 1].lx - xTicks[i].lx
      if (gap < minDist) {
        const need = minDist - gap
        xTicks[i].lx -= need * 0.5
        xTicks[i + 1].lx += need * 0.5
      }
    }
    if (xTicks.length) {
      xTicks[0].lx = Math.max(left + 12 + xTicks[0].w / 2, xTicks[0].lx)
      xTicks[xTicks.length - 1].lx = Math.min(right + 2, xTicks[xTicks.length - 1].lx)
      for (let i = xTicks.length - 2; i >= 0; i--) {
        const minDist = (xTicks[i].w + xTicks[i + 1].w) / 2 + 6
        if (xTicks[i + 1].lx - xTicks[i].lx < minDist) xTicks[i].lx = xTicks[i + 1].lx - minDist
      }
    }
  }

  let b = ARROW
  // hai trục + mũi tên + nhãn trục + O
  b += `<path d="M${left} ${bottom}H${right + 20}" stroke="#111" stroke-width="1.3" marker-end="url(#phasearr)"/>`
  b += `<path d="M${left} ${bottom}V${top - 20}" stroke="#111" stroke-width="1.3" marker-end="url(#phasearr)"/>`
  b += `<text x="${right + 24}" y="${bottom + 18}" ${FAM} font-size="14" text-anchor="end" data-lbl="ax:t">${formatAxisName(spec.tName)}</text>`
  b += `<text x="${left + 8}" y="${top - 12}" ${FAM} font-size="14" data-lbl="ax:y">${formatAxisName(spec.yName)}</text>`
  if (yBase < 0) {
    b += `<text x="${left}" y="${bottom + 18}" ${FAM} font-size="13.5" text-anchor="middle" data-lbl="ax:O">O</text>`
  } else {
    b += `<text x="${left - 6}" y="${bottom + 17}" ${FAM} font-size="13.5" text-anchor="end" data-lbl="ax:O">O</text>`
  }

  // vạch và nhãn trục ngang
  for (const t of xTicks) {
    b += `<path d="M${f1(t.trueX)} ${bottom - 3}V${bottom + 3}" stroke="#111"/>`
    const shifted = Math.abs(t.lx - t.trueX) > 2.5
    if (shifted) b += `<path d="M${f1(t.trueX)} ${bottom + 3}L${f1(t.lx)} ${bottom + 7}" stroke="#111" stroke-width="0.7"/>`
    b += `<text x="${f1(t.lx)}" y="${bottom + (shifted ? 20 : 18)}" ${FAM} font-size="13" text-anchor="middle" data-lbl="x:${Math.round(t.v * 1000) / 1000}">${t.htmlLabel}</text>`
  }

  // vạch và nhãn trục dọc
  for (const t of yTicks) {
    const isBase = Math.abs(t.v - yBase) < 1e-9
    if (!isBase) b += `<path d="M${left - 3} ${f1(t.trueY)}H${left + 3}" stroke="#111"/>`
    const shifted = Math.abs(t.ly - (t.trueY + 4.5)) > 3
    if (shifted) b += `<path d="M${left - 3} ${f1(t.trueY)}L${left - 8} ${f1(t.ly - 4)}" stroke="#111" stroke-width="0.7"/>`
    b += `<text x="${left - (shifted ? 10 : 7)}" y="${f1(t.ly)}" ${FAM} font-size="13" text-anchor="end" data-lbl="y:${Math.round(t.v * 1000) / 1000}">${t.htmlLabel}</text>`
  }

  // nét đứt gióng xuống trục ngang và sang trục dọc
  if (spec.dashed) {
    const indexOfPt = new Map(pts.map((p, idx) => [p, idx]))
    const byY = new Map<number, PhasePoint[]>()
    for (const p of pts) {
      if (p.hidden) continue
      const px = X(p.x)
      const py = Y(p.y)
      if (p.x > 0 && Math.abs(p.y - yBase) > 1e-9) {
        b += `<path d="M${f1(px)} ${f1(py)}V${bottom}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
      }
      if (Math.abs(p.y - yBase) > 1e-9) {
        const key = Math.round(p.y * 1e6) / 1e6
        byY.set(key, [...(byY.get(key) ?? []), p])
      }
    }
    for (const group of byY.values()) {
      const py = Y(group[0].y)
      if (group[0].x > 0) {
        b += `<path d="M${left} ${f1(py)}H${f1(X(group[0].x))}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
      }
      for (let i = 1; i < group.length; i++) {
        const prev = group[i - 1]
        const cur = group[i]
        const idxPrev = indexOfPt.get(prev)!
        const idxCur = indexOfPt.get(cur)!
        if (idxCur - idxPrev === 1) continue // đoạn AB nằm ngang liền nét đã nối sẵn
        b += `<path d="M${f1(X(prev.x))} ${f1(py)}H${f1(X(cur.x))}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
      }
    }
  }

  // đường gấp khúc + phần kéo dài ngang cuối (nếu bật)
  const coords: Array<[number, number]> = pts.map((p) => [X(p.x), Y(p.y)])
  if (willExtend) {
    const last = coords[coords.length - 1]
    coords.push([right - 4, last[1]])
  }
  b += `<path d="M${coords.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`

  // chấm điểm và tên điểm A, B, C
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    if (p.hidden || !p.name) continue
    const [px, py] = coords[i]
    if (spec.dots) b += `<circle cx="${f1(px)}" cy="${f1(py)}" r="2.8" fill="#111"/>`

    const cands: Array<{ lx: number; ly: number; anchor: 'start' | 'middle' | 'end'; cx: number; cy: number; bias: number }> =
      px - left < 12
        ? [{ lx: px + 8, ly: py - 7, anchor: 'start', cx: px + 14, cy: py - 11, bias: 0 }]
        : [
            { lx: px, ly: py - 9, anchor: 'middle', cx: px, cy: py - 13, bias: 1.5 },
            { lx: px - 6, ly: py - 8, anchor: 'end', cx: px - 11, cy: py - 12, bias: 0 },
            { lx: px + 6, ly: py - 8, anchor: 'start', cx: px + 11, cy: py - 12, bias: 0 },
          ]

    let best = cands[0]
    let bestScore = -Infinity
    for (const c of cands) {
      let minD = Math.max(0, c.cx - left)
      if (i > 0) minD = Math.min(minD, distToSeg(c.cx, c.cy, coords[i - 1][0], coords[i - 1][1], px, py))
      if (i + 1 < coords.length) minD = Math.min(minD, distToSeg(c.cx, c.cy, px, py, coords[i + 1][0], coords[i + 1][1]))
      const score = minD + c.bias
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
    const labelY = Math.max(top - 2, best.ly)
    b += `<text x="${f1(best.lx)}" y="${f1(labelY)}" ${FAM} font-size="14" text-anchor="${best.anchor}" data-lbl="pt:${esc(p.name)}">${formatPointName(p.name)}</text>`
  }

  return wrap(W, H, desc, b)
}

function wrap(W: number, H: number, desc: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: W, height: H }
}
