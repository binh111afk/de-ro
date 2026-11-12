/**
 * Ảnh xem trước đường tròn lượng giác bấm/kéo được:
 * - rê chuột sát đường tròn → chấm mờ + số đo góc (hít về bội của π/6, π/4); bấm để thêm điểm
 *   (ghi dòng "M: 2π/3" vào ô lệnh, tên tự lấy M, N, P…);
 * - kéo một điểm đã có (dòng "M: góc" hoặc dòng chỉ có một góc) → đổi góc, thả chuột mới ghi;
 * - bấm đúp / bấm phải vào điểm → xoá dòng của điểm đó.
 * Mọi thao tác chỉ sửa chữ trong ô lệnh, renderer vẽ lại — chèn/sửa/xuất vẫn như cũ.
 */
import { useMemo, useRef, useState } from 'react'
import { svgDataUrl } from '@/lib/plot'
import { parseAngle, TRIG_GEOM } from '@/lib/mathExtra'
import type { ToolImage } from '@/lib/toolSpec'

const TAU = 2 * Math.PI
const NAME_POOL = 'M N P Q E F G H K L I J'.split(' ')
/** ngưỡng (px màn hình): bấm trúng điểm, rê sát đường tròn, hít góc đẹp */
const HIT_PT = 11
const HIT_RING = 14
const SNAP_DEG = 6

type DragPt = { line: number; name?: string; a: number }

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a))

/** góc (radian) → chữ: bội π/12 ghi dạng phân số π, còn lại ghi độ */
export function fmtAngle(a: number): string {
  const k = Math.round(a / (Math.PI / 12))
  if (Math.abs(k * (Math.PI / 12) - a) < 1e-6) {
    if (k === 0) return '0'
    const g = gcd(k, 12)
    const n = k / g
    const d = 12 / g
    const num = n === 1 ? 'π' : n === -1 ? '-π' : `${n}π`
    return d === 1 ? num : `${num}/${d}`
  }
  return `${Math.round((a * 180) / Math.PI)}°`
}

/** hít về bội của π/6 hoặc π/4 nếu lệch dưới SNAP_DEG; không thì làm tròn tới 1° */
function snapAngle(a: number, alt: boolean): number {
  const t = ((a % TAU) + TAU) % TAU
  if (!alt) {
    let best = t
    let bd = (SNAP_DEG * Math.PI) / 180
    for (let k = 0; k <= 24; k++) {
      if (k % 2 && k % 3) continue // chỉ bội π/6 (k chẵn) và π/4 (k chia hết 3)
      const c = (k * Math.PI) / 12
      const d = Math.abs(c - t)
      if (d < bd) {
        bd = d
        best = c % TAU
      }
    }
    if (best !== t) return wrapPi(best)
  }
  return wrapPi((Math.round((t * 180) / Math.PI) * Math.PI) / 180)
}

/** đưa góc về (−π; π]: điểm dưới trục hoành ghi −π/6 thay vì 11π/6, như cách ghi trong đề */
const wrapPi = (a: number) => (a > Math.PI + 1e-9 ? a - TAU : a)

/** các dòng là một điểm đơn kéo được: "M: π/3" hoặc chỉ "π/3" */
function draggablePoints(text: string): DragPt[] {
  const out: DragPt[] = []
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line) return
    const m = /^([A-Z][A-Za-z0-9']*)\s*:\s*(.+)$/.exec(line)
    const body = (m ? m[2] : line).replace(/^x\s*=\s*/i, '').trim()
    if (/\bk\b|[;()→]|^[xy]\s*=/i.test(body) || /^(to|noi|cung|tô|nối)/i.test(line)) return
    try {
      out.push({ line: i, name: m?.[1], a: parseAngle(body) })
    } catch {
      /* không phải góc đơn */
    }
  })
  return out
}

export function TrigPickPreview({ img, angles, onAngles }: { img: ToolImage; angles: string; onAngles: (v: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(img.svg)
  const [minX, minY, w, h] = vb ? vb.slice(1).map(Number) : [0, 0, img.width, img.height]
  const { cx, cy, R } = TRIG_GEOM
  const pts = useMemo(() => draggablePoints(angles), [angles])

  const [hover, setHover] = useState<{ a: number; onPt: number | null } | null>(null)
  const [drag, setDrag] = useState<{
    idx: number
    a: number
    moved: boolean
  } | null>(null)

  const at = (a: number) => ({
    x: cx + R * Math.cos(a),
    y: cy - R * Math.sin(a),
  })
  const toVb = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    const k = w / r.width
    return {
      x: minX + (e.clientX - r.left) * k,
      y: minY + (e.clientY - r.top) * k,
      k,
    }
  }
  /** chỗ chuột: góc thô, điểm trúng (nếu có), có sát đường tròn không */
  const probe = (e: { clientX: number; clientY: number }) => {
    const p = toVb(e)
    const a = Math.atan2(cy - p.y, p.x - cx)
    let onPt: number | null = null
    let bd = HIT_PT * p.k
    pts.forEach((q, i) => {
      const s = at(q.a)
      const d = Math.hypot(s.x - p.x, s.y - p.y)
      if (d < bd) {
        bd = d
        onPt = i
      }
    })
    const nearRing = Math.abs(Math.hypot(p.x - cx, p.y - cy) - R) < HIT_RING * p.k
    return { a, onPt, nearRing }
  }

  /** ghi lại một dòng (giữ tên nếu có) */
  const writeLine = (idx: number, a: number) => {
    const q = pts[idx]
    const lines = angles.split('\n')
    lines[q.line] = q.name ? `${q.name}: ${fmtAngle(a)}` : fmtAngle(a)
    onAngles(lines.join('\n'))
  }
  const removeLine = (idx: number) => {
    const lines = angles.split('\n')
    lines.splice(pts[idx].line, 1)
    onAngles(lines.join('\n'))
  }
  const addPoint = (a: number) => {
    const used = new Set(
      angles
        .split('\n')
        .map((l) => /^\s*([A-Z][A-Za-z0-9']*)\s*[:(]/.exec(l)?.[1])
        .filter(Boolean),
    )
    const name = NAME_POOL.find((n) => !used.has(n)) ?? `M${used.size + 1}`
    const base = angles.replace(/\s+$/, '')
    onAngles(`${base ? `${base}\n` : ''}${name}: ${fmtAngle(a)}`)
  }

  const ghost = drag ? drag.a : hover && hover.onPt === null ? hover.a : null
  const g = ghost === null ? null : at(ghost)
  const tipText = ghost === null ? null : `${drag && pts[drag.idx]?.name ? `${pts[drag.idx].name}: ` : ''}${fmtAngle(ghost)}`

  return (
    <div className="flex h-full w-full items-center justify-center" style={{ containerType: 'size' }}>
      <div
        ref={box}
        className="relative select-none"
        style={{
          aspectRatio: `${w} / ${h}`,
          width: `min(100cqw, 100cqh * ${(0.9 * w) / h}, ${w * 1.6}px)`,
        }}
      >
        <img src={svgDataUrl(img.svg)} alt="Xem trước" draggable={false} className="block h-full w-full rounded-[4px] border border-line bg-white" />
        <svg
          viewBox={`${minX} ${minY} ${w} ${h}`}
          className="absolute inset-0 h-full w-full touch-none"
          style={{
            cursor: drag ? 'grabbing' : hover?.onPt != null ? 'grab' : hover ? 'crosshair' : 'default',
          }}
          onPointerMove={(e) => {
            const pr = probe(e)
            if (drag) {
              const a = snapAngle(pr.a, e.altKey)
              if (a !== drag.a || !drag.moved) setDrag({ ...drag, a, moved: true })
              return
            }
            setHover(pr.onPt !== null ? { a: pts[pr.onPt].a, onPt: pr.onPt } : pr.nearRing ? { a: snapAngle(pr.a, e.altKey), onPt: null } : null)
          }}
          onPointerLeave={() => !drag && setHover(null)}
          onPointerDown={(e) => {
            if (e.button !== 0) return
            const pr = probe(e)
            if (pr.onPt !== null) {
              e.currentTarget.setPointerCapture(e.pointerId)
              setDrag({ idx: pr.onPt, a: pts[pr.onPt].a, moved: false })
            } else if (pr.nearRing) {
              addPoint(snapAngle(pr.a, e.altKey))
            }
          }}
          onPointerUp={() => {
            if (drag?.moved) writeLine(drag.idx, drag.a)
            setDrag(null)
          }}
          onDoubleClick={(e) => {
            const pr = probe(e)
            if (pr.onPt !== null) removeLine(pr.onPt)
          }}
          onContextMenu={(e) => {
            const pr = probe(e)
            if (pr.onPt === null) return
            e.preventDefault()
            removeLine(pr.onPt)
          }}
        >
          {/* vòng nhấn quanh các điểm kéo được */}
          {pts.map((q, i) => {
            const s = at(drag?.idx === i ? drag.a : q.a)
            return (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={hover?.onPt === i || drag?.idx === i ? 7 : 5.5}
                fill={drag?.idx === i ? 'var(--color-clay, #b5532a)' : 'none'}
                fillOpacity={0.25}
                stroke="var(--color-clay, #b5532a)"
                strokeWidth={1.4}
              />
            )
          })}
          {g && (
            <>
              <line x1={cx} y1={cy} x2={g.x} y2={g.y} stroke="var(--color-clay, #b5532a)" strokeWidth={1} strokeDasharray="4 3" />
              {!drag && <circle cx={g.x} cy={g.y} r={4} fill="var(--color-clay, #b5532a)" fillOpacity={0.55} />}
            </>
          )}
        </svg>
        {g && tipText && (
          <div
            className="pointer-events-none absolute z-10 -translate-y-full whitespace-nowrap rounded-[6px] border border-line bg-surface/95 px-2 py-0.5 font-mono text-[12px] font-medium text-ink shadow-soft"
            style={{
              left: `${((g.x - minX) / w) * 100}%`,
              top: `calc(${((g.y - minY) / h) * 100}% - 10px)`,
            }}
          >
            {tipText}
          </div>
        )}
        <p className="pointer-events-none absolute -bottom-6 left-0 right-0 text-center text-[11.5px] text-ink-3">
          Bấm lên đường tròn để thêm điểm · kéo điểm để đổi góc · bấm đúp để xoá · giữ Alt để tắt hít
        </p>
      </div>
    </div>
  )
}
