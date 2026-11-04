/**
 * Mạch điện kiểu SGK Vật lí: gõ mạch bằng biểu thức nối tiếp "-" / song song
 * "//" có ngoặc, máy tự xếp các nhánh thành hình chữ nhật; nguồn nằm ở cạnh dưới.
 *
 *   nguồn E = 12 V, r = 1 Ω
 *   K - A - R1=4Ω - (R2=6Ω // R3=3Ω // V) - Đ(6V-3W)
 *
 * Linh kiện nhận theo chữ đầu của tên: R điện trở, Rb biến trở, Đ/D đèn,
 * A ampe kế, V vôn kế, K khoá, C tụ, L cuộn cảm, E nguồn (đặt trong mạch).
 */

export interface CircuitSpec {
  text: string
  /** ghi giá trị (4 Ω, 6V-3W…) dưới linh kiện */
  values: boolean
}

type Kind = 'R' | 'Rb' | 'D' | 'A' | 'V' | 'K' | 'C' | 'L' | 'E'
type Node =
  | { t: 'el'; kind: Kind; name: string; value: string }
  | { t: 'ser' | 'par'; items: Node[] }
  /** điểm nút có tên: "@M" */
  | { t: 'pt'; name: string }
  /** mạch cầu: R1, R2 nhánh trên (qua M), R3, R4 nhánh dưới (qua N), R5 nối M–N */
  | { t: 'bridge'; items: Node[] }

function kindOf(name: string): Kind {
  if (/^(Rb|biến)/i.test(name)) return 'Rb'
  if (/^R/.test(name)) return 'R'
  if (/^(Đ|D|đèn)/i.test(name)) return 'D'
  if (/^A/.test(name)) return 'A'
  if (/^V/.test(name)) return 'V'
  if (/^K/.test(name)) return 'K'
  if (/^C/.test(name)) return 'C'
  if (/^L/.test(name)) return 'L'
  if (/^(E|ξ|ℰ)/.test(name)) return 'E'
  throw new Error(`Không rõ linh kiện "${name}" — tên phải bắt đầu bằng R, Rb, Đ, A, V, K, C, L hoặc E`)
}

function parseExpr(src: string): Node {
  let i = 0
  const ws = () => {
    while (i < src.length && /\s/.test(src[i])) i++
  }
  // "-" là nối tiếp khi sau nó là tên linh kiện hoặc ngoặc (không phải "6V-3W")
  const isSerAt = (k: number) => {
    if (src[k] !== '-' && src[k] !== '–') return false
    let j = k + 1
    while (j < src.length && /\s/.test(src[j])) j++
    return j >= src.length || /[^\d.,\s]/.test(src[j])
  }
  const atom = (): Node => {
    ws()
    if (src[i] === '(') {
      i++
      const n = series()
      ws()
      if (src[i] !== ')') throw new Error('Thiếu dấu ")"')
      i++
      return n
    }
    if (src[i] === '@') {
      i++
      let name = ''
      while (i < src.length && /[\p{L}\d'’]/u.test(src[i])) name += src[i++]
      if (!name) throw new Error('Sau "@" cần tên điểm, vd. @M')
      return { t: 'pt', name }
    }
    const br = /^(cầu|cau)\s*\(/i.exec(src.slice(i))
    if (br) {
      i += br[0].length
      const items: Node[] = []
      for (;;) {
        items.push(series())
        ws()
        if (src[i] === ',' || src[i] === ';') {
          i++
          continue
        }
        if (src[i] !== ')') throw new Error('Mạch cầu: thiếu dấu ")"')
        i++
        break
      }
      if (items.length !== 5) throw new Error('Mạch cầu cần đúng 5 phần: cầu(R1, R2, R3, R4, R5)')
      return { t: 'bridge', items }
    }
    let name = ''
    while (i < src.length && !/[\s()=/,;]/.test(src[i]) && !isSerAt(i)) name += src[i++]
    if (!name) throw new Error(i >= src.length ? 'Mạch đang bỏ dở ở cuối' : `Không đọc được chỗ "${src.slice(i, i + 6)}"`)
    let value = ''
    if (src[i] === '(') {
      let depth = 0
      const s = ++i
      while (i < src.length && (src[i] !== ')' || depth)) {
        if (src[i] === '(') depth++
        if (src[i] === ')') depth--
        i++
      }
      value = src.slice(s, i)
      i++
    } else {
      ws()
      if (src[i] === '=') {
        i++
        const s = i
        while (i < src.length && src[i] !== ')' && src[i] !== ',' && src[i] !== ';' && !src.startsWith('//', i) && !isSerAt(i)) i++
        value = src.slice(s, i)
      }
    }
    return { t: 'el', kind: kindOf(name), name, value: value.trim() }
  }
  const parallel = (): Node => {
    const items = [atom()]
    for (;;) {
      ws()
      if (!src.startsWith('//', i)) break
      i += 2
      items.push(atom())
    }
    return items.length === 1 ? items[0] : { t: 'par', items }
  }
  function series(): Node {
    const items = [parallel()]
    for (;;) {
      ws()
      if (!isSerAt(i)) break
      i++
      items.push(parallel())
    }
    return items.length === 1 ? items[0] : { t: 'ser', items }
  }
  const n = series()
  ws()
  if (i < src.length) throw new Error(src[i] === ')' ? 'Thừa dấu ")"' : `Không đọc được chỗ "${src.slice(i, i + 6)}"`)
  return n
}

/* ------------------------------------------------------------------ *
 * Vẽ
 * ------------------------------------------------------------------ */

const FAM = `font-family="'Times New Roman',serif"`
const SW = `stroke="#111" stroke-width="1.6" fill="none"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tw = (s: string, px = 14) => [...s].length * px * 0.55
const line = (x1: number, y1: number, x2: number, y2: number) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${SW}/>`
const dot = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="3" fill="#111"/>`

/** R1 → R in nghiêng, 1 chỉ số dưới */
function nameSvg(name: string, x: number, y: number) {
  const m = /^(\D+?)(\d*)$/.exec(name)
  const [base, sub] = m ? [m[1], m[2]] : [name, '']
  return `<text x="${x}" y="${y}" ${FAM} font-size="16" font-style="italic" text-anchor="middle">${esc(base)}${sub ? `<tspan font-size="11" dy="4">${sub}</tspan>` : ''}</text>`
}

const HALF: Record<Kind, number> = { R: 18, Rb: 18, D: 11, A: 12, V: 12, K: 16, C: 5, L: 20, E: 6 }

function symbol(kind: Kind, cx: number, y: number, value: string): string {
  switch (kind) {
    case 'R':
      return `<rect x="${cx - 18}" y="${y - 7}" width="36" height="14" fill="#fff" stroke="#111" stroke-width="1.6"/>`
    case 'Rb':
      return (
        `<rect x="${cx - 18}" y="${y - 7}" width="36" height="14" fill="#fff" stroke="#111" stroke-width="1.6"/>` +
        line(cx - 14, y + 12, cx + 12, y - 12) +
        `<path d="M${cx + 14} ${y - 14} l-8 1.5 l5 5 z" fill="#111"/>`
      )
    case 'D':
      return `<circle cx="${cx}" cy="${y}" r="11" fill="#fff" ${SW.replace('fill="none"', '')}/>` + line(cx - 7.8, y - 7.8, cx + 7.8, y + 7.8) + line(cx - 7.8, y + 7.8, cx + 7.8, y - 7.8)
    case 'A':
    case 'V':
      return `<circle cx="${cx}" cy="${y}" r="12" fill="#fff" stroke="#111" stroke-width="1.6"/><text x="${cx}" y="${y + 5}" ${FAM} font-size="15" font-weight="bold" text-anchor="middle">${kind}</text>`
    case 'K': {
      const closed = /đóng|dong|closed/i.test(value)
      return `<circle cx="${cx - 14}" cy="${y}" r="2.5" fill="#111"/><circle cx="${cx + 14}" cy="${y}" r="2.5" fill="#fff" stroke="#111" stroke-width="1.4"/>` + line(cx - 14, y, cx + 13, closed ? y : y - 13)
    }
    case 'C':
      return `<line x1="${cx - 4}" y1="${y - 12}" x2="${cx - 4}" y2="${y + 12}" stroke="#111" stroke-width="2.4"/><line x1="${cx + 4}" y1="${y - 12}" x2="${cx + 4}" y2="${y + 12}" stroke="#111" stroke-width="2.4"/>`
    case 'L': {
      let d = `M${cx - 20} ${y}`
      for (let k = 0; k < 4; k++) d += ` a5 6 0 0 1 10 0`
      return `<path d="${d}" ${SW}/>`
    }
    case 'E':
      // cực dương: vạch dài mảnh bên trái; cực âm: vạch ngắn đậm bên phải
      return (
        `<line x1="${cx - 4}" y1="${y - 13}" x2="${cx - 4}" y2="${y + 13}" stroke="#111" stroke-width="1.6"/>` +
        `<line x1="${cx + 4}" y1="${y - 7}" x2="${cx + 4}" y2="${y + 7}" stroke="#111" stroke-width="4"/>` +
        `<text x="${cx - 12}" y="${y - 8}" ${FAM} font-size="13" text-anchor="middle">+</text>` +
        `<text x="${cx + 12}" y="${y - 8}" ${FAM} font-size="13" text-anchor="middle">−</text>`
      )
  }
}

/** khối đã xếp: rộng w, cao h, dây đi qua ở độ cao a (tính từ đỉnh khối) */
interface Box {
  w: number
  h: number
  a: number
  draw: (x: number, y: number) => string
}

const ptLabel = (name: string, x: number, y: number) =>
  `<text x="${x}" y="${y}" ${FAM} font-size="15" font-style="italic" text-anchor="middle">${esc(name)}</text>`

function layout(n: Node, values: boolean, bare = false): Box {
  if (n.t === 'pt') {
    return { w: 16, h: 50, a: 30, draw: (x, y) => line(x, y + 30, x + 16, y + 30) + dot(x + 8, y + 30) + ptLabel(n.name, x + 8, y + 18) }
  }
  if (n.t === 'bridge') return bridge(n.items, values)
  if (n.t === 'el') {
    // khoá: "đóng" chỉ để vẽ, không ghi ra
    const val = values && !bare && n.kind !== 'K' ? n.value : ''
    const w = Math.max(64, tw(n.name, 16) + 24, tw(val, 13) + 16)
    const h = val ? 66 : 50
    const a = 30
    return {
      w,
      h,
      a,
      draw: (x, y) => {
        const cx = x + w / 2
        const wy = y + a
        const half = HALF[n.kind]
        const top = n.kind === 'Rb' || n.kind === 'L' || n.kind === 'E' ? 16 : n.kind === 'C' ? 14 : 13
        return (
          line(x, wy, cx - half, wy) +
          line(cx + half, wy, x + w, wy) +
          symbol(n.kind, cx, wy, n.value) +
          // ampe kế / vôn kế tên trùng chữ trong vòng tròn thì khỏi ghi lại
          (bare || n.name === n.kind ? '' : nameSvg(n.name, cx, wy - top - 5)) +
          (val ? `<text x="${cx}" y="${wy + 30}" ${FAM} font-size="13" text-anchor="middle">${esc(val)}</text>` : '')
        )
      },
    }
  }
  const kids = n.items.map((k) => layout(k, values))
  if (n.t === 'ser') {
    const a = Math.max(...kids.map((k) => k.a))
    const below = Math.max(...kids.map((k) => k.h - k.a))
    return {
      w: kids.reduce((s, k) => s + k.w, 0),
      h: a + below,
      a,
      draw: (x, y) => {
        let out = ''
        let cx = x
        for (const k of kids) {
          out += k.draw(cx, y + a - k.a)
          cx += k.w
        }
        return out
      },
    }
  }
  // song song: các nhánh xếp chồng, hai thanh dọc hai bên
  const pad = 20
  const gap = 6
  const W = Math.max(...kids.map((k) => k.w))
  const offs: number[] = []
  let h = 0
  for (const k of kids) {
    offs.push(h)
    h += k.h + gap
  }
  h -= gap
  const wires = kids.map((k, i) => offs[i] + k.a)
  const a = (wires[0] + wires[wires.length - 1]) / 2
  return {
    w: W + pad * 2,
    h,
    a,
    draw: (x, y) => {
      const l = x + pad
      const r = x + pad + W
      let out = line(x, y + a, l, y + a) + line(r, y + a, r + pad, y + a)
      out += line(l, y + wires[0], l, y + wires[wires.length - 1]) + line(r, y + wires[0], r, y + wires[wires.length - 1])
      kids.forEach((k, i) => {
        const kx = l + (W - k.w) / 2
        const wy = y + wires[i]
        if (kx > l) out += line(l, wy, kx, wy) + line(kx + k.w, wy, r, wy)
        out += k.draw(kx, y + offs[i])
      })
      return out + dot(l, y + a) + dot(r, y + a)
    },
  }
}

/**
 * Mạch cầu dạng hình chữ nhật (kiểu SGK): hai nhánh trên/dưới giữa hai thanh dọc,
 * phần thứ năm dựng đứng nối điểm giữa M (trên) và N (dưới).
 */
function bridge(items: Node[], values: boolean): Box {
  const [k1, k2, k3, k4] = items.slice(0, 4).map((k) => layout(k, values))
  const mid = items[4]
  // phần giữa: linh kiện đơn thì xoay đứng, ghi tên + giá trị bên phải
  const midEl = mid.t === 'el' ? mid : null
  const mb = layout(mid, values, !!midEl)
  const pad = 20
  // khe giữa hai cột đủ chỗ ghi tên + giá trị phần giữa bên phải nó
  const midText = midEl ? Math.max(tw(midEl.name, 16), values ? tw(midEl.value, 13) : 0) : 0
  const g = Math.max(40, 2 * (midText + 30))
  const colL = Math.max(k1.w, k3.w)
  const colR = Math.max(k2.w, k4.w)
  const topA = Math.max(k1.a, k2.a)
  const topH = topA + Math.max(k1.h - k1.a, k2.h - k2.a)
  const span = mb.w + 12
  const gapV = Math.max(16, span + 10 - (topH - topA) - Math.max(k3.a, k4.a))
  const botY = topH + gapV
  const botA = Math.max(k3.a, k4.a)
  const h = botY + botA + Math.max(k3.h - k3.a, k4.h - k4.a)
  const wT = topA
  const wB = botY + botA
  const a = (wT + wB) / 2
  const W = colL + g + colR
  return {
    w: W + pad * 2,
    h,
    a,
    draw: (x, y) => {
      const l = x + pad
      const r = l + W
      const xm = l + colL + g / 2
      let out = line(x, y + a, l, y + a) + line(r, y + a, r + pad, y + a)
      out += line(l, y + wT, l, y + wB) + line(r, y + wT, r, y + wB)
      const row = (left: Box, right: Box, wy: number) => {
        const lx = l + (colL - left.w) / 2
        const rx = l + colL + g + (colR - right.w) / 2
        return (
          line(l, wy, lx, wy) + left.draw(lx, wy - left.a) + line(lx + left.w, wy, rx, wy) + right.draw(rx, wy - right.a) + line(rx + right.w, wy, r, wy)
        )
      }
      out += row(k1, k2, y + wT) + row(k3, k4, y + wB)
      // nhánh giữa dựng đứng từ M xuống N
      const cy = y + (wT + wB) / 2
      const top = cy - mb.w / 2
      out += line(xm, y + wT, xm, top) + line(xm, top + mb.w, xm, y + wB)
      out += `<g transform="rotate(90 ${xm} ${cy})">${mb.draw(xm - mb.w / 2, cy - mb.a)}</g>`
      if (midEl) {
        const val = values && midEl.kind !== 'K' ? midEl.value : ''
        if (midEl.name !== midEl.kind) out += nameSvg(midEl.name, xm + 30, cy + (val ? -2 : 5)).replace('text-anchor="middle"', 'text-anchor="start"')
        if (val) out += `<text x="${xm + 22}" y="${cy + 16}" ${FAM} font-size="13">${esc(val)}</text>`
      }
      out += dot(xm, y + wT) + dot(xm, y + wB) + dot(l, y + a) + dot(r, y + a)
      out += ptLabel('M', xm, y + wT - 10) + ptLabel('N', xm, y + wB + 20)
      return out
    },
  }
}

const hasSource = (n: Node): boolean => (n.t === 'el' ? n.kind === 'E' : n.t === 'pt' ? false : n.items.some(hasSource))

export function renderCircuitSvg(spec: CircuitSpec, desc: string): { svg: string; width: number; height: number } {
  let source: { name: string; label: string } | null = null
  const parts: string[] = []
  for (const raw of spec.text.split('\n')) {
    const t = raw.trim()
    if (!t) continue
    const m = /^ngu(?:ồ|ô|o)n\s*:?\s*(.*)$/i.exec(t)
    if (m) {
      const rest = m[1].trim()
      source = { name: /^([^\s=(,;]+)/.exec(rest)?.[1] ?? 'E', label: rest }
    } else parts.push(t.replace(/^mạch\s*:\s*/i, ''))
  }
  if (!parts.length) throw new Error('Chưa có mạch — gõ vd. R1 - (R2 // R3)')
  const root = parseExpr(parts.join(' - '))
  const top = layout(root, spec.values)

  const m = 24
  const side = 28
  const inline = hasSource(root)
  const terminals = !inline && (!source || /^U/.test(source.name))
  const label = source?.label ?? ''
  const bottomGap = 52
  const W = Math.max(top.w + side * 2, tw(label, 14) + 40) + m * 2
  const x0 = (W - top.w) / 2
  const x1 = x0 + top.w
  const yTop = m
  const wy = yTop + top.a
  const yb = yTop + top.h + bottomGap
  const cx = W / 2
  let b = top.draw(x0, yTop)
  b += line(x0 - side, wy, x0, wy) + line(x1, wy, x1 + side, wy)
  b += line(x0 - side, wy, x0 - side, yb) + line(x1 + side, wy, x1 + side, yb)
  if (inline) b += line(x0 - side, yb, x1 + side, yb)
  else if (terminals) {
    // hai đầu để hở: + bên trái, − bên phải
    b += line(x0 - side, yb, cx - 22, yb) + line(cx + 22, yb, x1 + side, yb)
    b += `<circle cx="${cx - 22}" cy="${yb}" r="3.5" fill="#fff" stroke="#111" stroke-width="1.5"/><circle cx="${cx + 22}" cy="${yb}" r="3.5" fill="#fff" stroke="#111" stroke-width="1.5"/>`
    b += `<text x="${cx - 22}" y="${yb - 9}" ${FAM} font-size="14" text-anchor="middle">+</text><text x="${cx + 22}" y="${yb - 9}" ${FAM} font-size="14" text-anchor="middle">−</text>`
  } else {
    b += line(x0 - side, yb, cx - 6, yb) + line(cx + 6, yb, x1 + side, yb) + symbol('E', cx, yb, '')
  }
  if (label) b += `<text x="${cx}" y="${yb + 28}" ${FAM} font-size="14" font-style="italic" text-anchor="middle">${esc(label)}</text>`
  const H = yb + (label ? 40 : 20)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${b}</svg>`
  return { svg, width: W, height: H }
}

export const CIRCUIT_HELP: Array<{ group: string; items: Array<{ code: string; what: string }> }> = [
  {
    group: 'Ghép mạch',
    items: [
      { code: 'R1 - R2', what: 'Nối tiếp: dấu gạch ngang' },
      { code: 'R1 // R2', what: 'Song song: hai gạch chéo' },
      { code: 'R1 - (R2 // R3)', what: 'Ngoặc để gom một cụm' },
      { code: '(R1 - R2) // (R3 - R4)', what: 'Hai nhánh, mỗi nhánh có hai điện trở' },
      { code: '(R2 // V)', what: 'Vôn kế mắc song song với R2' },
      { code: 'cầu(R1, R2, R3, R4, R5)', what: 'Mạch cầu: R1–R2 trên, R3–R4 dưới, R5 nối M–N' },
      { code: '@A - R1 - @B', what: 'Ghi tên điểm nút A, B trên dây' },
    ],
  },
  {
    group: 'Giá trị',
    items: [
      { code: 'R1=4Ω  hoặc  R1(4Ω)', what: 'Ghi dưới linh kiện; bỏ trống thì không ghi' },
      { code: 'Đ(6V-3W)', what: 'Đèn ghi số định mức' },
      { code: 'K(đóng)', what: 'Khoá đóng; mặc định khoá mở' },
    ],
  },
  {
    group: 'Nguồn (dòng riêng)',
    items: [
      { code: 'nguồn E = 12 V, r = 1 Ω', what: 'Pin/acquy ở cạnh dưới, ghi chữ bên dưới' },
      { code: 'nguồn U = 12 V', what: 'Hai đầu để hở (+ −), hiệu điện thế U' },
      { code: 'E1 - R1 - E2', what: 'Hoặc đặt nguồn ngay trong mạch' },
    ],
  },
  {
    group: 'Linh kiện (theo chữ đầu tên)',
    items: [
      { code: 'R  Rb', what: 'Điện trở, biến trở' },
      { code: 'Đ  A  V', what: 'Bóng đèn, ampe kế, vôn kế' },
      { code: 'K  C  L  E', what: 'Khoá, tụ điện, cuộn cảm, nguồn' },
    ],
  },
]
