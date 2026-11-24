import type { Weight, StyleOpts, StyleCaps } from './types'

export const FAM = `font-family="'Times New Roman',serif"`
/** vật rộng: đặt mặt (mép gần) lên đoạn thay vì đặt giữa */
export const EDGE_ANCHOR = new Set(['building', 'house', 'tent', 'water_tank'])
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const f1 = (n: number) => Math.round(n * 10) / 10

export const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`
export const toNum = (s: string) => Number(s.replace(',', '.'))
export const FREE = /^(khung|góc\s+nhìn|lưới\s+3d|mặt|cung\s+elip|nửa\s+tròn|cong|vùng|nút|chấm|mũi\s+tên\s+hai\s+đầu|hai\s+đầu|mũi\s+tên|tròn|elip|hộp|thoi|cung|quạt|chữ)(?=\s|$)/u
export const QUOTED = /"([^"]*)"|“([^”]*)”/g
export const SIZE = new RegExp(`^${NUM}$`)
export const COLORS = new Map(Object.entries({
  đen: '#111111', đỏ: '#d62828', xanh: '#2563eb', lam: '#0284c7', lục: '#15803d', vàng: '#eab308',
  cam: '#ea580c', tím: '#7e22ce', hồng: '#db2777', xám: '#6b7280', nâu: '#92400e', rêu: '#7c8a56', trắng: '#ffffff',
}))

export function parseHexColor(value: string | undefined, line: number, missingMsg: string, invalidMsg: string): string {
  const name = value?.toLowerCase()
  if (!name) throw new Error(`Dòng ${line}: ${missingMsg}`)
  const hex = COLORS.get(name) ?? name
  if (!/^#[\da-f]{6}$/.test(hex)) throw new Error(`Dòng ${line}: ${invalidMsg} "${name}"`)
  return hex
}

export function parseFill(value: string | undefined, line: number, mode: 'pastel' | 'solid' | 'shade' | 'sphere' | 'hatch' = 'pastel', hatchAngle = 45): string {
  const hex = parseHexColor(value, line, 'thiếu màu tô', 'màu tô không hợp lệ')
  if (mode === 'solid') return hex
  if (mode === 'shade') return `url(#scgr-${hex.slice(1)})`
  if (mode === 'sphere') return `url(#scrg-${hex.slice(1)})`
  if (mode === 'hatch') return `url(#schat-${hex.slice(1)}${hatchAngle === 45 ? '' : `-${hatchAngle}`})`
  // Pha với trắng để màu vẫn che kín đoạn nối và chữ đen dễ đọc.
  const channels = hex.slice(1).match(/../g)!
  return '#' + channels.map((s) => Math.round(255 * 0.8 + parseInt(s, 16) * 0.2).toString(16)).join('')
}

export function mixHex(hex: string, target: [number, number, number], t: number): string {
  const ch = hex.slice(1).match(/../g)!.map((s) => parseInt(s, 16))
  return '#' + ch.map((v, i) => Math.round(v * (1 - t) + target[i] * t).toString(16).padStart(2, '0')).join('')
}

export function shadeGradientDef(hex: string): string {
  const id = `scgr-${hex.slice(1)}`
  const c0 = mixHex(hex, [255, 255, 255], 0.22)
  const c1 = mixHex(hex, [255, 255, 255], 0.38)
  const c2 = hex
  const c3 = mixHex(hex, [0, 0, 0], 0.28)
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c0}"/><stop offset="28%" stop-color="${c1}"/><stop offset="72%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></linearGradient>`
}

export function sphereGradientDef(hex: string): string {
  const id = `scrg-${hex.slice(1)}`
  const c0 = mixHex(hex, [255, 255, 255], 0.45)
  const c1 = hex
  const c2 = mixHex(hex, [0, 0, 0], 0.32)
  const c3 = mixHex(hex, [0, 0, 0], 0.48)
  return `<radialGradient id="${id}" cx="35%" cy="30%" r="68%" fx="32%" fy="28%"><stop offset="0%" stop-color="${c0}"/><stop offset="45%" stop-color="${c1}"/><stop offset="85%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></radialGradient>`
}

export function hatchPatternDef(hex: string, angle = 45): string {
  const id = `schat-${hex.slice(1)}${angle === 45 ? '' : `-${angle}`}`
  return `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="6" stroke="${hex}" stroke-width="1.2"/></pattern>`
}

export function tokenizeArgs(rest: string, line: number): string[] {
  const parts = [...rest.matchAll(/(?:^|\s+)("[^"]*"|“[^”]*”|[^\s"“”]+)(?=\s|$)/gu)]
  if (parts.map((m) => m[0]).join('') !== rest) {
    throw new Error(`Dòng ${line}: nhãn cần đặt trong dấu ngoặc kép, cách tuỳ chọn bằng khoảng trắng`)
  }
  return parts.map((m) => m[1])
}

/** Đọc 1 tuỳ chọn kiểu dáng tại args[i], trả về số token đã tiêu thụ (0 nếu không khớp). */
export function readStyleToken(args: string[], i: number, line: number, opts: StyleOpts, caps: StyleCaps): number {
  const opt = args[i]
  if (caps.dashed && opt === 'đứt') { opts.dashed = true; return 1 }
  if (caps.rail && opt === 'ray') { opts.rail = true; return 1 }
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
      let idx = i + 2
      let angle = 45
      if (args[idx] === 'đứng') { angle = 0; idx++ }
      else if (args[idx] === 'ngang') { angle = 90; idx++ }
      else if (args[idx] === 'chéo') { angle = 45; idx++ }
      const cand = args[idx]
      const isColor = Boolean(cand && (COLORS.has(cand.toLowerCase()) || /^#[\da-f]{6}$/i.test(cand)))
      opts.fill = parseFill(isColor ? cand : '#111111', line, 'hatch', angle)
      return isColor ? idx - i + 1 : idx - i
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

export function parseStyleList(args: string[], line: number, kindLabel: string, caps: StyleCaps): StyleOpts {
  const opts: StyleOpts = {}
  for (let i = 0; i < args.length;) {
    const used = readStyleToken(args, i, line, opts, caps)
    if (!used) throw new Error(`Dòng ${line}: tuỳ chọn ${kindLabel} không hợp lệ "${args[i]}"`)
    i += used
  }
  return opts
}

export function strokeWidthAttr(weight: Weight | undefined, base: number): number {
  if (weight === 'thin') return 0.9
  if (weight === 'thick') return 2.2
  return base
}
