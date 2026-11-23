/**
 * Hình thực tế nét đơn (gấp giấy, thang dựa tường, đo chiều cao, mảnh vườn…): khung hình học
 * + mũi tên kích thước + kí hiệu góc + nét đứt + mặt đất / tường gạch chéo. Nét đen trắng như đề in.
 *
 * Mỗi dòng một lệnh (toạ độ trục y hướng lên):
 *   A(0; 0) B(4; 0) C(4; 3)        khai báo điểm (tên bắt đầu bằng "_" thì không ghi nhãn)
 *   AB, BC, CA                     đoạn thẳng;  ABCD = đa giác khép kín
 *   đứt MN                         đoạn nét đứt
 *   kích thước AB "15 cm"          mũi tên hai đầu song song AB, ghi chữ (đặt phía ngoài hình)
 *   góc ABC "60°"                  cung góc tại B;  vuông ABC = kí hiệu góc vuông tại B
 *   nhãn AB "?"                    chữ ở giữa đoạn AB (không vẽ đoạn)
 *   đất AB / tường AB              gạch chéo dưới đoạn (mặt đất) hoặc bên cạnh (bức tường)
 *   hình cây AB                    hình vật (kho tranh nét) đứng từ chân A lên đỉnh B, xoay theo AB (thang dựa tường)
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
type Cmd =
  | { t: 'seg'; a: string; b: string; dashed: boolean; arrow?: boolean }
  | { t: 'poly'; names: string[]; fill?: string }
  | { t: 'dim'; a: string; b: string; text: string }
  | { t: 'angle'; a: string; o: string; b: string; text: string }
  | { t: 'right'; a: string; o: string; b: string }
  | { t: 'label'; a: string; b: string; text: string }
  | { t: 'ground'; a: string; b: string; wall: boolean }
  | { t: 'sprite'; id: string; name: string; a: string; b?: string }
  | { t: 'shape'; kind: ShapeKind; o: string; rx: number; ry: number; text: string; dashed: boolean; fill: string; rounded: boolean }
  | { t: 'arc'; kind: 'cung' | 'quạt'; o: string; r: number; start: number; sweep: number; text: string; dashed: boolean; fill: string }
  | { t: 'text'; o: string; text: string; large: boolean; bold: boolean }

const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`
const toNum = (s: string) => Number(s.replace(',', '.'))
const FREE = /^(tròn|elip|hộp|thoi|cung|quạt|chữ|mũi\s+tên)(?=\s|$)/u
const QUOTED = /"([^"]*)"|“([^”]*)”/g
const SIZE = new RegExp(`^${NUM}$`)
const COLORS = new Map(Object.entries({
  đen: '#111111', đỏ: '#d62828', xanh: '#2563eb', lục: '#15803d', vàng: '#eab308',
  cam: '#ea580c', tím: '#7e22ce', hồng: '#db2777', xám: '#6b7280', nâu: '#92400e', trắng: '#ffffff',
}))

function parseFill(value: string | undefined, line: number): string {
  const name = value?.toLowerCase()
  if (!name) throw new Error(`Dòng ${line}: thiếu màu tô`)
  const hex = COLORS.get(name) ?? name
  if (!/^#[\da-f]{6}$/.test(hex)) throw new Error(`Dòng ${line}: màu tô không hợp lệ "${name}"`)
  // Pha với trắng để màu vẫn che kín đoạn nối và chữ đen dễ đọc.
  const channels = hex.slice(1).match(/../g)!
  return '#' + channels.map((s) => Math.round(255 * 0.8 + parseInt(s, 16) * 0.2).toString(16)).join('')
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

function arcPoint([x, y]: P, radius: number, angle: number): P {
  const [dx, dy] = direction(angle)
  return [x + radius * dx, y + radius * dy]
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

function parseFreeCmd(kind: string, rest: string, pts: Map<string, P>, line: number): Cmd {
  const fail = (message: string): never => { throw new Error(`Dòng ${line}: ${message}`) }
  const parts = [...rest.matchAll(/(?:^|\s+)("[^"]*"|“[^”]*”|[^\s"“”]+)(?=\s|$)/gu)]
  if (parts.map((m) => m[0]).join('') !== rest) fail('nhãn cần đặt trong dấu ngoặc kép, cách tuỳ chọn bằng khoảng trắng')
  const args = parts.map((m) => m[1])
  if (/^mũi\s+tên$/u.test(kind)) {
    const dashed = args[0] === 'đứt'
    if (dashed) args.shift()
    const [arg] = args
    if (!arg || args.length !== 1) fail('mũi tên cần đúng 2 điểm, vd. AB')
    const [a, b, extra] = splitNames(arg, pts, line)
    if (!a || !b || extra) fail('mũi tên cần đúng 2 điểm, vd. AB')
    return { t: 'seg', a, b, dashed, arrow: true }
  }

  const arc = kind === 'cung' || kind === 'quạt'
  const o = args.shift()
  if (!o || (arc && SIZE.test(o))) return fail(arc ? `thiếu điểm tâm của ${kind}` : `thiếu điểm đặt ${kind}`)
  if (!pts.has(o)) fail(`chưa khai báo điểm "${o}"`)
  const label = (s: string) => s.startsWith('"') || s.startsWith('“')
  const unquote = (s: string) => s.slice(1, -1)
  if (kind === 'chữ') {
    const [content, ...options] = args
    if (!content || !label(content)) fail('chữ cần văn bản trong dấu ngoặc kép')
    for (const opt of options) if (opt !== 'to' && opt !== 'đậm') fail(`tuỳ chọn chữ không hợp lệ "${opt}"`)
    return { t: 'text', o, text: unquote(content), large: options.includes('to'), bold: options.includes('đậm') }
  }

  const size = (name: string) => {
    const value = args.shift()
    if (!value || !SIZE.test(value)) return fail(`${name} phải là số lớn hơn 0`)
    const n = toNum(value)
    if (!Number.isFinite(n) || n <= 0) fail(`${name} phải là số lớn hơn 0`)
    return n
  }
  const box = kind === 'hộp' || kind === 'thoi'
  const rx = box ? size('chiều rộng') / 2 : size('bán kính')
  const ry = kind === 'elip' ? size('bán kính trục y') : box ? size('chiều cao') / 2 : rx
  let start = 0
  let sweep = 0
  if (arc) {
    const angle = (name: string) => {
      const value = args.shift()
      if (!value || !SIZE.test(value) || !Number.isFinite(toNum(value))) return fail(`${name} phải là số`)
      return toNum(value)
    }
    const from = angle('góc đầu')
    const to = angle('góc cuối')
    start = wrapDegrees(from)
    const delta = to - from
    if (delta >= 360) sweep = 360
    else if (delta >= 0) sweep = delta
    else sweep = wrapDegrees(Number.isFinite(delta) ? delta : wrapDegrees(to) - start) || 360
  }
  let text: string | undefined
  let fill = box ? '#fff' : 'none'
  let dashed = false
  let rounded = false
  for (let i = 0; i < args.length; i++) {
    const opt = args[i]
    if (label(opt) && kind !== 'quạt' && text === undefined) text = unquote(opt)
    else if (opt === 'đứt') dashed = true
    else if (opt === 'bo' && kind === 'hộp') rounded = true
    else if (opt === 'tô') fill = parseFill(args[++i], line)
    else fail(`tuỳ chọn ${kind} không hợp lệ "${opt}"`)
  }
  // Nhãn tạo nút sơ đồ, hình tròn không nhãn dùng cho dựng hình.
  if (fill === 'none' && text && !arc) fill = '#fff'
  if (arc) return { t: 'arc', kind, o, r: rx, start, sweep, text: text ?? '', dashed, fill }
  return { t: 'shape', kind: kind as ShapeKind, o, rx, ry, text: text ?? '', dashed, fill, rounded }
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
  if (pts.size < 2 && !free.some(Boolean)) throw new Error('Cần ít nhất 2 điểm, vd. A(0; 0) B(4; 0)')
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
    const m = head.match(/^(\S+(?:\s+(?:vuông|thước|đứt))?)\s+([A-Za-z0-9_'-]+)$/u)
    const kw = (m?.[1] ?? '').toLowerCase().replace(/^nnhãn$/, 'nhãn')
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
    } else if (m && /^(kích thước|kt)$/.test(kw)) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'dim', a, b, text: q })
    } else if (m && /^(góc vuông|vuông)$/.test(kw)) {
      const [a, o, b] = three(m[2])
      cmds.push({ t: 'right', a, o, b })
    } else if (m && kw === 'góc') {
      const [a, o, b] = three(m[2])
      cmds.push({ t: 'angle', a, o, b, text: q })
    } else if (m && kw === 'nhãn') {
      const [a, b] = two(m[2])
      cmds.push({ t: 'label', a, b, text: q || '?' })
    } else if (m && (kw === 'đoạn' || kw === 'đứt' || kw === 'nét đứt')) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'seg', a, b, dashed: kw !== 'đoạn' })
    } else if (m && (kw === 'đất' || kw === 'tường')) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'ground', a, b, wall: kw === 'tường' })
    } else {
      const filled = /^([A-Z_][A-Za-z0-9_'-]*)\s+tô(?:\s+(.*))?$/u.exec(l)
      if (filled) {
        const names = splitNames(filled[1], pts, line)
        if (names.length < 3) throw new Error(`Dòng ${line}: đa giác cần ít nhất 3 điểm, vd. ABC`)
        cmds.push({ t: 'poly', names, fill: parseFill(filled[2], line) })
        return
      }
      // danh sách đoạn / đa giác: "AB, BC" hoặc "ABCD"
      for (const part of head.split(/[,;]\s*|\s+/).filter(Boolean)) {
        const dashed = part.endsWith('*')
        const n = splitNames(part.replace(/\*$/, ''), pts, line)
        if (n.length === 2) cmds.push({ t: 'seg', a: n[0], b: n[1], dashed })
        else if (n.length >= 3) cmds.push({ t: 'poly', names: n })
        else throw new Error(`Dòng ${line}: không hiểu "${part}"`)
      }
    }
  })
  return { pts, cmds }
}

type Shape = Extract<Cmd, { t: 'shape' }>
const cornerRadius = (c: Shape) => c.rounded ? Math.min(c.rx, c.ry) * 0.35 : 0

/** Khoảng cách từ tâm tới mép hình theo hướng (dx, dy). */
function shapeEdge(c: Shape, dx: number, dy: number): number {
  if (c.kind === 'thoi') return 1 / (Math.abs(dx) / c.rx + Math.abs(dy) / c.ry)
  if (c.kind !== 'hộp') return 1 / Math.hypot(dx / c.rx, dy / c.ry)
  const x = Math.abs(dx)
  const y = Math.abs(dy)
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
  for (const ch of s.normalize('NFD').replace(/\p{Mark}/gu, '')) {
    if (/[ilIftjr\s.,;:!'|]/.test(ch)) width += 0.4
    else if (/[A-LN-VX-Z]/.test(ch)) width += 0.85
    else if (/[a-ln-vx-z0-9đ]/.test(ch)) width += 0.6
    else width += 1
  }
  return width
}

export function renderSceneSvg(spec: SceneSpec, desc: string): { svg: string; width: number; height: number } {
  const { pts, cmds } = parseScene(spec.text)
  const px = [...pts.values()].map((p) => p[0])
  const py = [...pts.values()].map((p) => p[1])
  // cạnh của góc mà AI quên vẽ (thiếu "đất AB"…) thì tự vẽ, không thì cung góc lơ lửng
  const drawn = (a: string, b: string) =>
    cmds.some((c) =>
      (c.t === 'seg' || c.t === 'ground') ? (c.a === a && c.b === b) || (c.a === b && c.b === a)
      : c.t === 'poly' && c.names.some((n, i) => { const m = c.names[(i + 1) % c.names.length]; return (n === a && m === b) || (n === b && m === a) }))
  for (const c of [...cmds]) {
    if (c.t !== 'angle' && c.t !== 'right') continue
    for (const x of [c.a, c.b]) if (!drawn(c.o, x)) cmds.push({ t: 'seg', a: c.o, b: x, dashed: false })
  }
  // thang (vật nghiêng) mà AI quên vẽ tường: đỉnh thang nằm thẳng trên một điểm có tên ở mặt đất → tự dựng tường + góc vuông,
  // không thì thang dựa vào khoảng không
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
  // nhiều góc chung một đỉnh (vd. góc nâng 40° và 50° cùng nhìn từ D): góc nhỏ ở trong, góc lớn ở ngoài, bán kính tăng dần
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

  // hình vật: hình chữ nhật (đơn vị của hình) — chân giữa cạnh dưới, xoay theo hướng chân → đỉnh
  const ptSpan = Math.max(Math.max(...py) - Math.min(...py), (Math.max(...px) - Math.min(...px)) * 0.5) || 1
  // tâm các điểm có tên (điểm ẩn "_" thường là mép mặt đất kéo dài, không tính)
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
      // vật nghiêng (thang dựa tường): thân lệch ra phía ngoài hình
      // (đặt giữa thì thò vào tường, cắm xuống đất); vật đứng thẳng vẫn đặt giữa điểm chân
      // nhà rộng (toà nhà, ngôi nhà…): mặt nhà nằm đúng trên đoạn, thân lùi ra sau — tia nhìn chạm góc mái
      const wide = EDGE_ANCHOR.has(c.id)
      const shifted = Boolean(c.b) && (Math.abs(u[0]) > 0.09 || wide)
      if (shifted) {
        const mx = (foot[0] + top[0]) / 2 - ptCx
        const my = (foot[1] + top[1]) / 2 - ptCy
        let sgn = mx * n[0] + my * n[1] >= 0 ? 1 : -1
        // có góc ở chân/đỉnh vật nhận đoạn này làm cạnh: lệch về phía không có góc, kẻo thân vật đè cung góc
        const ang = cmds.find((g): g is Extract<Cmd, { t: 'angle' }> =>
          g.t === 'angle' && (g.o === c.a || g.o === c.b) && [g.a, g.b].includes(g.o === c.a ? c.b! : c.a))
        if (ang) {
          const o = pts.get(ang.o)!
          const other = pts.get(ang.a === (ang.o === c.a ? c.b : c.a) ? ang.b : ang.a)!
          sgn = (other[0] - o[0]) * n[0] + (other[1] - o[1]) * n[1] >= 0 ? -1 : 1
        }
        // thang: lệch nửa bề rộng (ảnh thường vẽ phối cảnh, thuôn dần; lệch hẳn một mép thì hở khỏi tường)
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
  const shapes = cmds.filter((c): c is Shape => c.t === 'shape')
  for (const c of shapes) {
    const [x, y] = pts.get(c.o)!
    xs.push(x - c.rx, x + c.rx)
    ys.push(y - c.ry, y + c.ry)
  }
  const arcs = cmds.filter((c) => c.t === 'arc')
  for (const c of arcs) {
    const center = pts.get(c.o)!
    const angles = [c.start, c.start + c.sweep]
    // Cực trị theo hai trục chỉ xuất hiện ở đầu mút hoặc góc phần tư nằm trên cung.
    for (const angle of [0, 90, 180, 270]) {
      if (wrapDegrees(angle - c.start) <= c.sweep) angles.push(angle)
    }
    for (const angle of angles) {
      const [x, y] = arcPoint(center, c.r, angle)
      xs.push(x)
      ys.push(y)
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
    const point = c.t === 'arc' ? arcPoint(center, c.r, mid) : center
    const [dx, dy] = c.t === 'arc' ? direction(mid) : [0, 0]
    return [{ point, dx: 14 * dx, dy: -14 * dy, id: `free:${c.o}:${i}`, lines, size, step: size * 1.2, bold: c.t === 'text' && c.bold, solidLabel: c.t === 'shape' && c.fill !== 'none' }]
  })
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const freeLayout = shapes.length > 0 || arcs.length > 0 || cmds.some((c) => c.t === 'text' || (c.t === 'seg' && c.arrow))
  const spanX = maxX - minX || (freeLayout ? 0 : 1)
  const spanY = maxY - minY || (freeLayout ? 0 : 1)
  const k = spanX || spanY ? Math.min(300 / spanX, 230 / spanY) : 1
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
  // tâm hình: để đặt kích thước / nhãn điểm ra phía ngoài
  const cx = [...pts.values()].reduce((s, p) => s + S(p)[0], 0) / pts.size
  const cy = [...pts.values()].reduce((s, p) => s + S(p)[1], 0) / pts.size

  let b = `<defs><marker id="scarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`
  const line = (p: P, q: P, extra = '') => `<path d="M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}" stroke="#111" fill="none" ${extra}/>`
  const text = (x: number, y: number, s: string, anchor = 'middle', size = 15, lbl?: string) =>
    `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="${size}"${lbl ? ` data-lbl="${lbl}"` : ''} text-anchor="${anchor}">${esc(s)}</text>`
  /** pháp tuyến đơn vị của PQ hướng ra xa tâm hình */
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

  // mặt đất / tường trước (nằm dưới các nét khác)
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

  // hình vật: trên mặt đất, dưới các nét đo (đoạn, góc, kích thước vẫn đọc được)
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

  const filledPolys = cmds.filter((c) => c.t === 'poly' && c.fill)
  const baseLine = (c: Cmd) => c.t === 'seg' || (c.t === 'poly' && !c.fill)
  const ordered = filledPolys.length ? [
    ...cmds.filter(baseLine), ...filledPolys, ...cmds.filter((c) => !baseLine(c) && c.t !== 'poly'),
  ] : cmds
  for (const c of ordered) {
    if (c.t === 'poly') {
      const d = c.names.map((n, i) => `${i ? 'L' : 'M'}${f1(at(n)[0])} ${f1(at(n)[1])}`).join('') + 'Z'
      b += `<path d="${d}" stroke="#111" fill="${c.fill ?? 'none'}" stroke-width="1.6" stroke-linejoin="round"/>`
    } else if (c.t === 'seg') {
      let p = at(c.a)
      let q = at(c.b)
      const style = c.dashed ? 'stroke-width="1.2" stroke-dasharray="5 4"' : 'stroke-width="1.6"'
      const from = shapes.filter((s) => s.o === c.a)
      const to = shapes.filter((s) => s.o === c.b)
      if (c.arrow || (from.length && to.length)) {
        const len = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (!len) continue
        const dx = (q[0] - p[0]) / len
        const dy = (q[1] - p[1]) / len
        // Đầu mũi tên dừng ở mép khi B là tâm hình, để phần tô không che đầu nhọn.
        const start = Math.max(0, ...from.map((s) => shapeEdge(s, dx, dy) * k))
        const end = Math.max(0, ...to.map((s) => shapeEdge(s, dx, dy) * k))
        if (start + end >= len) continue
        p = [p[0] + dx * start, p[1] + dy * start]
        q = [q[0] - dx * end, q[1] - dy * end]
      }
      b += line(p, q, style + (c.arrow ? ' marker-end="url(#scarr)"' : ''))
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
      // cung nhỏ (< 180°)
      let d = a2 - a1
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      a2 = a1 + d
      // góc thứ i chung đỉnh: cung to dần 16px, nhãn đặt ngoài cung của chính nó
      const i = ring.get(c) ?? 0
      const r = 22 + i * 16
      const sweep = d > 0 ? 1 : 0
      b += `<path d="M${f1(o[0] + r * Math.cos(a1))} ${f1(o[1] + r * Math.sin(a1))}A${r} ${r} 0 0 ${sweep} ${f1(o[0] + r * Math.cos(a2))} ${f1(o[1] + r * Math.sin(a2))}" stroke="#111" fill="none" stroke-width="1"/>`
      if (c.text) {
        const mid = a1 + d / 2
        const rl = r + 14
        b += text(o[0] + rl * Math.cos(mid), o[1] + rl * Math.sin(mid) + 5, c.text, 'middle', 14, `ang:${c.a}${c.o}${c.b}`)
      }
    } else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      const off = 18
      const p2: P = [p[0] + n[0] * off, p[1] + n[1] * off]
      const q2: P = [q[0] + n[0] * off, q[1] + n[1] * off]
      // vạch gióng
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
      // vật nghiêng nằm dọc đoạn này (thang) lệch ra phía ngoài: ghi nhãn phía trong cho khỏi đè hình
      const alongSeg = (s: (typeof sprites)[number]) =>
        s.c.b !== undefined && ((s.c.a === c.a && s.c.b === c.b) || (s.c.a === c.b && s.c.b === c.a))
      // vật lệch ra ngoài (thang, toà nhà): nhãn sang phía trong; vật đặt giữa (cây, cột): nhãn ra ngoài, quá bề rộng vật
      const along = sprites.find(alongSeg)
      let off = 14
      if (along?.shifted) n = [-n[0], -n[1]]
      else if (along) off += along.hw * k
      b += text((p[0] + q[0]) / 2 + n[0] * off, (p[1] + q[1]) / 2 + n[1] * off + 5, c.text, Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle', 15, `lbl:${c.a}${c.b}`)
    }
  }

  for (const c of arcs) {
    const center = pts.get(c.o)!
    const point = (angle: number) => S(arcPoint(center, c.r, angle)).join(' ')
    const start = point(c.start)
    const radius = c.r * k
    // Trục y của SVG hướng xuống nên sweep-flag 0 đi ngược chiều kim đồng hồ.
    const turn = (end: string, large: number) => `A${radius} ${radius} 0 ${large} 0 ${end}`
    const full = c.sweep === 360
    const curve = full ? turn(point(c.start + 180), 0) + turn(start, 0) : turn(point(c.start + c.sweep), Number(c.sweep > 180))
    // SVG tự khép vùng tô theo dây cung, không vẽ nét trên dây.
    const d = c.kind === 'quạt' && !full ? `M${S(center).join(' ')}L${start}${curve}Z` : `M${start}${curve}${full ? 'Z' : ''}`
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    b += `<path d="${d}" stroke="#111" fill="${c.fill}" stroke-width="1.6" stroke-linejoin="round"${dash}/>`
  }
  for (const c of shapes) {
    const [x, y] = at(c.o)
    const rx = c.rx * k
    const ry = c.ry * k
    const style = `fill="${c.fill}" stroke="#111" stroke-width="1.2"${c.dashed ? ' stroke-dasharray="5 4"' : ''}`
    if (c.kind === 'tròn') b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rx}" ${style}/>`
    else if (c.kind === 'elip') b += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" ${style}/>`
    else if (c.kind === 'thoi') b += `<path d="M${f1(x - rx)} ${f1(y)}L${f1(x)} ${f1(y - ry)}L${f1(x + rx)} ${f1(y)}L${f1(x)} ${f1(y + ry)}Z" ${style}/>`
    else b += `<rect x="${f1(x - rx)}" y="${f1(y - ry)}" width="${2 * rx}" height="${2 * ry}" rx="${cornerRadius(c) * k}" ${style}/>`
  }
  for (const c of labels) {
    const [px, py] = S(c.point)
    const x = px + c.dx
    const y = py + c.dy
    const start = y + c.size * 0.32 - (c.lines.length - 1) * c.step / 2
    const textLine = (s: string) => richTextToSvg(/^(?:[A-Z][a-z]?\d*)+$/.test(s) ? subscript(s) : s)
    const body = c.lines.length === 1 ? textLine(c.lines[0]) : c.lines.map((s, i) =>
      `<tspan x="${f1(x)}" y="${f1(start + i * c.step)}">${textLine(s)}</tspan>`).join('')
    const style = c.solidLabel ? ' stroke="none"' : c.bold ? ' font-weight="bold"' : ''
    b += `<text x="${f1(x)}" y="${f1(start)}" ${FAM} font-size="${c.size}"${style} data-lbl="${c.id}" text-anchor="middle">${body}</text>`
  }

  // các nét đã vẽ, để nhãn điểm né (đoạn, cạnh đa giác, mặt đất, mũi tên kích thước)
  const segs: [P, P][] = []
  for (const c of cmds) {
    if (c.t === 'seg' || c.t === 'ground') segs.push([at(c.a), at(c.b)])
    else if (c.t === 'arc' && c.kind === 'quạt' && c.sweep < 360) {
      const center = pts.get(c.o)!
      const o = S(center)
      segs.push([o, S(arcPoint(center, c.r, c.start))], [o, S(arcPoint(center, c.r, c.start + c.sweep))])
    }
    else if (c.t === 'right') {
      // kí hiệu góc vuông: hai cạnh ô vuông 10px
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
    }
    else if (c.t === 'poly') c.names.forEach((n, i) => segs.push([at(n), at(c.names[(i + 1) % c.names.length])]))
    else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      segs.push([[p[0] + n[0] * 18, p[1] + n[1] * 18], [q[0] + n[0] * 18, q[1] + n[1] * 18]])
    }
  }
  // khung hình vật (người, cột cờ…): nhãn điểm né ra, không đè lên hình
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
    // điểm nằm trên mặt đất / tường: đẩy nhãn sang phía không gạch chéo
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
    // phía có gạch chéo của mặt đất / tường mà điểm nằm trên: không đặt nhãn vào đó
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
      // tâm chữ (chữ cao ~11px, rộng ~9px/kí tự); vòng ngoài xa hơn, phạt nhẹ
      const rad = k < 8 ? 14 : k < 16 ? 22 : 30
      const lx = x + ux * rad
      const ly = y + uy * rad
      let score = -(ux * dx + uy * dy) * 2 + (k < 8 ? 0 : k < 16 ? 4 : 8)
      for (const n of hatch) if (ux * n[0] + uy * n[1] > 0.2) score += 40
      for (const sg of segs) {
        const d = distSeg(lx, ly, sg)
        if (d < 10) score += (10 - d) * 3
      }
      for (const [px, py] of placed) {
        const d = Math.hypot(lx - px, ly - py)
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
      { code: 'AB, BC', what: 'Đoạn thẳng' },
      { code: 'ABCD', what: 'Đa giác khép kín' },
      { code: 'đứt MN', what: 'Đoạn nét đứt (nếp gấp, tia nhìn)' },
    ],
  },
  {
    group: 'Kí hiệu',
    items: [
      { code: 'kích thước AB "15 cm"', what: 'Mũi tên hai đầu, ghi chữ, đặt phía ngoài hình' },
      { code: 'góc ABC "60°"', what: 'Cung góc tại đỉnh B' },
      { code: 'vuông ABC', what: 'Kí hiệu góc vuông tại B' },
      { code: 'nhãn AB "?"', what: 'Chữ cạnh đoạn AB (cạnh cần tìm)' },
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
    group: 'Hình tự do',
    items: [
      { code: 'tròn O 0.6 "Nhãn"', what: 'Vòng tròn tâm O, bán kính 0.6; thêm đứt, tô <màu>' },
      { code: 'elip O 1 0.6 đứt', what: 'Elip tâm O, hai bán kính; thêm nhãn, tô <màu>' },
      { code: 'hộp O 2 1 "Nhãn" bo tô xanh', what: 'Hộp tâm O, rộng 2, cao 1; thêm bo, đứt, tô <màu> (tên hoặc #rrggbb)' },
      { code: 'thoi O 3 1.5 "i ≤ n?"', what: 'Hình thoi tâm O, rộng 3, cao 1.5' },
      { code: 'cung O 4 0 60 "Nhãn"', what: 'Cung tâm O, bán kính 4, từ 0° đến 60° ngược chiều kim đồng hồ; thêm đứt, tô <màu>' },
      { code: 'quạt O 4 0 60 tô vàng', what: 'Hình quạt tâm O với hai bán kính; thêm đứt, tô <màu>' },
      { code: 'ABC tô đỏ', what: 'Đa giác tô màu (tên hoặc #rrggbb)' },
      { code: 'chữ O "Dòng 1\\nDòng 2" to đậm', what: 'Chữ căn giữa tại O; thêm to, đậm' },
      { code: 'mũi tên AB / mũi tên đứt AB', what: 'Mũi tên từ A đến B' },
    ],
  },
]
