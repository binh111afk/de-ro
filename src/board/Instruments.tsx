/**
 * Bảng vẽ — dụng cụ hình học nổi trên bảng: thước kẻ, thước đo góc, compa.
 * Dụng cụ nằm trong toạ độ cảnh (kéo / phóng bảng thì đi theo), vẽ bằng SVG trên canvas.
 * - Thước kẻ: kéo thân để dời, kéo núm tròn để xoay; bút vẽ sát mép thước thì nét bám thẳng theo mép.
 * - Thước đo góc: kéo thân để dời, núm để xoay, kim đo để đọc góc; bút sát mép cong / mép thẳng thì bám theo.
 * - Compa: kéo kim để dời, kéo đầu chì để đổi bán kính, kéo núm trên đầu để quay → vẽ cung tròn.
 */
import { useRef, type PointerEvent as RPE } from 'react'
import type { Pt } from './scene'

/** 1 cm trên bảng (ở mức phóng 100%) */
export const CM = 37.8
const RULER_W = 64
const RULER_LEN = 20 * CM

export interface InstState {
  /** thước kẻ: (x, y) là đầu mép có vạch chia, a là góc (rad) */
  ruler?: { x: number; y: number; a: number }
  /** thước đo góc: (x, y) là tâm, a là góc xoay của mép thẳng, m là góc kim đo (độ, 0–180) */
  protractor?: { x: number; y: number; a: number; m: number }
  /** compa: (x, y) là đầu kim, r bán kính, a góc đầu chì (rad) */
  compass?: { x: number; y: number; r: number; a: number }
}
export type InstKind = keyof InstState

const PROT_R = 6 * CM

/** đường dẫn nét bút: thẳng theo một đường hoặc tròn quanh một tâm */
export type InstGuide = { t: 'line'; o: Pt; d: Pt } | { t: 'circle'; c: Pt; r: number }

const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1]

/** bút đặt xuống gần mép dụng cụ (trong khoảng tol) → trả về đường để nét bám theo */
export function guideAt(s: InstState, p: Pt, tol: number): InstGuide | null {
  const r = s.ruler
  if (r) {
    const d: Pt = [Math.cos(r.a), Math.sin(r.a)], n: Pt = [-d[1], d[0]]
    const v: Pt = [p[0] - r.x, p[1] - r.y]
    const t = dot(v, d), sd = dot(v, n)
    if (t > -tol && t < RULER_LEN + tol) {
      if (sd > -tol && sd < tol) return { t: 'line', o: [r.x, r.y], d }
      if (sd > RULER_W - tol && sd < RULER_W + tol) return { t: 'line', o: [r.x + n[0] * RULER_W, r.y + n[1] * RULER_W], d }
    }
  }
  const q = s.protractor
  if (q) {
    const v: Pt = [p[0] - q.x, p[1] - q.y]
    const dist = Math.hypot(v[0], v[1])
    const d: Pt = [Math.cos(q.a), Math.sin(q.a)], n: Pt = [-d[1], d[0]]
    // mặt cong nằm phía -n (phía trên khi chưa xoay)
    if (Math.abs(dist - PROT_R) < tol && dot(v, n) < tol) return { t: 'circle', c: [q.x, q.y], r: PROT_R }
    if (Math.abs(dot(v, n)) < tol && Math.abs(dot(v, d)) < PROT_R + tol) return { t: 'line', o: [q.x, q.y], d }
  }
  return null
}

/** chiếu điểm lên đường dẫn */
export function projectGuide(g: InstGuide, p: Pt): Pt {
  if (g.t === 'line') {
    const t = (p[0] - g.o[0]) * g.d[0] + (p[1] - g.o[1]) * g.d[1]
    return [g.o[0] + g.d[0] * t, g.o[1] + g.d[1] * t]
  }
  const dx = p[0] - g.c[0], dy = p[1] - g.c[1]
  const L = Math.hypot(dx, dy) || 1
  return [g.c[0] + (dx / L) * g.r, g.c[1] + (dy / L) * g.r]
}

/** đặt dụng cụ mới ở giữa vùng nhìn thấy */
export function placeInstrument(k: InstKind, center: Pt): InstState[InstKind] {
  const [cx, cy] = center
  // mỗi dụng cụ một chỗ để mở cùng lúc không chồng lên nhau
  if (k === 'ruler') return { x: cx - RULER_LEN / 2, y: cy - 4 * CM, a: 0 }
  if (k === 'protractor') return { x: cx - 4 * CM, y: cy + 5 * CM, a: 0, m: 60 }
  return { x: cx + 3 * CM, y: cy + 4 * CM, r: 4 * CM, a: 0 }
}

const deg = (r: number) => (r * 180) / Math.PI
/** góc xoay: bám số nguyên độ, gần bội 15° thì bám luôn vào đó */
function snapAngle(a: number) {
  let d = deg(a)
  const k = Math.round(d / 15) * 15
  d = Math.abs(d - k) < 2 ? k : Math.round(d)
  return (d * Math.PI) / 180
}
const fmtCm = (px: number) => (px / CM).toFixed(1).replace('.', ',')
/** góc hiển thị 0–180° */
const shownDeg = (a: number) => {
  let d = Math.round(-deg(a)) % 180
  if (d < 0) d += 180
  return d
}

export interface InstApi {
  toScene: (cx: number, cy: number) => Pt
  /** compa bắt đầu / thêm điểm / kết thúc một cung (vẽ bằng bút đang chọn) */
  arcStart: (p: Pt) => void
  arcPoint: (p: Pt) => void
  arcEnd: () => void
}

type Act =
  | { k: 'move'; which: InstKind; start: Pt; ox: number; oy: number }
  | { k: 'rotate'; which: 'ruler' | 'protractor'; c: Pt; a0: number; p0: number }
  | { k: 'arm'; c: Pt; a: number }
  | { k: 'radius' }
  | { k: 'draw'; last: number }

export function Instruments({ s, set, gRef, api }: {
  s: InstState
  set: (u: (s: InstState) => InstState) => void
  /** nhóm gốc: BoardEditor gắn transform theo vùng nhìn mỗi lần vẽ lại */
  gRef: React.RefObject<SVGGElement | null>
  api: InstApi
}) {
  const act = useRef<Act | null>(null)

  const begin = (ev: RPE<SVGElement>, a: Act) => {
    ev.stopPropagation()
    ev.preventDefault()
    try { (ev.currentTarget as Element).setPointerCapture(ev.pointerId) } catch {}
    act.current = a
    if (a.k === 'draw') {
      const c = s.compass!
      api.arcStart([c.x + c.r * Math.cos(c.a), c.y + c.r * Math.sin(c.a)])
    }
  }
  const move = (ev: RPE<SVGElement>) => {
    const a = act.current
    if (!a) return
    const p = api.toScene(ev.clientX, ev.clientY)
    if (a.k === 'move') {
      const x = a.ox + p[0] - a.start[0], y = a.oy + p[1] - a.start[1]
      set((st) => ({ ...st, [a.which]: { ...st[a.which]!, x, y } }))
    } else if (a.k === 'rotate') {
      const ang = snapAngle(a.a0 + Math.atan2(p[1] - a.c[1], p[0] - a.c[0]) - a.p0)
      set((st) => {
        if (a.which === 'protractor') return { ...st, protractor: { ...st.protractor!, a: ang } }
        // thước xoay quanh tâm thân thước
        const d: Pt = [Math.cos(ang), Math.sin(ang)], n: Pt = [-d[1], d[0]]
        return { ...st, ruler: { a: ang, x: a.c[0] - d[0] * RULER_LEN / 2 - n[0] * RULER_W / 2, y: a.c[1] - d[1] * RULER_LEN / 2 - n[1] * RULER_W / 2 } }
      })
    } else if (a.k === 'arm') {
      // góc kim so với mép thẳng, đo ngược chiều kim đồng hồ (như đọc trên thước)
      let m = Math.round(-deg(Math.atan2(p[1] - a.c[1], p[0] - a.c[0]) - a.a))
      m = ((m % 360) + 360) % 360
      if (m > 270) m = 0
      else if (m > 180) m = 180
      set((st) => ({ ...st, protractor: { ...st.protractor!, m } }))
    } else if (a.k === 'radius') {
      set((st) => {
        const c = st.compass!
        // bán kính bám từng mm
        const r = Math.max(CM * 0.5, Math.round((Math.hypot(p[0] - c.x, p[1] - c.y) / CM) * 10) * CM / 10)
        return { ...st, compass: { ...c, r, a: Math.atan2(p[1] - c.y, p[0] - c.x) } }
      })
    } else if (a.k === 'draw') {
      const c = s.compass!
      const raw = Math.atan2(p[1] - c.y, p[0] - c.x)
      // gỡ bước nhảy ±π để quay được nhiều vòng liền; chia nhỏ để cung tròn mịn
      let next = raw
      while (next - a.last > Math.PI) next -= 2 * Math.PI
      while (next - a.last < -Math.PI) next += 2 * Math.PI
      const steps = Math.max(1, Math.ceil((Math.abs(next - a.last) * c.r) / 3))
      for (let i = 1; i <= steps; i++) {
        const t = a.last + ((next - a.last) * i) / steps
        api.arcPoint([c.x + c.r * Math.cos(t), c.y + c.r * Math.sin(t)])
      }
      a.last = next
      set((st) => ({ ...st, compass: { ...st.compass!, a: next } }))
    }
  }
  const end = () => {
    if (act.current?.k === 'draw') api.arcEnd()
    act.current = null
  }
  const close = (k: InstKind) => set((st) => { const n = { ...st }; delete n[k]; return n })
  const h = { onPointerMove: move, onPointerUp: end, onPointerCancel: end }

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden" style={{ touchAction: 'none' }}>
      <g ref={gRef}>
        {s.ruler && <Ruler r={s.ruler} begin={begin} h={h} close={() => close('ruler')} />}
        {s.protractor && <Protractor q={s.protractor} begin={begin} h={h} close={() => close('protractor')} />}
        {s.compass && <Compass c={s.compass} begin={begin} h={h} close={() => close('compass')} />}
      </g>
    </svg>
  )
}

type Begin = (ev: RPE<SVGElement>, a: Act) => void
type H = { onPointerMove: (ev: RPE<SVGElement>) => void; onPointerUp: () => void; onPointerCancel: () => void }

const BODY = 'rgba(255, 233, 160, 0.55)'
const EDGE = '#b08900'
const INK = '#5c4400'

function CloseBtn({ x, y, onClick }: { x: number; y: number; onClick: () => void }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-auto cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); onClick() }} data-tip="Cất dụng cụ">
      <circle r={9} fill="#fff" stroke={EDGE} />
      <path d="M-3.5 -3.5L3.5 3.5M3.5 -3.5L-3.5 3.5" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  )
}

function Ruler({ r, begin, h, close }: { r: NonNullable<InstState['ruler']>; begin: Begin; h: H; close: () => void }) {
  const ticks = []
  for (let i = 0; i <= 200; i++) {
    const x = (i * CM) / 10
    const L = i % 10 === 0 ? 16 : i % 5 === 0 ? 11 : 6
    ticks.push(<line key={i} x1={x} y1={0} x2={x} y2={L} stroke={INK} strokeWidth={i % 10 === 0 ? 1 : 0.6} />)
    if (i % 10 === 0) ticks.push(<text key={`t${i}`} x={x} y={28} fontSize={10} textAnchor="middle" fill={INK}>{i / 10}</text>)
  }
  const c: Pt = [r.x + Math.cos(r.a) * RULER_LEN / 2 - Math.sin(r.a) * RULER_W / 2, r.y + Math.sin(r.a) * RULER_LEN / 2 + Math.cos(r.a) * RULER_W / 2]
  return (
    <g transform={`translate(${r.x} ${r.y}) rotate(${deg(r.a)})`} style={{ userSelect: 'none' }}>
      <rect
        x={-12} y={0} width={RULER_LEN + 24} height={RULER_W} rx={4} fill={BODY} stroke={EDGE}
        className="pointer-events-auto cursor-move" {...h}
        onPointerDown={(e) => begin(e, { k: 'move', which: 'ruler', start: startOf(e), ox: r.x, oy: r.y })}
      />
      <g className="pointer-events-none">{ticks}</g>
      <text x={RULER_LEN / 2} y={RULER_W - 12} fontSize={11} textAnchor="middle" fill={INK} className="pointer-events-none">{shownDeg(r.a)}°</text>
      <g
        transform={`translate(${RULER_LEN / 2 - 14} ${RULER_W + 24})`} className="pointer-events-auto cursor-grab" {...h} data-tip="Kéo để xoay thước"
        onPointerDown={(e) => begin(e, { k: 'rotate', which: 'ruler', c, a0: r.a, p0: angTo(e, c) })}
      >
        <circle r={10} fill="#fff" stroke={EDGE} />
        <path d="M-4 1a4 4 0 1 0 1-4.5M-3 -6v3h3" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      </g>
      <CloseBtn x={RULER_LEN / 2 + 14} y={RULER_W + 24} onClick={close} />
    </g>
  )
}

function Protractor({ q, begin, h, close }: { q: NonNullable<InstState['protractor']>; begin: Begin; h: H; close: () => void }) {
  const R = PROT_R
  const ticks = []
  for (let t = 0; t <= 180; t++) {
    const a = (t * Math.PI) / 180, cs = Math.cos(a), sn = -Math.sin(a)
    const L = t % 10 === 0 ? 16 : t % 5 === 0 ? 11 : 6
    ticks.push(<line key={t} x1={R * cs} y1={R * sn} x2={(R - L) * cs} y2={(R - L) * sn} stroke={INK} strokeWidth={t % 10 === 0 ? 1 : 0.6} />)
    if (t % 10 === 0) {
      ticks.push(<text key={`o${t}`} x={(R - 26) * cs} y={(R - 26) * sn + 3.5} fontSize={10} textAnchor="middle" fill={INK}>{t}</text>)
      ticks.push(<text key={`i${t}`} x={(R - 42) * cs} y={(R - 42) * sn + 3} fontSize={8} textAnchor="middle" fill="#9a7b1a">{180 - t}</text>)
    }
  }
  const ma = (q.m * Math.PI) / 180
  const c: Pt = [q.x, q.y]
  const tip: Pt = [(R + 18) * Math.cos(ma), -(R + 18) * Math.sin(ma)]
  return (
    <g transform={`translate(${q.x} ${q.y}) rotate(${deg(q.a)})`} style={{ userSelect: 'none' }}>
      <path
        d={`M${-R - 10} 0A${R + 10} ${R + 10} 0 0 1 ${R + 10} 0V14H${-R - 10}Z`} fill={BODY} stroke={EDGE}
        className="pointer-events-auto cursor-move" {...h}
        onPointerDown={(e) => begin(e, { k: 'move', which: 'protractor', start: startOf(e), ox: q.x, oy: q.y })}
      />
      <path d={`M${-R} 0A${R} ${R} 0 0 1 ${R} 0`} fill="none" stroke={INK} strokeWidth={0.6} className="pointer-events-none" />
      <line x1={-R} y1={0} x2={R} y2={0} stroke={INK} strokeWidth={0.8} className="pointer-events-none" />
      <g className="pointer-events-none">{ticks}</g>
      <path d="M-6 0H6M0 -6V6" stroke={INK} strokeWidth={1} className="pointer-events-none" />
      {/* kim đo góc */}
      <line x1={0} y1={0} x2={tip[0]} y2={tip[1]} stroke="#e03131" strokeWidth={1.2} className="pointer-events-none" />
      <g transform={`translate(${tip[0]} ${tip[1]})`} className="pointer-events-auto cursor-grab" {...h} data-tip="Kéo kim để đo góc"
        onPointerDown={(e) => begin(e, { k: 'arm', c, a: q.a })}>
        <circle r={7} fill="#fff" stroke="#e03131" strokeWidth={1.4} />
      </g>
      <text x={0} y={-22} fontSize={13} fontWeight={600} textAnchor="middle" fill="#e03131" className="pointer-events-none">{q.m}°</text>
      <g transform={`translate(-14 38)`} className="pointer-events-auto cursor-grab" {...h} data-tip="Kéo để xoay thước đo góc"
        onPointerDown={(e) => begin(e, { k: 'rotate', which: 'protractor', c, a0: q.a, p0: angTo(e, c) })}>
        <circle r={10} fill="#fff" stroke={EDGE} />
        <path d="M-4 1a4 4 0 1 0 1-4.5M-3 -6v3h3" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      </g>
      <CloseBtn x={14} y={38} onClick={close} />
    </g>
  )
}

function Compass({ c, begin, h, close }: { c: NonNullable<InstState['compass']>; begin: Begin; h: H; close: () => void }) {
  const tip: Pt = [c.x + c.r * Math.cos(c.a), c.y + c.r * Math.sin(c.a)]
  const mid: Pt = [(c.x + tip[0]) / 2, (c.y + tip[1]) / 2]
  const n: Pt = [Math.sin(c.a), -Math.cos(c.a)]
  // hai càng dài cố định → đầu compa cao thấp theo độ mở
  const leg = Math.max(c.r / 2 + 30, 5 * CM)
  const hh = Math.sqrt(Math.max(leg * leg - (c.r / 2) ** 2, 900))
  const top: Pt = [mid[0] + n[0] * hh, mid[1] + n[1] * hh]
  const knob: Pt = [top[0] + n[0] * 22, top[1] + n[1] * 22]
  const label: Pt = [mid[0] - n[0] * 16, mid[1] - n[1] * 16]
  return (
    <g style={{ userSelect: 'none' }}>
      {/* vòng mờ: cung sẽ vẽ */}
      <circle cx={c.x} cy={c.y} r={c.r} fill="none" stroke="#1971c2" strokeOpacity={0.25} strokeDasharray="4 5" className="pointer-events-none" />
      <line x1={c.x} y1={c.y} x2={tip[0]} y2={tip[1]} stroke="#1971c2" strokeOpacity={0.5} strokeDasharray="3 3" className="pointer-events-none" />
      <text x={label[0]} y={label[1] + 4} fontSize={12} fontWeight={600} textAnchor="middle" fill="#1971c2" className="pointer-events-none">{fmtCm(c.r)} cm</text>
      {/* càng kim */}
      <line x1={top[0]} y1={top[1]} x2={c.x} y2={c.y} stroke="#495057" strokeWidth={7} strokeLinecap="round"
        className="pointer-events-auto cursor-move" {...h}
        onPointerDown={(e) => begin(e, { k: 'move', which: 'compass', start: startOf(e), ox: c.x, oy: c.y })} />
      {/* càng chì */}
      <line x1={top[0]} y1={top[1]} x2={tip[0]} y2={tip[1]} stroke="#868e96" strokeWidth={7} strokeLinecap="round"
        className="pointer-events-auto cursor-crosshair" {...h} data-tip="Kéo để đổi độ mở compa"
        onPointerDown={(e) => begin(e, { k: 'radius' })} />
      <circle cx={c.x} cy={c.y} r={3} fill="#212529" className="pointer-events-none" />
      <circle cx={tip[0]} cy={tip[1]} r={8} fill="#fff" fillOpacity={0.01} stroke="#1971c2" strokeWidth={1.4}
        className="pointer-events-auto cursor-crosshair" {...h} onPointerDown={(e) => begin(e, { k: 'radius' })} />
      <circle cx={tip[0]} cy={tip[1]} r={2.5} fill="#1971c2" className="pointer-events-none" />
      <circle cx={top[0]} cy={top[1]} r={6} fill="#343a40" className="pointer-events-none" />
      <line x1={top[0]} y1={top[1]} x2={knob[0]} y2={knob[1]} stroke="#343a40" strokeWidth={4} className="pointer-events-none" />
      <g transform={`translate(${knob[0]} ${knob[1]})`} className="pointer-events-auto cursor-grab" {...h} data-tip="Kéo núm quanh kim để vẽ cung tròn"
        onPointerDown={(e) => begin(e, { k: 'draw', last: c.a })}>
        <circle r={11} fill="#1971c2" />
        <path d="M-4 1a4 4 0 1 0 1-4.5M-3 -6v3h3" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
      </g>
      <CloseBtn x={top[0] - n[1] * 26 + n[0] * 4} y={top[1] + n[0] * 26 + n[1] * 4} onClick={close} />
    </g>
  )
}

/* toạ độ con trỏ trong cảnh: BoardEditor đổi sẵn qua api.toScene ở move; lúc bấm xuống ta cần cùng hệ */
let toSceneRef: ((x: number, y: number) => Pt) | null = null
export function bindToScene(f: (x: number, y: number) => Pt) { toSceneRef = f }
function startOf(e: RPE<SVGElement>): Pt { return toSceneRef ? toSceneRef(e.clientX, e.clientY) : [0, 0] }
function angTo(e: RPE<SVGElement>, c: Pt) { const p = startOf(e); return Math.atan2(p[1] - c[1], p[0] - c[0]) }
