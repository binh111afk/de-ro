/**
 * Hình đếm tiểu học và đồng hồ kim.
 * - objects: ghép từ hình rời trong kho (figureSprites): "3 rổ, mỗi rổ 5 củ cà rốt" = vẽ rổ 3 lần,
 *   xếp đúng 5 củ vào mỗi rổ (thành trước của rổ che chân củ), số lượng luôn đúng vì app tự xếp.
 * - clock: đồng hồ kim vẽ theo giờ, phút.
 */
import { DYNAMIC_ID, dynamicId, ensureSprites, getSprite, loadSprites } from './figureSprites'
import { CONTAINERS, OBJECTS, OBJECT_ALIASES } from './objectsCatalog'

// công cụ vẽ được nạp thì nạp luôn kho hình (nơi gọi vẽ chính thức đợi loadSprites trước)
void loadSprites().catch(() => {})

export interface ObjectsGroup {
  /** id đồ vật trong kho (apple, carrot…) hoặc kho dùng chung (x-teapot); bỏ trống khi chỉ vẽ đồ chứa có nhãn */
  item?: string
  /** tên tiếng Việt của đồ vật kho dùng chung (hiện trong hộp sửa, ô thay thế) */
  itemName?: string
  /** số đồ vật trong mỗi đồ chứa (hoặc mỗi nhóm khi không có đồ chứa) */
  each: number
  /** id đồ chứa (basket, plate…); không có thì vẽ đồ vật thành nhóm rời */
  container?: string
  /** số đồ chứa / số nhóm */
  count: number
  /** chữ ghi trên mỗi đồ chứa (vd "100", "10") hoặc dưới mỗi nhóm */
  label?: string
}

export interface ObjectsSpec {
  groups: ObjectsGroup[]
}

export const OBJECTS_DEFAULT: ObjectsSpec = { groups: [{ container: 'basket', item: 'apple', each: 5, count: 3 }] }

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
const clampInt = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number.isFinite(v) ? v : lo)))

const ITEM_H = 50
const CONT_H = 120
const GAP = 16
const GROUP_GAP = 40
const MAX_W = 640
const PAD = 10

interface Box {
  w: number
  h: number
  /** vẽ tại góc trên trái (x, y) */
  draw: (x: number, y: number) => string
}

function spriteUse(id: string, x: number, y: number, h: number, used: Set<string>): string {
  const sp = getSprite(id)
  if (!sp) return missing(id, x, y, h * 0.9, h)
  used.add(id)
  const s = h / sp.h
  return `<use href="#sp-${id}" transform="translate(${f1(x)} ${f1(y)}) scale(${+s.toFixed(4)})"/>`
}

const spriteW = (id: string | undefined, h: number) => {
  const sp = id ? getSprite(id) : null
  return sp ? (sp.w * h) / sp.h : h * 0.9
}

const nameOf = new Map<string, string>()

function missing(id: string, x: number, y: number, w: number, h: number) {
  const name = OBJECTS[id] ?? CONTAINERS[id]?.name ?? nameOf.get(id) ?? id.replace(/^x-/, '').replace(/-/g, ' ')
  return (
    `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="6" fill="#fff" stroke="#888" stroke-dasharray="4 3"/>` +
    `<text x="${f1(x + w / 2)}" y="${f1(y + h / 2 + 4)}" text-anchor="middle" font-size="11" fill="#666" ${FAM}>${esc(name)}</text>`
  )
}

function labelTag(text: string, cx: number, cy: number) {
  const w = text.length * 11 + 16
  return (
    `<rect x="${f1(cx - w / 2)}" y="${f1(cy - 13)}" width="${f1(w)}" height="26" rx="4" fill="#fff" stroke="#111" stroke-width="1.5"/>` +
    `<text x="${f1(cx)}" y="${f1(cy + 6.5)}" text-anchor="middle" font-size="19" font-weight="bold" fill="#111" ${FAM}>${esc(text)}</text>`
  )
}

/** chia n vật thành các hàng, hàng sau ít hơn hàng trước */
function splitRows(n: number, rows: number) {
  const out: number[] = []
  let left = n
  for (let r = rows; r > 0; r--) {
    const k = Math.floor(left / r)
    out.push(k)
    left -= k
  }
  return out // [sau … trước]
}

let clipSeq = 0

/** một đồ chứa có `each` đồ vật */
function containerBox(g: ObjectsGroup, used: Set<string>): Box {
  const meta = CONTAINERS[g.container!]
  const CH = CONT_H * (meta?.size ?? 1)
  const CW = spriteW(g.container, CH)
  const extraTop = g.item && g.each > 0 ? CH * 0.4 : 0 // đồ vật nhô lên trên miệng
  return {
    w: CW,
    h: CH + extraTop,
    draw: (x, y0) => {
      const y = y0 + extraTop
      const sp = getSprite(g.container!)
      if (!sp || !meta) return missing(g.container!, x, y, CW, CH)
      const MX = x + meta.mouth.cx * CW
      const MY = y + meta.mouth.cy * CH
      const RX = meta.mouth.rx * CW
      const RY = meta.mouth.ry * CH
      let out = spriteUse(g.container!, x, y, CH, used)
      if (g.item && g.each > 0) {
        const n = g.each
        const inside = meta.placement === 'inside'
        const rows = inside ? (n <= 4 ? 1 : n <= 10 ? 2 : 3) : n <= 3 ? 1 : n <= 8 ? 2 : 3
        const counts = splitRows(n, rows)
        const per = Math.max(...counts)
        const ia = spriteW(g.item, 100) / 100
        let iw = (2 * RX * 0.92) / (per * 0.85 + 0.15)
        let ih = iw / ia
        const maxH = CH * (inside ? 0.62 : 0.4)
        if (ih > maxH) {
          ih = maxH
          iw = ih * ia
        }
        counts.forEach((k, j) => {
          const t = rows === 1 ? 0.6 : j / (rows - 1)
          const base = inside ? MY - RY * 0.25 + t * RY * 0.95 : rows === 1 ? MY + RY * 0.15 : MY - RY * 0.3 + t * RY * 0.75
          const bottom = base + ih * (inside ? 0.32 : 0.04)
          const step = iw * 0.85
          const rowW = iw + step * (k - 1)
          for (let i = 0; i < k; i++) out += spriteUse(g.item!, MX - rowW / 2 + i * step, bottom - ih, ih, used)
        })
        if (inside) {
          // thành trước của rổ: vẽ lại đồ chứa, chỉ giữ phần dưới mép trước của miệng
          const id = `oc${++clipSeq}`
          const ey = MY - meta.rim * CH
          let d = `M${f1(x + CW + 4)} ${f1(y + CH + 4)}L${f1(x + CW + 4)} ${f1(ey)}`
          for (let s = 0; s <= 24; s++) {
            const a = (Math.PI * s) / 24
            d += `L${f1(MX + RX * Math.cos(a))} ${f1(ey + RY * Math.sin(a))}`
          }
          d += `L${f1(x - 4)} ${f1(ey)}L${f1(x - 4)} ${f1(y + CH + 4)}Z`
          out += `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${spriteUse(g.container!, x, y, CH, used)}</g>`
        }
      }
      if (g.label) out += labelTag(g.label, MX, y + CH * meta.labelY)
      return out
    },
  }
}

/** một nhóm `each` đồ vật rời, hàng tối đa 5 */
function clusterBox(g: ObjectsGroup, used: Set<string>): Box {
  const n = g.each
  const perRow = n <= 5 ? n : n <= 10 ? Math.ceil(n / 2) : 5
  const rows = Math.ceil(n / perRow)
  const iw = spriteW(g.item, ITEM_H)
  const gap = 4
  const labelH = g.label ? 32 : 0
  const w = perRow * iw + (perRow - 1) * gap
  return {
    w,
    h: rows * ITEM_H + (rows - 1) * gap + labelH,
    draw: (x, y) => {
      let out = ''
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / perRow)
        const c = i % perRow
        const inRow = Math.min(perRow, n - r * perRow)
        const off = ((perRow - inRow) * (iw + gap)) / 2
        out += spriteUse(g.item!, x + off + c * (iw + gap), y + r * (ITEM_H + gap), ITEM_H, used)
      }
      if (g.label) out += labelTag(g.label, x + w / 2, y + rows * ITEM_H + (rows - 1) * gap + 18)
      return out
    },
  }
}

/** chuẩn hoá cấu hình (giới hạn số lượng để hình không vỡ khổ) */
export function normalizeObjects(spec: ObjectsSpec): ObjectsSpec {
  const groups = (Array.isArray(spec.groups) ? spec.groups : [])
    .slice(0, 4)
    // đồ vật không có trong kho: bỏ cả nhóm, đừng vẽ rổ rỗng làm sai số đề hỏi
    .filter((g) => !g.item || OBJECTS[g.item] || DYNAMIC_ID.test(g.item))
    .map((g) => ({
      item: g.item && (OBJECTS[g.item] || DYNAMIC_ID.test(g.item)) ? g.item : undefined,
      itemName: g.item && DYNAMIC_ID.test(g.item) && g.itemName ? String(g.itemName).slice(0, 40) : undefined,
      // túi, gói… (chỉ ghi số) không vẽ được đồ bên trong: có đồ vật thì vẽ thành nhóm rời cho đủ số
      container:
        g.container && CONTAINERS[g.container] && !(CONTAINERS[g.container].placement === 'label' && g.item && Number(g.each) > 0)
          ? g.container
          : undefined,
      each: clampInt(Number(g.each), 0, 20),
      count: clampInt(Number(g.count), 1, 10),
      label: g.label ? String(g.label).slice(0, 8) : undefined,
    }))
    .filter((g) => (g.item && g.each > 0) || (g.container && g.label) || g.container)
  return { groups }
}

/** tải / nhờ server vẽ các đồ vật kho dùng chung có trong cấu hình (gọi trước khi vẽ chính thức) */
export async function prepareObjects(spec: ObjectsSpec): Promise<void> {
  await loadSprites()
  await ensureSprites((spec.groups ?? []).map((g) => g.item ?? '').filter((id) => DYNAMIC_ID.test(id)))
}

/** hình trong <defs> để `<use href="#sp-id">` (vector: bóng trắng + nét; kho dùng chung: ảnh PNG đã tách nền) */
export function spriteDef(id: string): string {
  const sp = getSprite(id)
  if (!sp) return ''
  return sp.href
    ? `<g id="sp-${id}"><image href="${sp.href}" width="${sp.w}" height="${sp.h}"/></g>`
    : `<g id="sp-${id}" fill-rule="evenodd"><path d="${sp.body}" fill="#fff"/><path d="${sp.ink}" fill="#111"/></g>`
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
const CLASSIFIER = /^(cai|con|qua|chiec|cu|bong|vien|toa|ngon|ngoi|cay|tau|cot) /

/**
 * tên vật trong lệnh hình ("cột cờ", "cái thang", "flagpole", "x-teapot") → id trong kho; không thấy thì null.
 * So không dấu, bỏ được từ chỉ loại đứng đầu ("cái thang" = "thang").
 */
export function resolveSpriteId(name: string): string | null {
  const raw = name.trim()
  if (OBJECTS[raw] || DYNAMIC_ID.test(raw)) return raw
  // vật ngoài kho: "en:teapot" → kho dùng chung (vẽ một lần, lưu lại)
  const en = /^en\s*:\s*(.+)$/i.exec(raw)
  if (en) return dynamicId(en[1])
  const q = fold(raw)
  if (OBJECT_ALIASES[q]) return OBJECT_ALIASES[q]
  let hit: string | null = null
  for (const [id, n] of Object.entries(OBJECTS)) {
    const f = fold(n)
    if (f === q || id === q.replace(/ /g, '_')) return id
    if (!hit && (f.replace(CLASSIFIER, '') === q.replace(CLASSIFIER, '') || f.split(' / ').includes(q))) hit = id
  }
  return hit
}

/** id hình trong các lệnh "hình <vật> …" của hình thực tế */
export function sceneSpriteIds(text: string): string[] {
  const out: string[] = []
  for (const line of text.split('\n')) {
    const m = /^\s*hình\s+(.+?)\s+[A-Za-z0-9_'-]+\s*$/u.exec(line.replace(/"[^"]*"|“[^”]*”/g, '').trim())
    const id = m ? resolveSpriteId(m[1]) : null
    if (id) out.push(id)
  }
  return out
}

/** trước khi vẽ chính thức (đổi PNG, xem trước): nạp kho + tải / nhờ server vẽ hình kho dùng chung */
export async function prepareToolDoc(doc: { kind: string; spec: unknown }): Promise<void> {
  if (doc.kind === 'objects') return prepareObjects(doc.spec as ObjectsSpec)
  if (doc.kind === 'scene') {
    await loadSprites()
    await ensureSprites(sceneSpriteIds((doc.spec as { text?: string }).text ?? '').filter((id) => DYNAMIC_ID.test(id)))
  }
}

export function renderObjectsSvg(raw: ObjectsSpec, desc: string) {
  const spec = normalizeObjects(raw)
  if (!spec.groups.length) throw new Error('Chưa có đồ vật nào trong kho hình để vẽ.')
  const used = new Set<string>()
  for (const g of spec.groups) if (g.item && g.itemName) nameOf.set(g.item, g.itemName)
  // mỗi nhóm = count hộp giống nhau đặt cạnh nhau; xếp các nhóm thành dòng, quá rộng thì xuống dòng
  type Item = { box: Box; gapBefore: number }
  const lines: Item[][] = [[]]
  let lineW = 0
  spec.groups.forEach((g, gi) => {
    for (let i = 0; i < g.count; i++) {
      const box = g.container ? containerBox(g, used) : clusterBox(g, used)
      const gapBefore = lines[lines.length - 1].length ? (i === 0 && gi > 0 ? GROUP_GAP : g.container ? GAP : GAP * 2) : 0
      if (lineW + gapBefore + box.w > MAX_W && lines[lines.length - 1].length) {
        lines.push([{ box, gapBefore: 0 }])
        lineW = box.w
      } else {
        lines[lines.length - 1].push({ box, gapBefore })
        lineW += gapBefore + box.w
      }
    }
  })
  const lineSizes = lines.map((l) => ({ w: l.reduce((s, it) => s + it.gapBefore + it.box.w, 0), h: Math.max(...l.map((it) => it.box.h)) }))
  const W = Math.max(...lineSizes.map((s) => s.w)) + PAD * 2
  const H = lineSizes.reduce((s, l) => s + l.h, 0) + (lines.length - 1) * 24 + PAD * 2
  let body = ''
  let y = PAD
  lines.forEach((l, li) => {
    let x = PAD + (W - PAD * 2 - lineSizes[li].w) / 2
    for (const it of l) {
      x += it.gapBefore
      body += it.box.draw(x, y + lineSizes[li].h - it.box.h)
      x += it.box.w
    }
    y += lineSizes[li].h + 24
  })
  const defs = [...used].map(spriteDef).join('')
  const w = Math.round(W)
  const h = Math.round(H)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${desc}<defs>${defs}</defs><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: w, height: h }
}

/* ------------------------------------------------------------------ *
 * Đồng hồ kim
 * ------------------------------------------------------------------ */

export interface ClockSpec {
  hour: number
  minute: number
  /** ghi số 1–12 trên mặt (mặc định có) */
  numbers?: boolean
}

export const CLOCK_DEFAULT: ClockSpec = { hour: 8, minute: 15, numbers: true }

export function renderClockSvg(spec: ClockSpec, desc: string) {
  const S = 220
  const C = S / 2
  const R = 96
  const hour = clampInt(spec.hour, 0, 23) % 12
  const minute = clampInt(spec.minute, 0, 59)
  const pt = (deg: number, r: number) => [C + r * Math.sin((deg * Math.PI) / 180), C - r * Math.cos((deg * Math.PI) / 180)]
  let body = `<circle cx="${C}" cy="${C}" r="${R}" fill="#fff" stroke="#111" stroke-width="3"/>`
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0
    const [x1, y1] = pt(i * 6, R - 2)
    const [x2, y2] = pt(i * 6, R - (major ? 11 : 6))
    body += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#111" stroke-width="${major ? 2.5 : 1}"/>`
  }
  if (spec.numbers !== false)
    for (let n = 1; n <= 12; n++) {
      const [x, y] = pt(n * 30, R - 26)
      body += `<text x="${f1(x)}" y="${f1(y + 6.5)}" text-anchor="middle" font-size="19" fill="#111" ${FAM}>${n}</text>`
    }
  const hand = (deg: number, len: number, w: number) => {
    const [x, y] = pt(deg, len)
    return `<line x1="${C}" y1="${C}" x2="${f1(x)}" y2="${f1(y)}" stroke="#111" stroke-width="${w}" stroke-linecap="round"/>`
  }
  body += hand((hour + minute / 60) * 30, 50, 5) + hand(minute * 6, 76, 3) + `<circle cx="${C}" cy="${C}" r="4.5" fill="#111"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: S, height: S }
}
