import { resolveSpriteId } from '../objects'
import { DEFAULT_OBLIQUE_CAMERA, project3d, type Camera3D, type Mesh3dKind, type P3 } from '../scene3d'
import type { P, ShapeKind, StyleOpts, RegionPart, Cmd, StyleCaps } from './types'
import { NUM, toNum, FREE, QUOTED, SIZE, parseHexColor, tokenizeArgs, readStyleToken, parseStyleList } from './style'
import { splitNames, parseSweep } from './geom'

export const STYLE_START = /^(tô|màu|không|ẩn|đứt|dày|mảnh|nền|mờ)$/u

export function parseRegionPart(raw: string, pts: Map<string, P>, line: number): RegionPart {
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

export function parseFreeCmd(rawKind: string, rest: string, pts: Map<string, P>, line: number): Cmd {
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

  if (kind === 'góc nhìn') {
    const first = args.shift()
    if (!first) return fail('góc nhìn cần "xiên [dx dy]" hoặc "<az> <el>"')
    if (first === 'xiên') {
      if (!args.length) return { t: 'view', cam: DEFAULT_OBLIQUE_CAMERA }
      const dx = readNum('độ lệch x')
      const dy = args.length ? readNum('độ lệch y') : DEFAULT_OBLIQUE_CAMERA.dy
      if (args.length) fail(`tuỳ chọn góc nhìn không hợp lệ "${args[0]}"`)
      return { t: 'view', cam: { mode: 'oblique', dx, dy } }
    }
    args.unshift(first)
    const az = readNum('góc phương vị')
    const el = readNum('góc ngẩng')
    if (args.length) fail(`tuỳ chọn góc nhìn không hợp lệ "${args[0]}"`)
    return { t: 'view', cam: { mode: 'ortho', az, el } }
  }

  if (kind === 'mặt') {
    const arg = args.shift()
    if (!arg) return fail('mặt cần danh sách điểm, vd. A-B-C-D')
    const names = splitNames(arg, pts, line)
    if (names.length < 3) return fail('mặt cần ít nhất 3 điểm')
    const opts = parseStyleList(args, line, 'mặt', { fill: true, stroke: true, weight: true, dashed: true })
    return {
      t: 'face',
      names,
      fill: opts.fill ?? '#ffffff',
      fillOpacity: opts.fillOpacity,
      stroke: opts.stroke,
      weight: opts.weight,
      dashed: Boolean(opts.dashed),
    }
  }

  if (kind === 'lưới 3d') {
    let meshKind: Mesh3dKind | undefined
    const k0 = args.shift()
    if (k0 === 'tam' && args[0] === 'giác') { args.shift(); meshKind = 'tam giác' }
    else if (k0 === 'nửa' && args[0] === 'tròn') { args.shift(); meshKind = 'nửa tròn' }
    else if (k0 === 'vuông' || k0 === 'parabol') meshKind = k0
    if (!meshKind) return fail('kiểu lưới 3d phải là tam giác, nửa tròn, vuông hoặc parabol')
    const o = args.shift()
    if (!o || SIZE.test(o)) return fail('thiếu điểm đặt lưới 3d')
    if (!pts.has(o)) return fail(`chưa khai báo điểm "${o}"`)
    const r = readNum('bán kính', true)
    const h = readNum('chiều cao', true)
    let steps = 16
    let cam: Camera3D | undefined
    const opts: StyleOpts = {}
    for (let i = 0; i < args.length;) {
      const opt = args[i]
      if (opt === 'bước') {
        const v = args[i + 1]
        if (!v || !SIZE.test(v) || toNum(v) < 4) fail('số bước lưới 3d phải >= 4')
        steps = toNum(v)
        i += 2; continue
      }
      if (opt === 'góc') {
        if (args[i + 1] === 'xiên') {
          const v1 = args[i + 2]
          const v2 = args[i + 3]
          if (v1 && SIZE.test(v1) && v2 && SIZE.test(v2)) {
            cam = { mode: 'oblique', dx: toNum(v1), dy: toNum(v2) }
            i += 4
          } else {
            cam = DEFAULT_OBLIQUE_CAMERA
            i += 2
          }
          continue
        }
        const v1 = args[i + 1]
        const v2 = args[i + 2]
        if (!v1 || !SIZE.test(v1) || !v2 || !SIZE.test(v2)) fail('góc lưới 3d cần 2 số <az> <el>')
        cam = { mode: 'ortho', az: toNum(v1), el: toNum(v2) }
        i += 3; continue
      }
      const used = readStyleToken(args, i, line, opts, { fill: true, stroke: true, weight: true, dashed: true })
      if (!used) fail(`tuỳ chọn lưới 3d không hợp lệ "${opt}"`)
      i += used
    }
    return {
      t: 'mesh3d',
      meshKind,
      o,
      r,
      h,
      steps,
      cam,
      fill: opts.fill ?? '#ffffff',
      fillOpacity: opts.fillOpacity,
      stroke: opts.stroke,
      weight: opts.weight,
      dashed: Boolean(opts.dashed),
    }
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

export function parseScene(text: string): { pts: Map<string, P>; cmds: Cmd[]; depths: Map<string, number>; cam?: Camera3D } {
  const pts = new Map<string, P>()
  const pts3 = new Map<string, P3>()
  const depths = new Map<string, number>()
  const cmds: Cmd[] = []
  const lines = text.normalize('NFC').split('\n')
  // lượt 1: điểm (3D đọc trước 2D; để lệnh viết trước điểm vẫn đọc được)
  const point3Re = new RegExp(String.raw`([A-Z_][A-Za-z0-9_']*)\s*\(\s*${NUM}\s*;\s*${NUM}\s*;\s*${NUM}\s*\)`, 'g')
  const pointRe = new RegExp(String.raw`([A-Z_][A-Za-z0-9_']*)\s*\(\s*${NUM}\s*;\s*${NUM}\s*\)`, 'g')
  const anyPointRe = new RegExp(`${point3Re.source}|${pointRe.source}`, 'g')
  const clean = (l: string) => l.trim().replace(/^[,;]+|[,;]+$/g, '').trim()
  const quotedOrPoint = new RegExp(`${QUOTED.source}|${anyPointRe.source}`, 'g')
  const commands = lines.map((l) => clean(l.replace(quotedOrPoint, (m) => /^["“]/.test(m) ? m : '')))
  const free = commands.map((l) => FREE.exec(l)?.[0])
  lines.forEach((l, idx) => {
    const source = free[idx] ? l.replace(QUOTED, ' ') : l
    for (const m of source.matchAll(point3Re)) {
      pts3.set(m[1], [toNum(m[2]), toNum(m[3]), toNum(m[4])])
      if (!pts.has(m[1])) pts.set(m[1], [0, 0])
    }
    const rest2d = source.replace(point3Re, ' ')
    for (const m of rest2d.matchAll(pointRe)) pts.set(m[1], [toNum(m[2]), toNum(m[3])])
  })
  const hasRealFree = free.some((f) => Boolean(f) && f !== 'khung' && f !== 'góc nhìn')
  if (pts.size < 2 && !hasRealFree) throw new Error('Cần ít nhất 2 điểm, vd. A(0; 0) B(4; 0)')

  const cmdLines: number[] = [] // dòng nguồn của từng lệnh, để báo lỗi trộn điểm 2D/3D
  lines.forEach((raw, idx) => {
    const line = idx + 1
    while (cmdLines.length < cmds.length) cmdLines.push(idx)
    const kind = free[idx]
    if (kind) {
      cmds.push(parseFreeCmd(kind, commands[idx].slice(kind.length).trim(), pts, line))
      return
    }
    const l = clean(raw.replace(anyPointRe, ''))
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
  while (cmdLines.length < cmds.length) cmdLines.push(lines.length)
  if (pts3.size > 0) {
    cmds.forEach((c, i) => {
      const names = c.t === 'seg' || c.t === 'dim' || c.t === 'label' || c.t === 'ground' ? [c.a, c.b]
        : c.t === 'poly' || c.t === 'curve' || c.t === 'face' ? c.names
        : c.t === 'angle' || c.t === 'right' ? [c.a, c.o, c.b] : []
      const n3 = names.filter((n) => pts3.has(n))
      if (n3.length && n3.length < names.length) {
        const n2 = names.find((n) => !pts3.has(n))
        throw new Error(`Dòng ${cmdLines[i]}: "${n2}" là điểm 2D, "${n3[0]}" là điểm 3D; khai báo cùng kiểu toạ độ`)
      }
    })
  }
  const viewCmd = [...cmds].reverse().find((c): c is Extract<Cmd, { t: 'view' }> => c.t === 'view')
  const cam = viewCmd?.cam
  if (pts3.size > 0) {
    const activeCam = cam ?? DEFAULT_OBLIQUE_CAMERA
    for (const [name, p3] of pts3) {
      const { p2, depth } = project3d(p3, activeCam)
      pts.set(name, p2)
      depths.set(name, depth)
    }
  }
  return { pts, cmds, depths, cam }
}
