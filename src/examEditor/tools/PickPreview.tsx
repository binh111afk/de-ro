/**
 * Ảnh xem trước hình học bấm/kéo được:
 * - bấm lên cạnh → điểm mới trên cạnh (hít vào trung điểm, 1/3, 1/4…);
 * - kéo từ điểm (hoặc từ cạnh) sang điểm/cạnh khác → nối đoạn.
 * Mỗi thao tác ghi thêm dòng vào ô "Dựng thêm" — renderer lo tính và vẽ
 * (nét khuất tự tính), nên chèn/xuất/nhấp đúp sửa vẫn như cũ.
 */
import { useRef, useState } from 'react'
import { Undo2 } from 'lucide-react'
import { svgDataUrl } from '@/lib/plot'
import type { ToolImage } from '@/lib/toolSpec'

type Pt = { x: number; y: number }
/** chỗ bấm trúng: điểm có sẵn, hoặc điểm trên cạnh AB tại tỉ lệ t (tính từ A) */
type Hit = { kind: 'point'; name: string; at: Pt } | { kind: 'edge'; a: string; b: string; t: number; at: Pt }

const SNAPS: Array<[number, string]> = [
  [1 / 2, '1/2'],
  [1 / 3, '1/3'],
  [2 / 3, '2/3'],
  [1 / 4, '1/4'],
  [3 / 4, '3/4'],
]
const NAME_POOL = 'M N P Q K I E F G H J L R T U V X Y Z'.split(' ')

function ratioText(t: number): string {
  return SNAPS.find(([v]) => Math.abs(v - t) < 1e-9)?.[1] ?? String(Math.round(t * 10) / 10)
}

export function PickPreview({ img, extras, onExtras }: { img: ToolImage; extras: string; onExtras: (v: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hit | null>(null)
  const [drag, setDrag] = useState<{ from: Hit; to: Pt } | null>(null)
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(img.svg)
  const [minX, minY, w, h] = vb ? vb.slice(1).map(Number) : [0, 0, img.width, img.height]
  const pick = img.pick ?? { points: [], segs: [] }
  // cỡ nét/chấm của lớp tương tác theo px màn hình
  const k0 = box.current ? w / box.current.getBoundingClientRect().width : w / 500
  const pts = new Map(pick.points.map((p) => [p.name, p]))
  const order = new Map(pick.points.map((p, i) => [p.name, i]))

  /** toạ độ chuột → viewBox; k = số đơn vị viewBox / 1px màn hình */
  const toVb = (e: React.PointerEvent): { p: Pt; k: number } => {
    const r = box.current!.getBoundingClientRect()
    const k = w / r.width
    return { p: { x: minX + (e.clientX - r.left) * k, y: minY + (e.clientY - r.top) * k }, k }
  }

  const hitTest = (p: Pt, k: number): Hit | null => {
    let best: Hit | null = null
    let bd = 11 * k
    for (const q of pick.points) {
      const d = Math.hypot(q.x - p.x, q.y - p.y)
      if (d < bd) {
        bd = d
        best = { kind: 'point', name: q.name, at: q }
      }
    }
    if (best) return best
    bd = 8 * k
    for (const s of pick.segs) {
      const A = pts.get(s.a)
      const B = pts.get(s.b)
      if (!A || !B) continue
      const ux = B.x - A.x
      const uy = B.y - A.y
      const L2 = ux * ux + uy * uy
      if (L2 < 1) continue
      let t = ((p.x - A.x) * ux + (p.y - A.y) * uy) / L2
      if (t <= 0.03 || t >= 0.97) continue
      const d = Math.hypot(A.x + ux * t - p.x, A.y + uy * t - p.y)
      if (d >= bd) continue
      // hít vào tỉ lệ quen thuộc (trong ~14px), không thì làm tròn 0,1
      const len = Math.sqrt(L2)
      const snap = SNAPS.find(([v]) => Math.abs(v - t) * len < 14 * k)
      t = snap ? snap[0] : Math.min(0.9, Math.max(0.1, Math.round(t * 10) / 10))
      bd = d
      const at = { x: A.x + ux * t, y: A.y + uy * t }
      // ghi theo thứ tự đỉnh của hình: "SC", "SB 1/3" (không phải "CS", "BS 2/3")
      best = order.get(s.a)! <= order.get(s.b)! ? { kind: 'edge', a: s.a, b: s.b, t, at } : { kind: 'edge', a: s.b, b: s.a, t: 1 - t, at }
    }
    return best
  }

  /** điểm trên cạnh → dòng dựng hình + tên mới (dùng lại điểm đã dựng nếu trùng) */
  const used = new Set(pick.points.map((p) => p.name))
  const ensurePoint = (hit: Hit, lines: string[]): string => {
    if (hit.kind === 'point') return hit.name
    const same = pick.points.find((q) => Math.hypot(q.x - hit.at.x, q.y - hit.at.y) < 0.5)
    if (same) return same.name
    const name = NAME_POOL.find((n) => !used.has(n)) ?? `M${used.size}`
    used.add(name)
    lines.push(Math.abs(hit.t - 1 / 2) < 1e-9 ? `${name} = trung điểm ${hit.a}${hit.b}` : `${name} = ${hit.a}${hit.b} ${ratioText(hit.t)}`)
    return name
  }

  const commit = (lines: string[]) => {
    if (!lines.length) return
    const base = extras.replace(/\s+$/, '')
    onExtras((base ? base + '\n' : '') + lines.join('\n'))
  }

  const undo = () => onExtras(extras.replace(/\s+$/, '').split('\n').slice(0, -1).join('\n'))

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ containerType: 'size' }}>
      <div
        ref={box}
        className="relative select-none"
        style={{ aspectRatio: `${w} / ${h}`, width: `min(100cqw, (100cqh - 32px) * ${w / h})` }}
      >
        <img src={svgDataUrl(img.svg)} alt="Xem trước" draggable={false} className="block h-full w-full rounded-[4px] border border-line bg-white" />
        <svg
          viewBox={`${minX} ${minY} ${w} ${h}`}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: hover ? 'crosshair' : 'default' }}
          onPointerDown={(e) => {
            const { p, k } = toVb(e)
            const hit = hitTest(p, k)
            if (!hit) return
            e.currentTarget.setPointerCapture(e.pointerId)
            setDrag({ from: hit, to: p })
          }}
          onPointerMove={(e) => {
            const { p, k } = toVb(e)
            const hit = hitTest(p, k)
            setHover(hit)
            if (drag) setDrag({ ...drag, to: hit?.at ?? p })
          }}
          onPointerUp={(e) => {
            if (!drag) return
            const { p, k } = toVb(e)
            const moved = Math.hypot(p.x - drag.from.at.x, p.y - drag.from.at.y) > 12 * k
            const end = moved ? hitTest(p, k) : null
            const lines: string[] = []
            const a = ensurePoint(drag.from, lines)
            if (end) {
              const b = ensurePoint(end, lines)
              if (b !== a && !pick.segs.some((s) => (s.a === a && s.b === b) || (s.a === b && s.b === a))) lines.push(`${a}${b}`)
            }
            setDrag(null)
            commit(lines)
          }}
          onPointerLeave={() => !drag && setHover(null)}
        >
          {drag && (
            <line
              x1={drag.from.at.x}
              y1={drag.from.at.y}
              x2={drag.to.x}
              y2={drag.to.y}
              stroke="var(--color-clay)"
              strokeWidth={1.6 * k0}
              strokeDasharray={`${5 * k0} ${4 * k0}`}
            />
          )}
          {hover && (
            <g>
              <circle cx={hover.at.x} cy={hover.at.y} r={5 * k0} fill="var(--color-clay)" fillOpacity={0.85} />
              {hover.kind === 'edge' && (
                <text x={hover.at.x + 8 * k0} y={hover.at.y - 8 * k0} fontSize={12 * k0} fill="var(--color-clay)">
                  {Math.abs(hover.t - 1 / 2) < 1e-9 ? `trung điểm ${hover.a}${hover.b}` : `${ratioText(hover.t)} ${hover.a}${hover.b} (từ ${hover.a})`}
                </text>
              )}
            </g>
          )}
        </svg>
      </div>
      {extras.trim() && (
        <button type="button" onClick={undo} className="flex items-center gap-1 text-[12px] text-clay hover:underline">
          <Undo2 className="size-3.5" /> Bỏ thao tác vừa rồi
        </button>
      )}
    </div>
  )
}
