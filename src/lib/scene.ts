/**
 * Hình thực tế nét đơn (gấp giấy, thang dựa tường, đo chiều cao, mảnh vườn…): khung hình học
 * + mũi tên kích thước + kí hiệu góc + nét đứt + mặt đất / tường gạch chéo + hình tự do / đường cong / tô khối.
 *
 * Mỗi dòng một lệnh (toạ độ trục y hướng lên):
 *   A(0; 0) B(4; 0) C(4; 3)        khai báo điểm (tên bắt đầu bằng "_" thì không ghi nhãn)
 *   AB, BC, CA                     đoạn thẳng;  ABCD = đa giác khép kín
 *   đứt MN                         đoạn nét đứt
 *   kích thước AB "15 cm"          mũi tên hai đầu song song AB, ghi chữ (đặt phía ngoài hình)
 *   góc ABC "60°" [r]              cung góc tại B;  vuông ABC = kí hiệu góc vuông tại B
 *   nhãn AB "?"                    chữ ở giữa đoạn AB (không vẽ đoạn)
 *   đất AB / tường AB              gạch chéo dưới đoạn (mặt đất) hoặc bên cạnh (bức tường)
 *   hình cây AB                    hình vật (kho tranh nét) đứng từ chân A lên đỉnh B, xoay theo AB
 *   hình ô tô A                    hình vật đặt đứng tại A (cao 1/4 hình); vật ngoài kho: hình en:teapot A
 */
import { getSprite } from './figureSprites'
import { resolveSpriteId, spriteDef } from './objects'
import { OBJECTS } from './objectsCatalog'
import { subscript } from './chem'
import { richTextToSvg } from './table'

const FAM = `font-family="'Times New Roman',serif"`
/** vật rộng: đặt mặt (mép gần) lên đoạn thay vì đặt giữa */
const EDGE_ANCHOR = new Set(['building', 'house', 'tent', 'water_tank'])
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10

export interface SceneSpec {
  /** các lệnh, mỗi dòng một lệnh */
  text: string
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

type P = [number, number]
type ShapeKind = 'tròn' | 'elip' | 'hộp' | 'thoi'
type Weight = 'thin' | 'normal' | 'thick'

interface StyleOpts {
  fill?: string
  fillOpacity?: number
  stroke?: string
  weight?: Weight
  dashed?: boolean
  bg?: boolean
  italic?: boolean
  rotate?: number
}

type RegionPart =
  | { k: 'seg'; names: string[] }
  | { k: 'curve'; names: string[] }
  | { k: 'arc'; o: string; rx: number; ry: number; from: number; to: number; rotate: number }

type Cmd =
  | { t: 'seg'; a: string; b: string; dashed: boolean; arrow?: boolean; arrowStart?: boolean; stroke?: string; weight?: Weight }
  | { t: 'poly'; names: string[]; fill?: string; fillOpacity?: number; stroke?: string; weight?: Weight; dashed?: boolean; bg?: boolean }
  | { t: 'dim'; a: string; b: string; text: string }
  | { t: 'angle'; a: string; o: string; b: string; text: string; radius?: number; italic?: boolean }
  | { t: 'right'; a: string; o: string; b: string }
  | { t: 'label'; a: string; b: string; text: string; italic?: boolean; rotate?: number; along?: boolean }
  | { t: 'ground'; a: string; b: string; wall: boolean }
  | { t: 'sprite'; id: string; name: string; a: string; b?: string }
  | { t: 'shape'; kind: ShapeKind; o: string; rx: number; ry: number; text: string; dashed: boolean; fill: string; fillOpacity?: number; rounded: boolean; stroke?: string; weight?: Weight; bg?: boolean; rotate?: number; italic?: boolean }
  | { t: 'arc'; kind: 'cung' | 'quạt' | 'cung elip'; o: string; rx: number; ry: number; start: number; sweep: number; text: string; dashed: boolean; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; bg?: boolean; rotate?: number; italic?: boolean }
  | { t: 'curve'; names: string[]; closed: boolean; dashed: boolean; arrow: boolean; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; bg?: boolean }
  | { t: 'region'; parts: RegionPart[]; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; dashed: boolean; bg?: boolean }
  | { t: 'dot'; o: string; fill: string; stroke?: string; r: number }
  | { t: 'text'; o: string; text: string; large: boolean; bold: boolean; italic?: boolean; rotate?: number }
  | { t: 'frame'; w: number; h: number }

const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`
const toNum = (s: string) => Number(s.replace(',', '.'))
const FREE = /^(khung|cung\s+elip|cong|vùng|chấm|mũi\s+tên\s+hai\s+đầu|hai\s+đầu|mũi\s+tên|tròn|elip|hộp|thoi|cung|quạt|chữ)(?=\s|$)/u
const QUOTED = /"([^"]*)"|“([^”]*)”/g
const SIZE = new RegExp(`^${NUM}$`)
const COLORS = new Map(Object.entries({
  đen: '#111111', đỏ: '#d62828', xanh: '#2563eb', lam: '#0284c7', lục: '#15803d', vàng: '#eab308',
  cam: '#ea580c', tím: '#7e22ce', hồng: '#db2777', xám: '#6b7280', nâu: '#92400e', rêu: '#7c8a56', trắng: '#ffffff',
}))

function parseHexColor(value: string | undefined, line: number, missingMsg: string, invalidMsg: string): string {
  const name = value?.toLowerCase()
  if (!name) throw new Error(`Dòng ${line}: ${missingMsg}`)
  const hex = COLORS.get(name) ?? name
  if (!/^#[\da-f]{6}$/.test(hex)) throw new Error(`Dòng ${line}: ${invalidMsg} "${name}"`)
  return hex
}

function parseFill(value: string | undefined, line: number, mode: 'pastel' | 'solid' | 'shade' | 'sphere' | 'hatch' = 'pastel'): string {
  const hex = parseHexColor(value, line, 'thiếu màu tô', 'màu tô không hợp lệ')
  if (mode === 'solid') return hex
  if (mode === 'shade') return `url(#scgr-${hex.slice(1)})`
  if (mode === 'sphere') return `url(#scrg-${hex.slice(1)})`
  if (mode === 'hatch') return `url(#schat-${hex.slice(1)})`
  // Pha với trắng để màu vẫn che kín đoạn nối và chữ đen dễ đọc.
  const channels = hex.slice(1).match(/../g)!
  return '#' + channels.map((s) => Math.round(255 * 0.8 + parseInt(s, 16) * 0.2).toString(16)).join('')
}

function mixHex(hex: string, target: [number, number, number], t: number): string {
  const ch = hex.slice(1).match(/../g)!.map((s) => parseInt(s, 16))
  return '#' + ch.map((v, i) => Math.round(v * (1 - t) + target[i] * t).toString(16).padStart(2, '0')).join('')
}

function shadeGradientDef(hex: string): string {
  const id = `scgr-${hex.slice(1)}`
  const c0 = mixHex(hex, [255, 255, 255], 0.22)
  const c1 = mixHex(hex, [255, 255, 255], 0.38)
  const c2 = hex
  const c3 = mixHex(hex, [0, 0, 0], 0.28)
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c0}"/><stop offset="28%" stop-color="${c1}"/><stop offset="72%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></linearGradient>`
}

function sphereGradientDef(hex: string): string {
  const id = `scrg-${hex.slice(1)}`
  const c0 = mixHex(hex, [255, 255, 255], 0.45)
  const c1 = hex
  const c2 = mixHex(hex, [0, 0, 0], 0.32)
  const c3 = mixHex(hex, [0, 0, 0], 0.48)
  return `<radialGradient id="${id}" cx="35%" cy="30%" r="68%" fx="32%" fy="28%"><stop offset="0%" stop-color="${c0}"/><stop offset="45%" stop-color="${c1}"/><stop offset="85%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></radialGradient>`
}

function hatchPatternDef(hex: string): string {
  const id = `schat-${hex.slice(1)}`
  return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${hex}" stroke-width="1.2"/></pattern>`
}

function tokenizeArgs(rest: string, line: number): string[] {
  const parts = [...rest.matchAll(/(?:^|\s+)("[^"]*"|“[^”]*”|[^\s"“”]+)(?=\s|$)/gu)]
  if (parts.map((m) => m[0]).join('') !== rest) {
    throw new Error(`Dòng ${line}: nhãn cần đặt trong dấu ngoặc kép, cách tuỳ chọn bằng khoảng trắng`)
  }
  return parts.map((m) => m[1])
}

interface StyleCaps {
  fill?: boolean
  stroke?: boolean
  dashed?: boolean
  weight?: boolean
  bg?: boolean
  rotate?: boolean
  italic?: boolean
}

/** Đọc 1 tuỳ chọn kiểu dáng tại args[i], trả về số token đã tiêu thụ (0 nếu không khớp). */
function readStyleToken(args: string[], i: number, line: number, opts: StyleOpts, caps: StyleCaps): number {
  const opt = args[i]
  if (caps.dashed && opt === 'đứt') { opts.dashed = true; return 1 }
  if (caps.weight && opt === 'mảnh') { opts.weight = 'thin'; return 1 }
  if (caps.weight && opt === 'dày') { opts.weight = 'thick'; return 1 }
  if (caps.bg && opt === 'nền') { opts.bg = true; return 1 }
  if (caps.italic && opt === 'nghiêng') { opts.italic = true; return 1 }
  if (caps.stroke && (opt === 'không' || opt === 'ẩn') && args[i + 1] === 'viền') {
    opts.stroke = 'none'; return 2
  }
  if (caps.stroke && opt === 'màu') {
    opts.stroke = parseHexColor(args[i + 1], line, 'thiếu màu nét', 'màu nét không hợp lệ')
    return 2
  }
  if (caps.fill && opt === 'tô') {
    const next = args[i + 1]
    if (next === 'đậm' || next === 'đặc') {
      opts.fill = parseFill(args[i + 2], line, 'solid')
      return 3
    }
    if (next === 'bóng') {
      opts.fill = parseFill(args[i + 2], line, 'shade')
      return 3
    }
    if (next === 'cầu') {
      opts.fill = parseFill(args[i + 2], line, 'sphere')
      return 3
    }
    if (next === 'gạch' || next === 'sọc') {
      const cand = args[i + 2]
      const isColor = Boolean(cand && (COLORS.has(cand.toLowerCase()) || /^#[\da-f]{6}$/i.test(cand)))
      opts.fill = parseFill(isColor ? cand : '#111111', line, 'hatch')
      return isColor ? 3 : 2
    }
    opts.fill = parseFill(next, line, 'pastel')
    return 2
  }
  if (caps.fill && opt === 'mờ') {
    const cand = args[i + 1]
    if (cand && SIZE.test(cand)) {
      const alpha = toNum(cand)
      if (!Number.isFinite(alpha) || alpha <= 0 || alpha > 1) {
        throw new Error(`Dòng ${line}: độ mờ phải nằm trong (0; 1]`)
      }
      opts.fillOpacity = alpha
      return 2
    }
    opts.fillOpacity = 0.45
    return 1
  }
  if (caps.rotate && opt === 'xoay') {
    const v = args[i + 1]
    if (!v || !SIZE.test(v) || !Number.isFinite(toNum(v))) throw new Error(`Dòng ${line}: góc xoay phải là số`)
    opts.rotate = toNum(v)
    return 2
  }
  return 0
}

function parseStyleList(args: string[], line: number, kindLabel: string, caps: StyleCaps): StyleOpts {
  const opts: StyleOpts = {}
  for (let i = 0; i < args.length;) {
    const used = readStyleToken(args, i, line, opts, caps)
    if (!used) throw new Error(`Dòng ${line}: tuỳ chọn ${kindLabel} không hợp lệ "${args[i]}"`)
    i += used
  }
  return opts
}

function strokeWidthAttr(weight: Weight | undefined, base: number): number {
  if (weight === 'thin') return 0.9
  if (weight === 'thick') return 2.2
  return base
}

function wrapDegrees(angle: number): number {
  const rem = angle % 360
  return rem < 0 ? rem + 360 : rem
}

function direction(angle: number): P {
  const deg = wrapDegrees(angle)
  if (deg === 0) return [1, 0]
  if (deg === 90) return [0, 1]
  if (deg === 180) return [-1, 0]
  if (deg === 270) return [0, -1]
  const rad = deg * Math.PI / 180
  return [Math.cos(rad), Math.sin(rad)]
}

function rotateVec([x, y]: P, deg: number): P {
  if (!deg) return [x, y]
  const rad = deg * Math.PI / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [x * c - y * s, x * s + y * c]
}

function ellipseArcPoint([ox, oy]: P, rx: number, ry: number, angle: number, rot = 0): P {
  const [ux, uy] = direction(angle)
  const [lx, ly] = rotateVec([rx * ux, ry * uy], rot)
  return [ox + lx, oy + ly]
}

/** tách "ABC" / "A'B" / "A1B" thành tên điểm có trong bảng */
function splitNames(s: string, pts: Map<string, P>, line: number): string[] {
  // điểm khai báo ẩn nhãn (_A) mà lệnh viết thiếu dấu _ (AB) vẫn hiểu là _A, trừ khi có sẵn điểm A
  const alias = new Map<string, string>()
  for (const n of pts.keys()) if (n.startsWith('_') && n.length > 1 && !pts.has(n.slice(1))) alias.set(n.slice(1), n)
  const real = (n: string) => (pts.has(n) ? n : alias.get(n))
  // viết tách "_G-_K" hoặc "A1-B2": mỗi phần là một tên
  if (s.includes('-'))
    return s.split('-').map((n) => {
      const r = real(n)
      if (!r) throw new Error(`Dòng ${line}: chưa khai báo điểm "${n}"`)
      return r
    })
  const out: string[] = []
  let i = 0
  while (i < s.length) {
    // tên dài nhất khớp trước (A1, A', _M…)
    let hit = ''
    for (const n of [...pts.keys(), ...alias.keys()]) if (s.startsWith(n, i) && n.length > hit.length) hit = n
    if (!hit) throw new Error(`Dòng ${line}: chưa khai báo điểm "${s.slice(i)}"`)
    out.push(real(hit) as string)
    i += hit.length
  }
  return out
}

function parseSweep(from: number, to: number): { start: number; sweep: number } {
  const start = wrapDegrees(from)
  const delta = to - from
  let sweep: number
  if (delta >= 360) sweep = 360
  else if (delta >= 0) sweep = delta
  else sweep = wrapDegrees(Number.isFinite(delta) ? delta : wrapDegrees(to) - start) || 360
  return { start, sweep }
}

const STYLE_START = /^(tô|màu|không|ẩn|đứt|dày|mảnh|nền|mờ)$/u

function parseRegionPart(raw: string, pts: Map<string, P>, line: number): RegionPart {
  const tokens = raw.trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) throw new Error(`Dòng ${line}: thiếu mảnh trong vùng`)
  const fail = (m: string): never => { throw new Error(`Dòng ${line}: ${m}`) }
  const num = (v: string | undefined, name: string, positive = false) => {
    if (!v || !SIZE.test(v)) return fail(`${name} phải là số${positive ? ' lớn hơn 0' : ''}`)
    const n = toNum(v)
    if (!Number.isFinite(n) || (positive && n <= 0)) fail(`${name} phải là số${positive ? ' lớn hơn 0' : ''}`)
    return n
  }
  if (tokens[0] === 'cung') {
    let i = 1
    const isEll = tokens[i] === 'elip'
    if (isEll) i++
    const o = tokens[i++]
    if (!o || SIZE.test(o)) return fail('thiếu điểm tâm của cung trong vùng')
    if (!pts.has(o)) return fail(`chưa khai báo điểm "${o}"`)
    const rx = num(tokens[i++], isEll ? 'bán kính trục x' : 'bán kính', true)
    const ry = isEll ? num(tokens[i++], 'bán kính trục y', true) : rx
    const from = num(tokens[i++], 'góc đầu')
    const to = num(tokens[i++], 'góc cuối')
    let rotate = 0
    if (tokens[i] === 'xoay') {
      i++
      rotate = num(tokens[i++], 'góc xoay')
    }
    if (i < tokens.length) return fail(`tuỳ chọn cung trong vùng không hợp lệ "${tokens[i]}"`)
    return { k: 'arc', o, rx, ry, from, to, rotate }
  }
  if (tokens[0] === 'cong') {
    if (tokens.length !== 2) fail('cong trong vùng cần danh sách điểm')
    const names = splitNames(tokens[1], pts, line)
    if (names.length < 3) fail('cong cần ít nhất 3 điểm')
    return { k: 'curve', names }
  }
  if (tokens[0] === 'đoạn') tokens.shift()
  if (tokens.length !== 1) fail(`không hiểu mảnh "${raw.trim()}" trong vùng`)
  const names = splitNames(tokens[0], pts, line)
  if (names.length < 2) fail('đoạn trong vùng cần ít nhất 2 điểm')
  return { k: 'seg', names }
}

function parseFreeCmd(rawKind: string, rest: string, pts: Map<string, P>, line: number): Cmd {
  const kind = rawKind.replace(/\s+/g, ' ')
  const fail = (message: string): never => { throw new Error(`Dòng ${line}: ${message}`) }
  const args = tokenizeArgs(rest, line)

  const readNum = (name: string, positive = false) => {
    const value = args.shift()
    if (!value || !SIZE.test(value)) return fail(`${name} phải là số${positive ? ' lớn hơn 0' : ''}`)
    const n = toNum(value)
    if (!Number.isFinite(n) || (positive && n <= 0)) fail(`${name} phải là số${positive ? ' lớn hơn 0' : ''}`)
    return n
  }

  if (kind === 'khung') {
    const w = readNum('chiều rộng khung', true)
    const h = readNum('chiều cao khung', true)
    if (args.length) fail(`tuỳ chọn khung không hợp lệ "${args[0]}"`)
    return { t: 'frame', w: Math.max(120, Math.min(1000, w)), h: Math.max(100, Math.min(800, h)) }
  }

  if (kind === 'mũi tên' || kind === 'mũi tên hai đầu' || kind === 'hai đầu') {
    const twoWay = kind !== 'mũi tên'
    const dashed = args[0] === 'đứt'
    if (dashed) args.shift()
    const arg = args.shift()
    if (!arg) return fail('mũi tên cần đúng 2 điểm, vd. AB')
    const [a, b, extra] = splitNames(arg, pts, line)
    if (!a || !b || extra) return fail('mũi tên cần đúng 2 điểm, vd. AB')
    const opts = parseStyleList(args, line, kind, { stroke: true, weight: true, dashed: true })
    return { t: 'seg', a, b, dashed: dashed || Boolean(opts.dashed), arrow: true, arrowStart: twoWay, stroke: opts.stroke, weight: opts.weight }
  }

  if (kind === 'cong') {
    const arg = args.shift()
    if (!arg) return fail('cong cần danh sách điểm, vd. A-B-C')
    const names = splitNames(arg, pts, line)
    if (names.length < 3) return fail('cong cần ít nhất 3 điểm')
    let closed = false
    let arrow = false
    const opts: StyleOpts = {}
    for (let i = 0; i < args.length;) {
      if (args[i] === 'kín') { closed = true; i++; continue }
      if (args[i] === 'mũi' && args[i + 1] === 'tên') { arrow = true; i += 2; continue }
      const used = readStyleToken(args, i, line, opts, { fill: true, stroke: true, weight: true, dashed: true, bg: true })
      if (!used) fail(`tuỳ chọn cong không hợp lệ "${args[i]}"`)
      i += used
    }
    return {
      t: 'curve',
      names,
      closed,
      dashed: Boolean(opts.dashed),
      arrow,
      fill: opts.fill ?? 'none',
      fillOpacity: opts.fillOpacity,
      stroke: opts.stroke,
      weight: opts.weight,
      bg: opts.bg,
    }
  }

  if (kind === 'vùng') {
    const segsRaw = rest.split(';')
    if (!segsRaw.length || !segsRaw[0].trim()) fail('vùng cần ít nhất 1 mảnh biên')
    const lastTokens = tokenizeArgs(segsRaw[segsRaw.length - 1].trim(), line)
    const styleIdx = lastTokens.findIndex((t) => STYLE_START.test(t))
    let opts: StyleOpts = {}
    if (styleIdx >= 0) {
      opts = parseStyleList(lastTokens.slice(styleIdx), line, 'vùng', {
        fill: true, stroke: true, weight: true, dashed: true, bg: true,
      })
      segsRaw[segsRaw.length - 1] = lastTokens.slice(0, styleIdx).join(' ')
    }
    const parts = segsRaw.map((s) => s.trim()).filter(Boolean).map((s) => parseRegionPart(s, pts, line))
    if (!parts.length) fail('vùng cần ít nhất 1 mảnh biên')
    return {
      t: 'region',
      parts,
      fill: opts.fill ?? 'none',
      fillOpacity: opts.fillOpacity,
      stroke: opts.stroke,
      weight: opts.weight,
      dashed: Boolean(opts.dashed),
      bg: opts.bg,
    }
  }

  const arc = kind === 'cung' || kind === 'quạt' || kind === 'cung elip'
  const o = args.shift()
  if (!o || (arc && SIZE.test(o))) return fail(arc ? `thiếu điểm tâm của ${kind}` : `thiếu điểm đặt ${kind}`)
  if (!pts.has(o)) fail(`chưa khai báo điểm "${o}"`)
  const label = (s: string) => s.startsWith('"') || s.startsWith('“')
  const unquote = (s: string) => s.slice(1, -1)

  if (kind === 'chấm') {
    let fill = '#111111'
    let stroke: string | undefined
    let r = 3.2
    let hasFill = false
    for (let i = 0; i < args.length;) {
      const opt = args[i]
      if (opt === 'to') { r = 4.6; i++; continue }
      if (opt === 'nhỏ') { r = 2.4; i++; continue }
      if (opt === 'màu') {
        stroke = parseHexColor(args[i + 1], line, 'thiếu màu viền chấm', 'màu viền không hợp lệ')
        i += 2
        continue
      }
      if (!hasFill) {
        fill = parseHexColor(opt, line, 'thiếu màu chấm', 'màu chấm không hợp lệ')
        hasFill = true
        i++
        continue
      }
      fail(`tuỳ chọn chấm không hợp lệ "${opt}"`)
    }
    if (fill === '#ffffff' && !stroke) stroke = '#111111'
    return { t: 'dot', o, fill, stroke, r }
  }

  if (kind === 'chữ') {
    const content = args[0]
    if (!content || !label(content)) fail('chữ cần văn bản trong dấu ngoặc kép')
    let large = false
    let bold = false
    let italic = false
    let rotate: number | undefined
    for (let i = 1; i < args.length;) {
      const opt = args[i]
      if (opt === 'to') { large = true; i++; continue }
      if (opt === 'đậm') { bold = true; i++; continue }
      if (opt === 'nghiêng') { italic = true; i++; continue }
      if (opt === 'xoay') {
        const v = args[i + 1]
        if (!v || !SIZE.test(v) || !Number.isFinite(toNum(v))) fail('góc xoay phải là số')
        rotate = toNum(v)
        i += 2; continue
      }
      fail(`tuỳ chọn chữ không hợp lệ "${opt}"`)
    }
    return {
      t: 'text', o, text: unquote(content),
      large, bold, italic, rotate,
    }
  }

  const box = kind === 'hộp' || kind === 'thoi'
  const rx = box ? readNum('chiều rộng', true) / 2 : readNum(kind === 'cung elip' ? 'bán kính trục x' : 'bán kính', true)
  const ry = (kind === 'elip' || kind === 'cung elip')
    ? readNum('bán kính trục y', true)
    : box ? readNum('chiều cao', true) / 2 : rx
  let start = 0
  let sweep = 0
  if (arc) {
    const from = readNum('góc đầu')
    const to = readNum('góc cuối')
    const sw = parseSweep(from, to)
    start = sw.start
    sweep = sw.sweep
  }
  let text: string | undefined
  let rounded = false
  const opts: StyleOpts = {}
  const caps: StyleCaps = {
    fill: true, stroke: true, dashed: true, weight: true, bg: true,
    italic: true, rotate: kind === 'elip' || kind === 'cung elip' || kind === 'hộp',
  }
  for (let i = 0; i < args.length;) {
    const opt = args[i]
    if (label(opt) && kind !== 'quạt' && text === undefined) { text = unquote(opt); i++; continue }
    if (opt === 'bo' && kind === 'hộp') { rounded = true; i++; continue }
    const used = readStyleToken(args, i, line, opts, caps)
    if (!used) fail(`tuỳ chọn ${kind} không hợp lệ "${opt}"`)
    i += used
  }
  let fill = opts.fill ?? (box ? '#fff' : 'none')
  // Nhãn tạo nút sơ đồ, hình tròn không nhãn dùng cho dựng hình.
  if (fill === 'none' && text && !arc) fill = '#fff'
  if (arc) {
    return {
      t: 'arc', kind, o, rx, ry, start, sweep, text: text ?? '',
      dashed: Boolean(opts.dashed), fill, fillOpacity: opts.fillOpacity, stroke: opts.stroke, weight: opts.weight,
      bg: opts.bg, rotate: opts.rotate, italic: opts.italic,
    }
  }
  return {
    t: 'shape', kind: kind as ShapeKind, o, rx, ry, text: text ?? '',
    dashed: Boolean(opts.dashed), fill, fillOpacity: opts.fillOpacity, rounded, stroke: opts.stroke, weight: opts.weight,
    bg: opts.bg, rotate: opts.rotate, italic: opts.italic,
  }
}

export function parseScene(text: string): { pts: Map<string, P>; cmds: Cmd[] } {
  const pts = new Map<string, P>()
  const cmds: Cmd[] = []
  const lines = text.normalize('NFC').split('\n')
  // lượt 1: điểm (để lệnh viết trước điểm vẫn đọc được)
  const pointRe = new RegExp(String.raw`([A-Z_][A-Za-z0-9_']*)\s*\(\s*${NUM}\s*;\s*${NUM}\s*\)`, 'g')
  const clean = (l: string) => l.trim().replace(/^[,;]+|[,;]+$/g, '').trim()
  const quotedOrPoint = new RegExp(`${QUOTED.source}|${pointRe.source}`, 'g')
  const commands = lines.map((l) => clean(l.replace(quotedOrPoint, (m) => /^["“]/.test(m) ? m : '')))
  const free = commands.map((l) => FREE.exec(l)?.[0])
  lines.forEach((l, idx) => {
    const source = free[idx] ? l.replace(QUOTED, ' ') : l
    for (const m of source.matchAll(pointRe)) pts.set(m[1], [toNum(m[2]), toNum(m[3])])
  })
  const hasRealFree = free.some((f) => Boolean(f) && f !== 'khung')
  if (pts.size < 2 && !hasRealFree) throw new Error('Cần ít nhất 2 điểm, vd. A(0; 0) B(4; 0)')

  lines.forEach((raw, idx) => {
    const line = idx + 1
    const kind = free[idx]
    if (kind) {
      cmds.push(parseFreeCmd(kind, commands[idx].slice(kind.length).trim(), pts, line))
      return
    }
    const l = clean(raw.replace(pointRe, ''))
    if (!l) return
    const quoted = l.match(/"([^"]*)"|“([^”]*)”/)
    const q = quoted ? (quoted[1] ?? quoted[2] ?? '') : ''
    const head = l.replace(/"[^"]*"|“[^”]*”/, '').trim()
    const m = head.match(/^(\S+(?:\s+(?:vuông|thước|đứt))?)\s+([A-Za-z0-9_'-]+)(?:\s+(.*))?$/u)
    const kw = (m?.[1] ?? '').toLowerCase().replace(/^nnhãn$/, 'nhãn')
    const extraTokens = m?.[3] ? m[3].trim().split(/\s+/).filter(Boolean) : []
    const two = (arg: string) => {
      const n = splitNames(arg, pts, line)
      if (n.length !== 2) throw new Error(`Dòng ${line}: cần đúng 2 điểm, vd. AB`)
      return n
    }
    const three = (arg: string) => {
      const n = splitNames(arg, pts, line)
      if (n.length !== 3) throw new Error(`Dòng ${line}: cần đúng 3 điểm, vd. ABC (đỉnh ở giữa)`)
      return n
    }
    const spr = /^hình\s+(.+?)\s+([A-Za-z0-9_'-]+)$/u.exec(head)
    if (spr) {
      // vật chưa có trong kho: bỏ dòng này, phần hình học vẫn vẽ (đừng để cả hình hỏng vì một hình minh hoạ)
      const id = resolveSpriteId(spr[1])
      const n = splitNames(spr[2], pts, line)
      if (n.length > 2) throw new Error(`Dòng ${line}: hình vật cần 1 điểm (đặt tại) hoặc 2 điểm (chân, đỉnh)`)
      if (id) cmds.push({ t: 'sprite', id, name: spr[1], a: n[0], b: n[1] })
    } else if (m && /^(kích thước|kt)$/.test(kw) && !extraTokens.length) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'dim', a, b, text: q })
    } else if (m && /^(góc vuông|vuông)$/.test(kw) && !extraTokens.length) {
      const [a, o, b] = three(m[2])
      cmds.push({ t: 'right', a, o, b })
    } else if (m && kw === 'góc') {
      const [a, o, b] = three(m[2])
      let radius: number | undefined
      let italic = false
      for (const tok of extraTokens) {
        if (tok === 'nghiêng') italic = true
        else if (SIZE.test(tok) && toNum(tok) > 0 && radius === undefined) radius = toNum(tok)
        else throw new Error(`Dòng ${line}: tuỳ chọn góc không hợp lệ "${tok}"`)
      }
      cmds.push({ t: 'angle', a, o, b, text: q, radius, italic: italic || undefined })
    } else if (m && kw === 'nhãn') {
      const [a, b] = two(m[2])
      let italic = false
      let along = false
      let rotate: number | undefined
      for (let i = 0; i < extraTokens.length;) {
        const tok = extraTokens[i]
        if (tok === 'nghiêng') { italic = true; i++; continue }
        if (tok === 'dọc') { along = true; i++; continue }
        if (tok === 'xoay') {
          const v = extraTokens[i + 1]
          if (!v || !SIZE.test(v) || !Number.isFinite(toNum(v))) throw new Error(`Dòng ${line}: góc xoay phải là số`)
          rotate = toNum(v)
          i += 2; continue
        }
        throw new Error(`Dòng ${line}: tuỳ chọn nhãn không hợp lệ "${tok}"`)
      }
      cmds.push({ t: 'label', a, b, text: q || '?', italic: italic || undefined, rotate, along: along || undefined })
    } else if (m && (kw === 'đoạn' || kw === 'đứt' || kw === 'nét đứt')) {
      const [a, b] = two(m[2])
      const opts = parseStyleList(extraTokens, line, kw, { stroke: true, weight: true, dashed: true })
      cmds.push({ t: 'seg', a, b, dashed: kw !== 'đoạn' || Boolean(opts.dashed), stroke: opts.stroke, weight: opts.weight })
    } else if (m && (kw === 'đất' || kw === 'tường') && !extraTokens.length) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'ground', a, b, wall: kw === 'tường' })
    } else {
      const filled = /^([A-Z_][A-Za-z0-9_'-]*)\s+(tô(?:\s+.*)?)$/u.exec(l)
      if (filled) {
        const names = splitNames(filled[1], pts, line)
        if (names.length < 3) throw new Error(`Dòng ${line}: đa giác cần ít nhất 3 điểm, vd. ABC`)
        const opts = parseStyleList(filled[2].trim().split(/\s+/), line, 'đa giác', {
          fill: true, stroke: true, weight: true, dashed: true, bg: true,
        })
        cmds.push({ t: 'poly', names, fill: opts.fill, fillOpacity: opts.fillOpacity, stroke: opts.stroke, weight: opts.weight, dashed: opts.dashed, bg: opts.bg })
        return
      }
      // danh sách đoạn / đa giác: "AB, BC" hoặc "ABCD", tuỳ chọn kiểu nét ở cuối dòng (vd "S-A, A-B màu lam dày")
      const tokens = head.split(/[,;]\s*|\s+/).filter(Boolean)
      const styleIdx = tokens.findIndex((t) => /^(màu|dày|mảnh|đứt)$/u.test(t))
      let segOpts: StyleOpts = {}
      let geomTokens = tokens
      if (styleIdx > 0) {
        segOpts = parseStyleList(tokens.slice(styleIdx), line, 'đoạn', { stroke: true, weight: true, dashed: true })
        geomTokens = tokens.slice(0, styleIdx)
      }
      for (const part of geomTokens) {
        const dashed = part.endsWith('*') || Boolean(segOpts.dashed)
        const n = splitNames(part.replace(/\*$/, ''), pts, line)
        if (n.length === 2) cmds.push({ t: 'seg', a: n[0], b: n[1], dashed, stroke: segOpts.stroke, weight: segOpts.weight })
        else if (n.length >= 3 && !segOpts.stroke && !segOpts.weight && !segOpts.dashed) cmds.push({ t: 'poly', names: n })
        else if (n.length >= 3) cmds.push({ t: 'poly', names: n, stroke: segOpts.stroke, weight: segOpts.weight, dashed: segOpts.dashed })
        else throw new Error(`Dòng ${line}: không hiểu "${part}"`)
      }
    }
  })
  return { pts, cmds }
}

type Shape = Extract<Cmd, { t: 'shape' }>
type ArcCmd = Extract<Cmd, { t: 'arc' }>
type CurveCmd = Extract<Cmd, { t: 'curve' }>
type RegionCmd = Extract<Cmd, { t: 'region' }>
const cornerRadius = (c: Shape) => c.rounded ? Math.min(c.rx, c.ry) * 0.35 : 0

/** Khoảng cách từ tâm tới mép hình theo hướng (dx, dy). */
function shapeEdge(c: Shape, dx: number, dy: number): number {
  const [ldx, ldy] = c.rotate ? rotateVec([dx, dy], -c.rotate) : [dx, dy]
  if (c.kind === 'thoi') return 1 / (Math.abs(ldx) / c.rx + Math.abs(ldy) / c.ry)
  if (c.kind !== 'hộp') return 1 / Math.hypot(ldx / c.rx, ldy / c.ry)
  const x = Math.abs(ldx)
  const y = Math.abs(ldy)
  let hi = Math.min(c.rx / x, c.ry / y)
  const r = cornerRadius(c)
  if (!r) return hi
  let lo = 0
  for (let i = 0; i < 20; i++) {
    const d = (lo + hi) / 2
    if (Math.hypot(Math.max(0, d * x - c.rx + r), Math.max(0, d * y - c.ry + r)) <= r) lo = d
    else hi = d
  }
  return hi
}

/** Ước lượng bề rộng chữ Times New Roman theo em, kể cả ngoài trình duyệt. */
function textWidthEm(s: string): number {
  let width = 0
  for (const ch of s.replace(/\$/g, '').normalize('NFD').replace(/\p{Mark}/gu, '')) {
    if (/[ilIftjr\s.,;:!'|]/.test(ch)) width += 0.4
    else if (/[A-LN-VX-Z]/.test(ch)) width += 0.85
    else if (/[a-ln-vx-z0-9đ]/.test(ch)) width += 0.6
    else width += 1
  }
  return width
}

/** In nghiêng chữ cái trong đoạn toán học $...$, giữ nguyên chỉ số trên/dưới. */
function sceneRichText(raw: string): string {
  if (!raw.includes('$')) return richTextToSvg(/^(?:[A-Z][a-z]?\d*)+$/.test(raw) ? subscript(raw) : raw)
  const out: string[] = []
  let pos = 0
  for (const m of raw.matchAll(/\$([^$]+)\$/g)) {
    const idx = m.index ?? 0
    if (idx > pos) out.push(richTextToSvg(raw.slice(pos, idx)))
    const math = m[1]
    // Tách chữ cái Latin/Hy Lạp để in nghiêng chuẩn toán học; số và dấu =, (, ) đứng thẳng.
    out.push(
      math
        .split(/([A-Za-z\u0370-\u03FF]+)/u)
        .map((part, i) => (i % 2 === 1 ? `<tspan font-style="italic">${richTextToSvg(part)}</tspan>` : richTextToSvg(part)))
        .join(''),
    )
    pos = idx + m[0].length
  }
  if (pos < raw.length) out.push(richTextToSvg(raw.slice(pos)))
  return out.join('')
}

function catmullRomBeziers(points: P[], closed: boolean): Array<[P, P, P]> {
  const n = points.length
  const get = (idx: number): P => {
    if (closed) return points[((idx % n) + n) % n]
    if (idx < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]]
    if (idx >= n) return [2 * points[n - 1][0] - points[n - 2][0], 2 * points[n - 1][1] - points[n - 2][1]]
    return points[idx]
  }
  const dist = (a: P, b: P) => Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 1e-4)
  const count = closed ? n : n - 1
  const out: Array<[P, P, P]> = []
  for (let i = 0; i < count; i++) {
    const p0 = get(i - 1)
    const p1 = get(i)
    const p2 = get(i + 1)
    const p3 = get(i + 2)
    // Centripetal Catmull-Rom (alpha = 0.5) tránh phình hoặc nút thắt khi khoảng cách điểm không đều.
    const t1 = Math.sqrt(dist(p0, p1))
    const t2 = Math.sqrt(dist(p1, p2))
    const t3 = Math.sqrt(dist(p2, p3))
    const m1x = t2 * ((p1[0] - p0[0]) / t1 - (p2[0] - p0[0]) / (t1 + t2) + (p2[0] - p1[0]) / t2)
    const m1y = t2 * ((p1[1] - p0[1]) / t1 - (p2[1] - p0[1]) / (t1 + t2) + (p2[1] - p1[1]) / t2)
    const m2x = t2 * ((p2[0] - p1[0]) / t2 - (p3[0] - p1[0]) / (t2 + t3) + (p3[0] - p2[0]) / t3)
    const m2y = t2 * ((p2[1] - p1[1]) / t2 - (p3[1] - p1[1]) / (t2 + t3) + (p3[1] - p2[1]) / t3)
    out.push([
      [p1[0] + m1x / 3, p1[1] + m1y / 3],
      [p2[0] - m2x / 3, p2[1] - m2y / 3],
      p2,
    ])
  }
  return out
}

function sampleCurveWorld(points: P[], closed: boolean): P[] {
  if (points.length === 3 && !closed) {
    const [p0, p1, p2] = points
    const q: P = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2]
    const out: P[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const u = 1 - t
      out.push([u * u * p0[0] + 2 * u * t * q[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * q[1] + t * t * p2[1]])
    }
    return out
  }
  const segs = catmullRomBeziers(points, closed)
  const out: P[] = [points[0]]
  let cur = points[0]
  for (const [c1, c2, p3] of segs) {
    for (let i = 1; i <= 14; i++) {
      const t = i / 14
      const u = 1 - t
      out.push([
        u * u * u * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        u * u * u * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
      ])
    }
    cur = p3
  }
  return out
}

function sampleRegionPart(part: RegionPart, pts: Map<string, P>): P[] {
  if (part.k === 'seg') return part.names.map((n) => pts.get(n)!)
  if (part.k === 'curve') return sampleCurveWorld(part.names.map((n) => pts.get(n)!), false)
  const o = pts.get(part.o)!
  const steps = Math.max(12, Math.ceil(Math.abs(part.to - part.from) / 10))
  const out: P[] = []
  for (let i = 0; i <= steps; i++) {
    const a = part.from + ((part.to - part.from) * i) / steps
    out.push(ellipseArcPoint(o, part.rx, part.ry, a, part.rotate))
  }
  return out
}

function collectUsedPointNames(cmds: Cmd[]): Set<string> {
  const used = new Set<string>()
  for (const c of cmds) {
    if (c.t === 'seg' || c.t === 'dim' || c.t === 'label' || c.t === 'ground') { used.add(c.a); used.add(c.b) }
    else if (c.t === 'poly' || c.t === 'curve') c.names.forEach((n) => used.add(n))
    else if (c.t === 'angle' || c.t === 'right') { used.add(c.a); used.add(c.o); used.add(c.b) }
    else if (c.t === 'sprite') { used.add(c.a); if (c.b) used.add(c.b) }
    else if (c.t === 'shape' || c.t === 'arc' || c.t === 'text' || c.t === 'dot') used.add(c.o)
    else if (c.t === 'region') {
      for (const p of c.parts) if (p.k !== 'arc') p.names.forEach((n) => used.add(n))
    }
  }
  return used
}

export function renderSceneSvg(spec: SceneSpec, desc: string): { svg: string; width: number; height: number } {
  const { pts, cmds } = parseScene(spec.text)
  const shapes = cmds.filter((c): c is Shape => c.t === 'shape')
  const solidShapes = shapes.filter((s) => !s.bg)

  // Hai nút lưu đồ nối nhau cần chừa chỗ cho mũi tên, kể cả khi elip sát góc hộp.
  for (const arrow of cmds) {
    if (arrow.t !== 'seg' || !arrow.arrow) continue
    const ends = [arrow.a, arrow.b]
    const ellipse = solidShapes.find(s => s.kind === 'elip' && ends.includes(s.o))
    const box = solidShapes.find(s => s.kind === 'hộp' && ends.includes(s.o))
    if (!ellipse || !box) continue
    const [x, y] = pts.get(ellipse.o)!
    const [bx, by] = pts.get(box.o)!
    const dx = x - bx
    const dy = y - by
    const gap = Math.min(box.ry, ellipse.ry) * 0.35
    const separation = (scale: number) => Math.hypot(
      Math.max(0, Math.abs(dx) * scale - box.rx) / (ellipse.rx + gap),
      Math.max(0, Math.abs(dy) * scale - box.ry) / (ellipse.ry + gap),
    )
    if (separation(1) >= 1) continue
    if (!dx && !dy) {
      pts.set(ellipse.o, [x, y - box.ry - ellipse.ry - gap])
      continue
    }
    let lo = 1
    let hi = Math.min(dx ? (box.rx + ellipse.rx + gap) / Math.abs(dx) : Infinity,
      dy ? (box.ry + ellipse.ry + gap) / Math.abs(dy) : Infinity)
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2
      if (separation(mid) < 1) lo = mid
      else hi = mid
    }
    pts.set(ellipse.o, [bx + dx * hi, by + dy * hi])
  }

  // Điểm ẩn chỉ đóng vai trò tâm cung trong lệnh `vùng` không kéo giãn khung ảnh.
  const nonRegionUsed = collectUsedPointNames(cmds)
  const boundPts = [...pts].filter(([nm]) => !nm.startsWith('_') || nonRegionUsed.has(nm)).map(([, p]) => p)
  const px = (boundPts.length ? boundPts : [...pts.values()]).map((p) => p[0])
  const py = (boundPts.length ? boundPts : [...pts.values()]).map((p) => p[1])

  // cạnh của góc mà AI quên vẽ (thiếu "đất AB"…) thì tự vẽ, không thì cung góc lơ lửng
  const drawn = (a: string, b: string) =>
    cmds.some((c) =>
      (c.t === 'seg' || c.t === 'ground') ? (c.a === a && c.b === b) || (c.a === b && c.b === a)
      : c.t === 'poly' && c.names.some((n, i) => { const m = c.names[(i + 1) % c.names.length]; return (n === a && m === b) || (n === b && m === a) }))
  for (const c of [...cmds]) {
    if (c.t !== 'angle' && c.t !== 'right') continue
    for (const x of [c.a, c.b]) if (!drawn(c.o, x)) cmds.push({ t: 'seg', a: c.o, b: x, dashed: false })
  }
  // thang (vật nghiêng) mà AI quên vẽ tường: đỉnh thang nằm thẳng trên một điểm có tên ở mặt đất → tự dựng tường + góc vuông
  {
    const allX = [...pts.values()].map((p) => p[0])
    const tol = (Math.max(...allX) - Math.min(...allX) || 1) * 0.03
    for (const c of [...cmds]) {
      if (c.t !== 'sprite' || c.id !== 'ladder' || !c.b) continue
      const foot = pts.get(c.a)!
      const top = pts.get(c.b)!
      const base = [...pts].find(([nm, p]) => nm !== c.a && nm !== c.b && !nm.startsWith('_') && Math.abs(p[0] - top[0]) <= tol && Math.abs(p[1] - foot[1]) <= tol && top[1] > p[1])
      if (!base) continue
      const [w] = base
      if (!drawn(w, c.b)) cmds.push({ t: 'ground', a: w, b: c.b, wall: true })
      if (!cmds.some((g) => g.t === 'right' && g.o === w)) cmds.push({ t: 'right', a: c.a, o: w, b: c.b })
    }
  }
  // nhiều góc chung một đỉnh: góc nhỏ ở trong, góc lớn ở ngoài, bán kính tăng dần
  const angleSize = (g: Extract<Cmd, { t: 'angle' }>) => {
    const o = pts.get(g.o)!
    const pa = pts.get(g.a)!
    const pb = pts.get(g.b)!
    let d = Math.atan2(pb[1] - o[1], pb[0] - o[0]) - Math.atan2(pa[1] - o[1], pa[0] - o[0])
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    return Math.abs(d)
  }
  const ring = new Map<Cmd, number>()
  for (const o of new Set(cmds.flatMap((g) => (g.t === 'angle' ? [g.o] : [])))) {
    const group = cmds.filter((g): g is Extract<Cmd, { t: 'angle' }> => g.t === 'angle' && g.o === o)
    group.sort((x, y) => angleSize(x) - angleSize(y)).forEach((g, i) => ring.set(g, i))
  }

  const ptSpan = Math.max(Math.max(...py) - Math.min(...py), (Math.max(...px) - Math.min(...px)) * 0.5) || 1
  const named = [...pts].filter(([nm]) => !nm.startsWith('_')).map(([, p]) => p)
  const ptCx = named.reduce((s, p) => s + p[0], 0) / (named.length || 1)
  const ptCy = named.reduce((s, p) => s + p[1], 0) / (named.length || 1)
  const sprites = cmds
    .filter((c): c is Extract<Cmd, { t: 'sprite' }> => c.t === 'sprite')
    .map((c) => {
      const sp = getSprite(c.id)
      const aspect = sp ? sp.w / sp.h : 0.6
      let foot = pts.get(c.a)!
      let top: P = c.b ? pts.get(c.b)! : [foot[0], foot[1] + ptSpan * 0.25]
      const len = Math.hypot(top[0] - foot[0], top[1] - foot[1]) || ptSpan * 0.25
      const u: P = [(top[0] - foot[0]) / len, (top[1] - foot[1]) / len]
      const n: P = [u[1], -u[0]]
      const hw = (len * aspect) / 2
      const wide = EDGE_ANCHOR.has(c.id)
      const shifted = Boolean(c.b) && (Math.abs(u[0]) > 0.09 || wide)
      if (shifted) {
        const mx = (foot[0] + top[0]) / 2 - ptCx
        const my = (foot[1] + top[1]) / 2 - ptCy
        let sgn = mx * n[0] + my * n[1] >= 0 ? 1 : -1
        const ang = cmds.find((g): g is Extract<Cmd, { t: 'angle' }> =>
          g.t === 'angle' && (g.o === c.a || g.o === c.b) && [g.a, g.b].includes(g.o === c.a ? c.b! : c.a))
        if (ang) {
          const o = pts.get(ang.o)!
          const other = pts.get(ang.a === (ang.o === c.a ? c.b : c.a) ? ang.b : ang.a)!
          sgn = (other[0] - o[0]) * n[0] + (other[1] - o[1]) * n[1] >= 0 ? -1 : 1
        }
        const off = hw * (wide ? 1 : 0.5) * sgn
        foot = [foot[0] + n[0] * off, foot[1] + n[1] * off]
        top = [top[0] + n[0] * off, top[1] + n[1] * off]
      }
      const corners: P[] = [
        [foot[0] + n[0] * hw, foot[1] + n[1] * hw],
        [foot[0] - n[0] * hw, foot[1] - n[1] * hw],
        [top[0] + n[0] * hw, top[1] + n[1] * hw],
        [top[0] - n[0] * hw, top[1] - n[1] * hw],
      ]
      return { c, sp, foot, top, len, corners, shifted, hw }
    })

  const xs = [...px, ...sprites.flatMap((s) => s.corners.map((p) => p[0]))]
  const ys = [...py, ...sprites.flatMap((s) => s.corners.map((p) => p[1]))]
  for (const c of shapes) {
    const [x, y] = pts.get(c.o)!
    if (!c.rotate) {
      xs.push(x - c.rx, x + c.rx)
      ys.push(y - c.ry, y + c.ry)
    } else {
      for (let i = 0; i < 4; i++) {
        const sx = i & 1 ? c.rx : -c.rx
        const sy = i & 2 ? c.ry : -c.ry
        const [rx, ry] = rotateVec([sx, sy], c.rotate)
        xs.push(x + rx); ys.push(y + ry)
      }
    }
  }
  const arcs = cmds.filter((c): c is ArcCmd => c.t === 'arc')
  for (const c of arcs) {
    const center = pts.get(c.o)!
    const rot = c.rotate ?? 0
    if (rot) {
      const steps = Math.max(12, Math.ceil(c.sweep / 10))
      for (let i = 0; i <= steps; i++) {
        const [x, y] = ellipseArcPoint(center, c.rx, c.ry, c.start + (c.sweep * i) / steps, rot)
        xs.push(x); ys.push(y)
      }
    } else {
      const angles = [c.start, c.start + c.sweep]
      for (const angle of [0, 90, 180, 270]) {
        if (wrapDegrees(angle - c.start) <= c.sweep) angles.push(angle)
      }
      for (const angle of angles) {
        const [x, y] = ellipseArcPoint(center, c.rx, c.ry, angle)
        xs.push(x); ys.push(y)
      }
    }
  }
  const curves = cmds.filter((c): c is CurveCmd => c.t === 'curve')
  for (const c of curves) {
    for (const [x, y] of sampleCurveWorld(c.names.map((n) => pts.get(n)!), c.closed)) {
      xs.push(x); ys.push(y)
    }
  }
  const regions = cmds.filter((c): c is RegionCmd => c.t === 'region')
  for (const c of regions) {
    for (const p of c.parts) {
      for (const [x, y] of sampleRegionPart(p, pts)) {
        xs.push(x); ys.push(y)
      }
    }
  }

  const getLabels = (k: number) => cmds.flatMap((c, i) => {
    if ((c.t !== 'shape' && c.t !== 'text' && c.t !== 'arc') || !c.text) return []
    let size = c.t === 'text' && c.large ? 21 : 15
    let lines = c.text.split('\\n')
    if (c.t === 'shape') {
      const availableW = c.rx * k * (c.kind === 'hộp' ? 2 : c.kind === 'thoi' ? 1.1 : 1.6) - 12
      const availableH = c.ry * k * (c.kind === 'hộp' ? 2 : c.kind === 'thoi' ? 1.1 : 1.4) - 5
      for (; size >= 8; size--) {
        const wrapped = lines.flatMap((line) => {
          const rows: string[] = []
          for (const word of line.split(/\s+/)) {
            const last = rows.at(-1)
            if (last && textWidthEm(last + ' ' + word) * size <= availableW) rows[rows.length - 1] += ' ' + word
            else rows.push(word)
          }
          return rows
        })
        if (wrapped.length * size * 1.2 <= availableH && wrapped.every((line) => textWidthEm(line) * size <= availableW)) {
          lines = wrapped
          break
        }
      }
      if (size < 8) {
        size = Math.max(1, Math.min(8, availableH / (lines.length * 1.2),
          availableW / Math.max(1, ...lines.map(textWidthEm))))
      }
    }
    const center = pts.get(c.o)!
    const mid = c.t === 'arc' ? c.start + c.sweep / 2 : 0
    const point = c.t === 'arc' ? ellipseArcPoint(center, c.rx, c.ry, mid, c.rotate ?? 0) : center
    const [dx, dy] = c.t === 'arc' ? rotateVec(direction(mid), c.rotate ?? 0) : [0, 0]
    return [{
      point, dx: 14 * dx, dy: -14 * dy, id: `free:${c.o}:${i}`, lines, size, step: size * 1.2,
      bold: c.t === 'text' && c.bold, italic: Boolean(c.italic),
      rotate: c.t === 'text' ? c.rotate : undefined,
      solidLabel: c.t === 'shape' && c.fill !== 'none',
    }]
  })

  const frameCmd = [...cmds].reverse().find((c): c is Extract<Cmd, { t: 'frame' }> => c.t === 'frame')
  const frameW = frameCmd?.w ?? 300
  const frameH = frameCmd?.h ?? 230
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const freeLayout = shapes.length > 0 || arcs.length > 0 || curves.length > 0 || regions.length > 0 ||
    cmds.some((c) => c.t === 'text' || c.t === 'dot' || (c.t === 'seg' && c.arrow))
  const spanX = maxX - minX || (freeLayout ? 0 : 1)
  const spanY = maxY - minY || (freeLayout ? 0 : 1)
  const k = spanX || spanY ? Math.min(frameW / spanX, frameH / spanY) : 1
  const labels = getLabels(k)
  const pad = 62
  const width = Math.round(spanX * k + pad * 2) - pad * 2
  const height = Math.round(spanY * k + pad * 2) - pad * 2
  const bounds = { left: 0, right: width, top: 0, bottom: height }
  for (const c of labels) {
    const [x, y] = c.point
    const lx = (x - minX) * k + c.dx
    const ly = height - (y - minY) * k + c.dy
    const hw = Math.max(...c.lines.map(textWidthEm)) * c.size / 2
    const hh = (c.lines.length - 1) * c.step / 2 + c.size
    bounds.left = Math.min(bounds.left, Math.floor(lx - hw))
    bounds.right = Math.max(bounds.right, Math.ceil(lx + hw))
    bounds.top = Math.min(bounds.top, Math.floor(ly - hh))
    bounds.bottom = Math.max(bounds.bottom, Math.ceil(ly + hh))
  }
  const W = bounds.right - bounds.left + pad * 2
  const H = bounds.bottom - bounds.top + pad * 2
  const S = ([x, y]: P): P => [pad - bounds.left + (x - minX) * k, height + pad - bounds.top - (y - minY) * k]
  const at = (n: string) => S(pts.get(n)!)
  const cxPts = boundPts.length ? boundPts : [...pts.values()]
  const cx = cxPts.reduce((s, p) => s + S(p)[0], 0) / cxPts.length
  const cy = cxPts.reduce((s, p) => s + S(p)[1], 0) / cxPts.length

  const arrowColors = new Set<string>()
  const shadeColors = new Set<string>()
  const sphereColors = new Set<string>()
  const hatchColors = new Set<string>()
  const noteColor = (c: { fill?: string; stroke?: string; arrow?: boolean }) => {
    if (c.arrow && c.stroke && c.stroke !== '#111' && c.stroke !== 'none') arrowColors.add(c.stroke)
    const m = c.fill ? /^url\(#(scgr|scrg|schat)-([\da-f]{6})\)$/.exec(c.fill) : null
    if (m?.[1] === 'scgr') shadeColors.add('#' + m[2])
    else if (m?.[1] === 'scrg') sphereColors.add('#' + m[2])
    else if (m?.[1] === 'schat') hatchColors.add('#' + m[2])
  }
  cmds.forEach((c) => {
    if (c.t === 'seg' || c.t === 'poly' || c.t === 'shape' || c.t === 'arc' || c.t === 'curve' || c.t === 'region') noteColor(c)
  })
  const arrowId = (stroke?: string) => (stroke && stroke !== '#111' ? `scarr-${stroke.slice(1)}` : 'scarr')
  const extraMarkers = [...arrowColors].map((c) =>
    `<marker id="scarr-${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')
  const extraGrads = [...shadeColors].map(shadeGradientDef).join('') +
    [...sphereColors].map(sphereGradientDef).join('') +
    [...hatchColors].map(hatchPatternDef).join('')

  let b = `<defs><marker id="scarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker>${extraMarkers}${extraGrads}</defs>`
  const line = (p: P, q: P, extra = '', stroke = '#111') =>
    `<path d="M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}" stroke="${stroke}" fill="none" ${extra}/>`
  const text = (x: number, y: number, s: string, anchor = 'middle', size = 15, lbl?: string, italic = false, rotateSvgDeg = 0) => {
    const tr = rotateSvgDeg ? ` transform="rotate(${f1(rotateSvgDeg)} ${f1(x)} ${f1(y - 5)})"` : ''
    const content = s.includes('$') ? sceneRichText(s) : s.includes('_') ? richTextToSvg(s) : esc(s)
    return `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="${size}"${italic ? ' font-style="italic"' : ''}${lbl ? ` data-lbl="${lbl}"` : ''}${tr} text-anchor="${anchor}">${content}</text>`
  }

  const outward = (p: P, q: P): P => {
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len = Math.hypot(dx, dy) || 1
    let n: P = [-dy / len, dx / len]
    const mx = (p[0] + q[0]) / 2
    const my = (p[1] + q[1]) / 2
    if ((mx - cx) * n[0] + (my - cy) * n[1] < 0) n = [-n[0], -n[1]]
    return n
  }

  const curvePathD = (c: CurveCmd): string => {
    const world = c.names.map((n) => pts.get(n)!)
    const sp = world.map(S)
    if (sp.length === 3 && !c.closed) {
      const [p0, p1, p2] = sp
      const q: P = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2]
      return `M${f1(p0[0])} ${f1(p0[1])}Q${f1(q[0])} ${f1(q[1])} ${f1(p2[0])} ${f1(p2[1])}`
    }
    const segs = catmullRomBeziers(sp, c.closed)
    return `M${f1(sp[0][0])} ${f1(sp[0][1])}` +
      segs.map(([c1, c2, p]) => `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p[0])} ${f1(p[1])}`).join('') +
      (c.closed ? 'Z' : '')
  }

  const regionPathD = (c: RegionCmd): string => {
    let d = ''
    let cur: P | null = null
    const moveOrLine = (p: P) => {
      if (!cur) d += `M${f1(p[0])} ${f1(p[1])}`
      else if (Math.hypot(p[0] - cur[0], p[1] - cur[1]) > 0.3) d += `L${f1(p[0])} ${f1(p[1])}`
      cur = p
    }
    for (const part of c.parts) {
      if (part.k === 'seg') {
        part.names.forEach((n) => moveOrLine(at(n)))
      } else if (part.k === 'curve') {
        const sp = part.names.map(at)
        moveOrLine(sp[0])
        if (sp.length === 3) {
          const [p0, p1, p2] = sp
          const q: P = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2]
          d += `Q${f1(q[0])} ${f1(q[1])} ${f1(p2[0])} ${f1(p2[1])}`
          cur = p2
        } else {
          for (const [c1, c2, p] of catmullRomBeziers(sp, false)) {
            d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p[0])} ${f1(p[1])}`
            cur = p
          }
        }
      } else {
        const center = pts.get(part.o)!
        const pStart = S(ellipseArcPoint(center, part.rx, part.ry, part.from, part.rotate))
        moveOrLine(pStart)
        const diff = part.to - part.from
        const ccw = diff >= 0
        const span = Math.abs(diff)
        const sweepFlag = ccw ? 0 : 1
        const rx = f1(part.rx * k)
        const ry = f1(part.ry * k)
        const rot = part.rotate ? f1(-part.rotate) : 0
        if (span >= 360) {
          const pMid = S(ellipseArcPoint(center, part.rx, part.ry, part.from + (ccw ? 180 : -180), part.rotate))
          d += `A${rx} ${ry} ${rot} 0 ${sweepFlag} ${f1(pMid[0])} ${f1(pMid[1])}`
          d += `A${rx} ${ry} ${rot} 0 ${sweepFlag} ${f1(pStart[0])} ${f1(pStart[1])}`
          cur = pStart
        } else if (span > 0) {
          const pEnd = S(ellipseArcPoint(center, part.rx, part.ry, part.to, part.rotate))
          const large = Number(span > 180)
          d += `A${rx} ${ry} ${rot} ${large} ${sweepFlag} ${f1(pEnd[0])} ${f1(pEnd[1])}`
          cur = pEnd
        }
      }
    }
    return d + 'Z'
  }

  const strokeWidthOnly = (stroke: string | undefined, weight: Weight | undefined, baseW: number) =>
    stroke === 'none' ? '' : ` stroke-width="${strokeWidthAttr(weight, baseW)}"`

  const strokeAttrs = (stroke: string | undefined, weight: Weight | undefined, baseW: number, dashed: boolean) => {
    const sw = strokeWidthOnly(stroke, weight, baseW)
    const dash = dashed ? ' stroke-dasharray="5 4"' : ''
    return `stroke="${stroke ?? '#111'}"${sw}${dash}`
  }

  const fillOpacityAttr = (fill: string | undefined, opacity: number | undefined) =>
    opacity !== undefined && fill && fill !== 'none' ? ` fill-opacity="${opacity}"` : ''

  const renderShapeSvg = (c: Shape) => {
    const [x, y] = at(c.o)
    const rx = c.rx * k
    const ry = c.ry * k
    const rot = c.rotate ? ` transform="rotate(${f1(-c.rotate)} ${f1(x)} ${f1(y)})"` : ''
    const sw = strokeWidthOnly(c.stroke, c.weight, 1.2)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    const style = `fill="${c.fill}"${fo} stroke="${c.stroke ?? '#111'}"${sw}${dash}`
    if (c.kind === 'tròn') return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rx}" ${style}/>`
    if (c.kind === 'elip') return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" ${style}${rot}/>`
    if (c.kind === 'thoi') return `<path d="M${f1(x - rx)} ${f1(y)}L${f1(x)} ${f1(y - ry)}L${f1(x + rx)} ${f1(y)}L${f1(x)} ${f1(y + ry)}Z" ${style}/>`
    return `<rect x="${f1(x - rx)}" y="${f1(y - ry)}" width="${2 * rx}" height="${2 * ry}" rx="${cornerRadius(c) * k}" ${style}${rot}/>`
  }

  const renderArcSvg = (c: ArcCmd) => {
    const center = pts.get(c.o)!
    const rot = c.rotate ?? 0
    const point = (angle: number) => S(ellipseArcPoint(center, c.rx, c.ry, angle, rot)).join(' ')
    const start = point(c.start)
    const rx = c.rx * k
    const ry = c.ry * k
    const svgRot = rot ? f1(-rot) : 0
    // Trục y của SVG hướng xuống nên sweep-flag 0 đi ngược chiều kim đồng hồ.
    const turn = (end: string, large: number) => `A${rx} ${ry} ${svgRot} ${large} 0 ${end}`
    const full = c.sweep === 360
    const curve = full ? turn(point(c.start + 180), 0) + turn(start, 0) : turn(point(c.start + c.sweep), Number(c.sweep > 180))
    const d = c.kind === 'quạt' && !full ? `M${S(center).join(' ')}L${start}${curve}Z` : `M${start}${curve}${full ? 'Z' : ''}`
    const sw = strokeWidthOnly(c.stroke, c.weight, 1.6)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${d}" stroke="${c.stroke ?? '#111'}" fill="${c.fill}"${fo}${sw} stroke-linejoin="round"${dash}/>`
  }

  const renderCurveSvg = (c: CurveCmd) => {
    const aid = arrowId(c.stroke)
    const arr = c.arrow ? ` marker-end="url(#${aid})"` : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${curvePathD(c)}" ${strokeAttrs(c.stroke, c.weight, 1.6, c.dashed)} fill="${c.fill}"${fo} stroke-linecap="round" stroke-linejoin="round"${arr}/>`
  }

  const renderRegionSvg = (c: RegionCmd) => {
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${regionPathD(c)}" ${strokeAttrs(c.stroke, c.weight, 1.6, c.dashed)} fill="${c.fill}"${fo} stroke-linejoin="round"/>`
  }

  const renderPolySvg = (c: Extract<Cmd, { t: 'poly' }>) => {
    const d = c.names.map((n, i) => `${i ? 'L' : 'M'}${f1(at(n)[0])} ${f1(at(n)[1])}`).join('') + 'Z'
    const sw = strokeWidthOnly(c.stroke, c.weight, 1.6)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${d}" stroke="${c.stroke ?? '#111'}" fill="${c.fill ?? 'none'}"${fo}${sw} stroke-linejoin="round"${dash}/>`
  }

  // 1. Mặt đất / tường
  for (const c of cmds) {
    if (c.t !== 'ground') continue
    const p = at(c.a)
    const q = at(c.b)
    const n = outward(p, q)
    const len = Math.hypot(q[0] - p[0], q[1] - p[1])
    const u: P = [(q[0] - p[0]) / len, (q[1] - p[1]) / len]
    b += line(p, q, 'stroke-width="2"')
    for (let s = 6; s < len; s += 9) {
      const o: P = [p[0] + u[0] * s, p[1] + u[1] * s]
      b += line(o, [o[0] + n[0] * 8 - u[0] * 6, o[1] + n[1] * 8 - u[1] * 6], 'stroke-width="0.9"')
    }
  }

  // 2. Lớp nền (`nền`): vẽ theo đúng thứ tự viết, nằm dưới sprites và mọi nét chính
  for (const c of cmds) {
    if (!('bg' in c) || !c.bg) continue
    if (c.t === 'poly') b += renderPolySvg(c)
    else if (c.t === 'region') b += renderRegionSvg(c)
    else if (c.t === 'curve') b += renderCurveSvg(c)
    else if (c.t === 'arc') b += renderArcSvg(c)
    else if (c.t === 'shape') b += renderShapeSvg(c)
  }

  // 3. Hình vật
  const usedSprites = new Set<string>()
  for (const s of sprites) {
    const f = S(s.foot)
    const t = S(s.top)
    const hp = s.len * k
    const deg = (Math.atan2(t[0] - f[0], f[1] - t[1]) * 180) / Math.PI
    const rot = `translate(${f1(f[0])} ${f1(f[1])}) rotate(${f1(deg)})`
    if (s.sp) {
      usedSprites.add(s.c.id)
      const sc = hp / s.sp.h
      b += `<use href="#sp-${s.c.id}" transform="${rot} translate(${f1((-s.sp.w * sc) / 2)} ${f1(-hp)}) scale(${+sc.toFixed(4)})"/>`
    } else {
      const wp = hp * 0.6
      const name = OBJECTS[s.c.id] ?? s.c.name.replace(/^en\s*:\s*/i, '')
      b += `<g transform="${rot}"><rect x="${f1(-wp / 2)}" y="${f1(-hp)}" width="${f1(wp)}" height="${f1(hp)}" fill="#fff" stroke="#888" stroke-dasharray="4 3"/><text y="${f1(-hp / 2)}" text-anchor="middle" font-size="11" fill="#666" ${FAM}>${esc(name)}</text></g>`
    }
  }
  b = b.replace('</defs>', [...usedSprites].map(spriteDef).join('') + '</defs>')

  // 4. Nét chính (giữ nguyên luật filledPolys cũ cho đa giác thường không có `nền`)
  const mainCmds = cmds.filter((c) => !('bg' in c && c.bg))
  const filledPolys = mainCmds.filter((c) => c.t === 'poly' && c.fill)
  const baseLine = (c: Cmd) => c.t === 'seg' || (c.t === 'poly' && !c.fill)
  const ordered = filledPolys.length ? [
    ...mainCmds.filter(baseLine), ...filledPolys, ...mainCmds.filter((c) => !baseLine(c) && c.t !== 'poly'),
  ] : mainCmds
  for (const c of ordered) {
    if (c.t === 'poly') {
      b += renderPolySvg(c)
    } else if (c.t === 'region') {
      b += renderRegionSvg(c)
    } else if (c.t === 'curve') {
      b += renderCurveSvg(c)
    } else if (c.t === 'seg') {
      let p = at(c.a)
      let q = at(c.b)
      const sw = strokeWidthAttr(c.weight, c.dashed ? 1.2 : 1.6)
      const style = `stroke-width="${sw}"` + (c.dashed ? ' stroke-dasharray="5 4"' : '')
      const from = solidShapes.filter((s) => s.o === c.a)
      const to = solidShapes.filter((s) => s.o === c.b)
      if (c.arrow || (from.length && to.length)) {
        const len = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (!len) continue
        const dx = (q[0] - p[0]) / len
        const dy = (q[1] - p[1]) / len
        const start = Math.max(0, ...from.map((s) => shapeEdge(s, dx, dy) * k))
        const end = Math.max(0, ...to.map((s) => shapeEdge(s, dx, dy) * k))
        if (start + end >= len) continue
        p = [p[0] + dx * start, p[1] + dy * start]
        q = [q[0] - dx * end, q[1] - dy * end]
      }
      const aid = arrowId(c.stroke)
      const marks = (c.arrowStart ? ` marker-start="url(#${aid})"` : '') + (c.arrow ? ` marker-end="url(#${aid})"` : '')
      b += line(p, q, style + marks, c.stroke ?? '#111')
    } else if (c.t === 'right') {
      const o = at(c.o)
      const ua = at(c.a)
      const ub = at(c.b)
      const da: P = [(ua[0] - o[0]) / (Math.hypot(ua[0] - o[0], ua[1] - o[1]) || 1), (ua[1] - o[1]) / (Math.hypot(ua[0] - o[0], ua[1] - o[1]) || 1)]
      const db: P = [(ub[0] - o[0]) / (Math.hypot(ub[0] - o[0], ub[1] - o[1]) || 1), (ub[1] - o[1]) / (Math.hypot(ub[0] - o[0], ub[1] - o[1]) || 1)]
      const s = 10
      const p1: P = [o[0] + da[0] * s, o[1] + da[1] * s]
      const p2: P = [p1[0] + db[0] * s, p1[1] + db[1] * s]
      const p3: P = [o[0] + db[0] * s, o[1] + db[1] * s]
      b += `<path d="M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}" stroke="#111" fill="none" stroke-width="1"/>`
    } else if (c.t === 'angle') {
      const o = at(c.o)
      const a1 = Math.atan2(at(c.a)[1] - o[1], at(c.a)[0] - o[0])
      let a2 = Math.atan2(at(c.b)[1] - o[1], at(c.b)[0] - o[0])
      let d = a2 - a1
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      a2 = a1 + d
      const i = ring.get(c) ?? 0
      const r = c.radius !== undefined ? c.radius * k : 22 + i * 16
      const sweep = d > 0 ? 1 : 0
      b += `<path d="M${f1(o[0] + r * Math.cos(a1))} ${f1(o[1] + r * Math.sin(a1))}A${f1(r)} ${f1(r)} 0 0 ${sweep} ${f1(o[0] + r * Math.cos(a2))} ${f1(o[1] + r * Math.sin(a2))}" stroke="#111" fill="none" stroke-width="1"/>`
      if (c.text) {
        const mid = a1 + d / 2
        const rl = r + 14
        b += text(o[0] + rl * Math.cos(mid), o[1] + rl * Math.sin(mid) + 5, c.text, 'middle', 14, `ang:${c.a}${c.o}${c.b}`, Boolean(c.italic))
      }
    } else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      const off = 18
      const p2: P = [p[0] + n[0] * off, p[1] + n[1] * off]
      const q2: P = [q[0] + n[0] * off, q[1] + n[1] * off]
      b += line([p[0] + n[0] * 4, p[1] + n[1] * 4], [p[0] + n[0] * (off + 5), p[1] + n[1] * (off + 5)], 'stroke-width="0.8"')
      b += line([q[0] + n[0] * 4, q[1] + n[1] * 4], [q[0] + n[0] * (off + 5), q[1] + n[1] * (off + 5)], 'stroke-width="0.8"')
      b += line(p2, q2, 'stroke-width="1" marker-start="url(#scarr)" marker-end="url(#scarr)"')
      if (c.text) {
        const mx = (p2[0] + q2[0]) / 2 + n[0] * 12
        const my = (p2[1] + q2[1]) / 2 + n[1] * 12 + 5
        b += text(mx, my, c.text, Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle', 14, `dim:${c.a}${c.b}`)
      }
    } else if (c.t === 'label') {
      const p = at(c.a)
      const q = at(c.b)
      let n = outward(p, q)
      const alongSeg = (s: (typeof sprites)[number]) =>
        s.c.b !== undefined && ((s.c.a === c.a && s.c.b === c.b) || (s.c.a === c.b && s.c.b === c.a))
      const along = sprites.find(alongSeg)
      let off = 14
      if (along?.shifted) n = [-n[0], -n[1]]
      else if (along) off += along.hw * k
      let rotSvg = c.rotate ? -c.rotate : 0
      if (c.along) {
        let deg = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI
        if (deg > 90) deg -= 180
        if (deg <= -90) deg += 180
        rotSvg = deg
      }
      const anchor = rotSvg ? 'middle' : (Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle')
      b += text((p[0] + q[0]) / 2 + n[0] * off, (p[1] + q[1]) / 2 + n[1] * off + 5, c.text, anchor, 15, `lbl:${c.a}${c.b}`, Boolean(c.italic), rotSvg)
    }
  }

  // 5. Cung & hình tự do nổi trên nét (không có `nền`)
  for (const c of arcs) if (!c.bg) b += renderArcSvg(c)
  for (const c of shapes) if (!c.bg) b += renderShapeSvg(c)

  // 6. Chấm điểm
  for (const c of cmds) {
    if (c.t !== 'dot') continue
    const [x, y] = at(c.o)
    const st = c.stroke ? ` stroke="${c.stroke}" stroke-width="1.4"` : ' stroke="none"'
    b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${c.r}" fill="${c.fill}"${st}/>`
  }

  // 7. Nhãn trên hình tự do & chữ độc lập
  for (const c of labels) {
    const [lx0, ly0] = S(c.point)
    const x = lx0 + c.dx
    const y = ly0 + c.dy
    const start = y + c.size * 0.32 - (c.lines.length - 1) * c.step / 2
    const body = c.lines.length === 1 ? sceneRichText(c.lines[0]) : c.lines.map((s, i) =>
      `<tspan x="${f1(x)}" y="${f1(start + i * c.step)}">${sceneRichText(s)}</tspan>`).join('')
    const style = (c.solidLabel ? ' stroke="none"' : '') + (c.bold ? ' font-weight="bold"' : '') + (c.italic ? ' font-style="italic"' : '')
    const tr = c.rotate ? ` transform="rotate(${f1(-c.rotate)} ${f1(x)} ${f1(y)})"` : ''
    b += `<text x="${f1(x)}" y="${f1(start)}" ${FAM} font-size="${c.size}"${style} data-lbl="${c.id}"${tr} text-anchor="middle">${body}</text>`
  }

  // các nét đã vẽ, để nhãn điểm né
  const segs: [P, P][] = []
  for (const c of cmds) {
    if (c.t === 'seg' || c.t === 'ground') segs.push([at(c.a), at(c.b)])
    else if (c.t === 'arc' && c.kind === 'quạt' && c.sweep < 360) {
      const center = pts.get(c.o)!
      const o = S(center)
      segs.push([o, S(ellipseArcPoint(center, c.rx, c.ry, c.start, c.rotate ?? 0))], [o, S(ellipseArcPoint(center, c.rx, c.ry, c.start + c.sweep, c.rotate ?? 0))])
    } else if (c.t === 'right') {
      const o = at(c.o)
      const u = (n: string): P => {
        const q = at(n)
        const l = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1
        return [(q[0] - o[0]) / l, (q[1] - o[1]) / l]
      }
      const da = u(c.a)
      const db = u(c.b)
      const p1: P = [o[0] + da[0] * 10, o[1] + da[1] * 10]
      const p3: P = [o[0] + db[0] * 10, o[1] + db[1] * 10]
      const p2: P = [p1[0] + db[0] * 10, p1[1] + db[1] * 10]
      segs.push([p1, p2], [p2, p3])
    } else if (c.t === 'poly') {
      c.names.forEach((n, i) => segs.push([at(n), at(c.names[(i + 1) % c.names.length])]))
    } else if (c.t === 'curve') {
      const ptsCurve = sampleCurveWorld(c.names.map((n) => pts.get(n)!), c.closed).map(S)
      for (let i = 1; i < ptsCurve.length; i++) segs.push([ptsCurve[i - 1], ptsCurve[i]])
    } else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      segs.push([[p[0] + n[0] * 18, p[1] + n[1] * 18], [q[0] + n[0] * 18, q[1] + n[1] * 18]])
    }
  }
  for (const s of sprites) {
    const c = s.corners.map(S)
    segs.push([c[0], c[2]], [c[1], c[3]], [c[2], c[3]], [c[0], c[1]])
  }
  const distSeg = (x: number, y: number, [p, q]: [P, P]) => {
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(x - p[0] - t * dx, y - p[1] - t * dy)
  }
  const placed: P[] = []

  // nhãn điểm: thử 8 hướng quanh điểm, chọn chỗ không đè nét / nhãn khác, ưu tiên phía ngoài tâm hình
  for (const [name, p] of pts) {
    if (name.startsWith('_')) continue
    const [x, y] = S(p)
    let dx = x - cx
    let dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    for (const c of cmds) {
      if (c.t !== 'ground') continue
      const g1 = at(c.a)
      const g2 = at(c.b)
      const gl = Math.hypot(g2[0] - g1[0], g2[1] - g1[1]) || 1
      const dist = Math.abs((g2[0] - g1[0]) * (g1[1] - y) - (g1[0] - x) * (g2[1] - g1[1])) / gl
      if (dist > 2) continue
      const n = outward(g1, g2)
      const u: P = [(g2[0] - g1[0]) / gl, (g2[1] - g1[1]) / gl]
      const side = dx * u[0] + dy * u[1] >= 0 ? 1 : -1
      dx = -n[0] * 0.8 + u[0] * side * 0.6
      dy = -n[1] * 0.8 + u[1] * side * 0.6
    }
    const hatch: P[] = []
    for (const c of cmds) {
      if (c.t !== 'ground') continue
      const g1 = at(c.a)
      const g2 = at(c.b)
      if (distSeg(x, y, [g1, g2]) <= 2) hatch.push(outward(g1, g2))
    }
    let best: P = [x + dx * 13, y + dy * 13]
    let bestScore = Infinity
    for (let k = 0; k < 24; k++) {
      const a = ((k % 8) * Math.PI) / 4
      const ux = Math.cos(a)
      const uy = Math.sin(a)
      const rad = k < 8 ? 14 : k < 16 ? 22 : 30
      const lx = x + ux * rad
      const ly = y + uy * rad
      let score = -(ux * dx + uy * dy) * 2 + (k < 8 ? 0 : k < 16 ? 4 : 8)
      for (const n of hatch) if (ux * n[0] + uy * n[1] > 0.2) score += 40
      for (const sg of segs) {
        const d = distSeg(lx, ly, sg)
        if (d < 10) score += (10 - d) * 3
      }
      for (const [px0, py0] of placed) {
        const d = Math.hypot(lx - px0, ly - py0)
        if (d < 16) score += (16 - d) * 3
      }
      if (lx < 6 || lx > W - 6 || ly < 8 || ly > H - 4) score += 20
      if (score < bestScore - 1e-9) {
        bestScore = score
        best = [lx, ly]
      }
    }
    placed.push(best)
    b += text(best[0], best[1] + 5, name, 'middle', 15, `pt:${name}`)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${b}</svg>`
  return { svg, width: W, height: H }
}

export const SCENE_DEFAULT: SceneSpec = {
  text: [
    '_G(-1; 0) _K(5; 0) A(0; 0) B(4; 0) C(0; 3)',
    'đất _G-_K',
    'tường AC',
    'CB',
    'vuông CAB',
    'góc CBA "60°"',
    'kích thước AB "x"',
    'nhãn CB "5 m"',
    'nhãn AC "?"',
  ].join('\n'),
}

export const SCENE_HELP = [
  {
    group: 'Điểm, đoạn',
    items: [
      { code: 'A(0; 0) B(4; 0)', what: 'Khai báo điểm (trục y hướng lên)' },
      { code: '_M(1; 2)', what: 'Điểm không ghi tên; nối bằng gạch: _M-_N' },
      { code: 'AB, BC [màu lam dày]', what: 'Đoạn thẳng; thêm màu, dày, mảnh' },
      { code: 'ABCD', what: 'Đa giác khép kín' },
      { code: 'đứt MN [màu lục]', what: 'Đoạn nét đứt (nếp gấp, tia nhìn, trục)' },
      { code: 'mũi tên hai đầu đứt AB', what: 'Mũi tên hai đầu đặt trực tiếp giữa A và B' },
    ],
  },
  {
    group: 'Kí hiệu',
    items: [
      { code: 'kích thước AB "15 cm"', what: 'Mũi tên hai đầu, ghi chữ, đặt phía ngoài hình' },
      { code: 'góc ABC "60°" [0.8]', what: 'Cung góc tại đỉnh B (có thể đặt bán kính)' },
      { code: 'vuông ABC', what: 'Kí hiệu góc vuông tại B' },
      { code: 'nhãn AB "?" [dọc | xoay 30]', what: 'Chữ cạnh đoạn AB (thêm dọc để xoay song song đoạn)' },
      { code: 'chấm A [đỏ|trắng] [to|nhỏ]', what: 'Chấm điểm đặc hoặc rỗng (trắng)' },
      { code: 'đất AB / tường AB', what: 'Gạch chéo mặt đất / bức tường' },
    ],
  },
  {
    group: 'Hình vật',
    items: [
      { code: 'hình cây AB', what: 'Cây đứng từ chân A lên ngọn B (cao đúng AB)' },
      { code: 'hình cái thang CB', what: 'Thang dọc đoạn CB, xoay theo độ nghiêng' },
      { code: 'hình người A', what: 'Người đứng tại A; có: toà nhà, cột cờ, hải đăng, thuyền, ô tô…' },
      { code: 'hình en:teapot A', what: 'Vật chưa có trong kho: tên tiếng Anh, vẽ thêm một lần (tốn điểm lần đầu)' },
    ],
  },
  {
    group: 'Hình tự do & đường cong',
    items: [
      { code: 'tròn O 0.6 "Nhãn"', what: 'Vòng tròn tâm O, bán kính 0.6; thêm đứt, tô [đậm|bóng] <màu>, nền' },
      { code: 'elip O 1 0.6 đứt [xoay 30]', what: 'Elip tâm O, hai bán kính; có thể xoay, tô, đặt nền' },
      { code: 'hộp O 2 1 "Nhãn" bo tô xanh', what: 'Hộp tâm O, rộng 2, cao 1; thêm bo, xoay, đứt, tô, nền' },
      { code: 'thoi O 3 1.5 "i ≤ n?"', what: 'Hình thoi tâm O, rộng 3, cao 1.5' },
      { code: 'cung O 4 0 60 "Nhãn"', what: 'Cung tròn tâm O; cung elip O rx ry 180 360 vẽ nửa elip trước/sau' },
      { code: 'quạt O 4 0 60 tô vàng', what: 'Hình quạt tâm O với hai bán kính; thêm đứt, tô <màu>' },
      { code: 'cong A-B-C [kín] [mũi tên]', what: 'Đường cong mượt qua các điểm (3 điểm tạo parabol)' },
      { code: 'vùng mảnh1; mảnh2 tô đậm đen', what: 'Miền kín ghép từ cung / cung elip / cong / đoạn; hỗ trợ tô gạch, tô bóng, mờ' },
      { code: 'ABC tô [đậm|gạch|cầu] đỏ [mờ 0.5] [nền]', what: 'Đa giác/hình tô nhạt, đậm, gạch chéo, khối cầu hoặc bán trong suốt' },
      { code: 'chữ O "$y = f(x)$" [xoay 30]', what: 'Chữ căn giữa tại O; bọc $...$ để in nghiêng chữ toán học; thêm to, đậm, xoay' },
      { code: 'mũi tên AB / khung 520 240', what: 'Mũi tên màu/nét tuỳ chọn; khung W H chỉnh cỡ hình ngang rộng' },
    ],
  },
]
