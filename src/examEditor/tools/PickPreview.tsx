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
/** special: chân đường cao / trung điểm / chân phân giác kẻ từ đỉnh đang kéo */
type Special = 'alt' | 'mid' | 'bis'
type Hit = { kind: 'point'; name: string; at: Pt } | { kind: 'edge'; a: string; b: string; t: number; at: Pt; special?: Special }
const SPECIAL_LABEL: Record<Special, string> = { alt: 'đường cao', mid: 'trung tuyến', bis: 'phân giác' }

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
  /** menu khi bấm đúng một đỉnh tam giác: đường cao / trung tuyến / phân giác */
  const [menu, setMenu] = useState<{ name: string; at: Pt } | null>(null)
  const vb = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(img.svg)
  const [minX, minY, w, h] = vb ? vb.slice(1).map(Number) : [0, 0, img.width, img.height]
  const pick = img.pick ?? { points: [], segs: [], tris: [] as string[][] }
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

  /** `from`: đỉnh đang kéo — cạnh sẽ hít thêm chân đường cao, trung điểm, chân phân giác */
  const hitTest = (p: Pt, k: number, from?: Hit): Hit | null => {
    const F = from?.kind === 'point' ? pts.get(from.name) : undefined
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
      const len = Math.sqrt(L2)
      // kéo từ đỉnh F (không nằm trên cạnh): ưu tiên chân đường cao, trung điểm, chân phân giác
      let special: Special | undefined
      if (F && F.name !== s.a && F.name !== s.b) {
        const u = A.v.map((x, i) => B.v[i] - x)
        const fa = F.v.map((x, i) => x - A.v[i])
        const uu = u.reduce((acc, x) => acc + x * x, 0)
        const dist = (a: number[], b: number[]) => Math.hypot(...a.map((x, i) => x - b[i]))
        const fA = dist(F.v, A.v)
        const fB = dist(F.v, B.v)
        const cands: Array<[number, Special]> = [
          [fa.reduce((acc, x, i) => acc + x * u[i], 0) / uu, 'alt'],
          [0.5, 'mid'],
          [fA / (fA + fB), 'bis'],
        ]
        const c = cands.filter(([v]) => v > 0.02 && v < 0.98).sort((x, y) => Math.abs(x[0] - t) - Math.abs(y[0] - t))[0]
        if (c && Math.abs(c[0] - t) * len < 16 * k) {
          t = c[0]
          special = c[1]
        }
      }
      if (!special) {
        // hít vào tỉ lệ quen thuộc (trong ~14px), không thì làm tròn 0,1
        const snap = SNAPS.find(([v]) => Math.abs(v - t) * len < 14 * k)
        t = snap ? snap[0] : Math.min(0.9, Math.max(0.1, Math.round(t * 10) / 10))
      }
      bd = d
      const at = { x: A.x + ux * t, y: A.y + uy * t }
      // ghi theo thứ tự đỉnh của hình: "SC", "SB 1/3" (không phải "CS", "BS 2/3")
      best =
        order.get(s.a)! <= order.get(s.b)!
          ? { kind: 'edge', a: s.a, b: s.b, t, at, special }
          : { kind: 'edge', a: s.b, b: s.a, t: 1 - t, at, special }
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

  /** kéo từ đỉnh v tới chân đặc biệt trên cạnh: ghi lệnh đường cao / trung tuyến / phân giác */
  const special = (v: string, e: Extract<Hit, { kind: 'edge' }>, lines: string[]) => {
    const kind = KINDS.find((x) => x.cmd === SPECIAL_LABEL[e.special!])!
    const name = [...kind.prefer, ...NAME_POOL].find((n) => !used.has(n)) ?? 'X'
    const tri = [v, e.a, e.b]
    const known = pick.tris.find((t) => tri.every((x) => t.includes(x)))
    if (known) {
      // tam giác có sẵn trên hình (2D: tam giác mẫu không cần ghi "trong")
      lines.push(`${kind.cmd} ${v}${name}${pick.tris.length === 1 ? '' : ` trong ${known.join('')}`}`)
      return
    }
    // đỉnh và cạnh không cùng một mặt tam giác: vẫn dựng được, ghi rõ tam giác
    lines.push(`${kind.cmd} ${v}${name} trong ${tri.join('')}`)
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
            setMenu(null)
            const { p, k } = toVb(e)
            const hit = hitTest(p, k)
            if (!hit) return
            e.currentTarget.setPointerCapture(e.pointerId)
            setDrag({ from: hit, to: p })
          }}
          onPointerMove={(e) => {
            const { p, k } = toVb(e)
            const hit = hitTest(p, k, drag?.from)
            setHover(hit)
            if (drag) setDrag({ ...drag, to: hit?.at ?? p })
          }}
          onPointerUp={(e) => {
            if (!drag) return
            setHover(null)
            const { p, k } = toVb(e)
            const moved = Math.hypot(p.x - drag.from.at.x, p.y - drag.from.at.y) > 12 * k
            const end = moved ? hitTest(p, k, drag.from) : null
            if (!moved && drag.from.kind === 'point' && pick.tris.some((t) => t.includes((drag.from as { name: string }).name))) {
              setDrag(null)
              setMenu({ name: drag.from.name, at: drag.from.at })
              return
            }
            const lines: string[] = []
            if (drag.from.kind === 'point' && end?.kind === 'edge' && end.special) {
              special(drag.from.name, end, lines)
              setDrag(null)
              commit(lines)
              return
            }
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
                  {hover.special ? `${SPECIAL_LABEL[hover.special]} từ ${drag?.from.kind === 'point' ? drag.from.name : ''}` : Math.abs(hover.t - 1 / 2) < 1e-9 ? `trung điểm ${hover.a}${hover.b}` : `${ratioText(hover.t)} ${hover.a}${hover.b} (từ ${hover.a})`}
                </text>
              )}
            </g>
          )}
        </svg>
        {menu && (
          <VertexMenu
            name={menu.name}
            tris={pick.tris.filter((t) => t.includes(menu.name))}
            single={pick.tris.length === 1}
            used={used}
            left={((menu.at.x - minX) / w) * 100}
            top={((menu.at.y - minY) / h) * 100}
            onPick={(line) => {
              setMenu(null)
              commit([line])
            }}
            onClose={() => setMenu(null)}
          />
        )}
      </div>
      {extras.trim() && (
        <button type="button" onClick={undo} className="flex items-center gap-1 text-[12px] text-clay hover:underline">
          <Undo2 className="size-3.5" /> Bỏ thao tác vừa rồi
        </button>
      )}
    </div>
  )
}

const KINDS: Array<{ cmd: string; label: string; prefer: string[] }> = [
  { cmd: 'đường cao', label: 'Đường cao', prefer: ['H', 'K', 'E', 'F'] },
  { cmd: 'trung tuyến', label: 'Trung tuyến', prefer: ['M', 'N', 'P', 'Q'] },
  { cmd: 'phân giác', label: 'Phân giác', prefer: ['D', 'E', 'F', 'L'] },
]

function VertexMenu({
  name,
  tris,
  single,
  used,
  left,
  top,
  onPick,
  onClose,
}: {
  name: string
  tris: string[][]
  single: boolean
  used: Set<string>
  left: number
  top: number
  onPick: (line: string) => void
  onClose: () => void
}) {
  const free = (prefer: string[]) => [...prefer, ...NAME_POOL].find((n) => !used.has(n)) ?? 'X'
  return (
    <div
      role="menu"
      className="absolute z-10 min-w-[190px] rounded-[8px] border border-line bg-surface p-1 text-[13px] shadow-float"
      style={{ left: `${left}%`, top: `${top}%`, transform: `translate(${left > 60 ? '-100%' : '8px'}, 8px)` }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <p className="px-2 pb-1 pt-0.5 text-[11.5px] font-semibold text-ink-3">Kẻ từ đỉnh {name}</p>
      {tris.map((t) => (
        <div key={t.join('')}>
          {!single && <p className="px-2 pt-1 text-[11px] text-ink-4">trong tam giác {t.join('')}</p>}
          {KINDS.map((k) => {
            const n = free(k.prefer)
            return (
              <button
                key={k.cmd}
                type="button"
                role="menuitem"
                onClick={() => onPick(`${k.cmd} ${name}${n}${single ? '' : ` trong ${t.join('')}`}`)}
                className="flex w-full items-center justify-between gap-3 rounded-[5px] px-2 py-1.5 text-left text-ink-2 hover:bg-clay-tint hover:text-clay"
              >
                {k.label}
                <span className="font-serif italic text-ink-3">
                  {name}
                  {n}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
