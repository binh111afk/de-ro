/**
 * Chế độ "Chỉnh cạnh" cho Hình học phẳng:
 * Hiện nút tròn ở các điểm gốc (đỉnh mẫu, điểm theo toạ độ — các đầu chung cạnh
 * gộp thành 1 nút). Kéo nút để xoay và đổi độ dài mọi cạnh nối vào nút đó,
 * hít + vẽ đường gióng nét đứt bằng lớp phủ SVG trên DOM cho mượt, thả chuột mới
 * ghi toạ độ vào ô "Dựng thêm". Giữ Alt để tắt hít.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { svgDataUrl } from '@/lib/plot'
import type { ToolImage } from '@/lib/toolSpec'
import { fitCoordTransform, savePointCoord, snapDragPoint, type Pt, type SnapResult } from './edgeSnap'

interface DragState {
  name: string
  startPtVb: Pt
  offsetVb: Pt
  lastClient: { x: number; y: number }
  lastSnap: SnapResult
}

export function EdgeEditPreview({ img, extras, onExtras }: { img: ToolImage; extras: string; onExtras: (v: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const guidesRef = useRef<SVGPathElement>(null)
  const rightsRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const handleRefs = useRef<Map<string, SVGCircleElement>>(new Map())
  const segRefs = useRef<Array<{ a: string; b: string; el: SVGLineElement | null }>>([])

  const [hover, setHover] = useState<string | null>(null)
  const [draggingName, setDraggingName] = useState<string | null>(null)

  const vbMatch = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(img.svg)
  const [minX, minY, w, h] = vbMatch ? vbMatch.slice(1).map(Number) : [0, 0, img.width, img.height]
  const pick = img.pick ?? { points: [], segs: [], tris: [] as string[][] }

  // Tỉ lệ px trên một đơn vị viewBox, chốt một lần khi vào chế độ: hình chiếm ~70% khung,
  // chừa chỗ trống xung quanh để kéo cạnh dài ra mà không bị khung che.
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)
  useLayoutEffect(() => {
    const r = outer.current?.getBoundingClientRect()
    if (r && r.width > 0 && r.height > 0) setScale(0.7 * Math.min(r.width / w, r.height / h))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const originSet = useMemo(() => new Set(pick.origins ?? []), [pick.origins])
  const handles = useMemo(() => pick.points.filter((p) => originSet.has(p.name)), [pick.points, originSet])
  const ptMap = useMemo(() => new Map(pick.points.map((p) => [p.name, p])), [pick.points])
  const xform = useMemo(() => fitCoordTransform(pick.points), [pick.points])

  const k0 = box.current ? w / box.current.getBoundingClientRect().width : w / 500

  const toVb = (clientX: number, clientY: number): { p: Pt; k: number; rect: DOMRect } => {
    const rect = box.current!.getBoundingClientRect()
    const k = w / rect.width
    return { p: { x: minX + (clientX - rect.left) * k, y: minY + (clientY - rect.top) * k }, k, rect }
  }

  const hitHandle = (p: Pt, k: number): string | null => {
    let best: string | null = null
    let bd = 12 * k
    for (const q of handles) {
      const d = Math.hypot(q.x - p.x, q.y - p.y)
      if (d < bd) {
        bd = d
        best = q.name
      }
    }
    return best
  }

  const paintDragDom = (d: DragState, snap: SnapResult, k: number, clientX: number, clientY: number, rect: DOMRect) => {
    const { vb } = snap
    const f = (n: number) => n.toFixed(1)
    for (const s of segRefs.current) {
      if (!s.el) continue
      if (s.a === d.name) {
        s.el.setAttribute('x1', f(vb.x))
        s.el.setAttribute('y1', f(vb.y))
      } else if (s.b === d.name) {
        s.el.setAttribute('x2', f(vb.x))
        s.el.setAttribute('y2', f(vb.y))
      }
    }
    const hEl = handleRefs.current.get(d.name)
    if (hEl) {
      hEl.setAttribute('cx', f(vb.x))
      hEl.setAttribute('cy', f(vb.y))
    }
    if (dotRef.current) {
      dotRef.current.setAttribute('cx', f(vb.x))
      dotRef.current.setAttribute('cy', f(vb.y))
    }
    if (guidesRef.current) {
      guidesRef.current.setAttribute('d', snap.guides.map((g) => `M${f(g.x1)} ${f(g.y1)}L${f(g.x2)} ${f(g.y2)}`).join(''))
    }
    if (rightsRef.current) {
      const sz = 10 * k
      const paths = snap.rightMarks.map(({ at, u, v }) => {
        const lu = Math.hypot(u.x - at.x, u.y - at.y) || 1
        const lv = Math.hypot(v.x - at.x, v.y - at.y) || 1
        const dux = ((u.x - at.x) / lu) * sz
        const duy = ((u.y - at.y) / lu) * sz
        const dvx = ((v.x - at.x) / lv) * sz
        const dvy = ((v.y - at.y) / lv) * sz
        return `M${f(at.x + dux)} ${f(at.y + duy)}L${f(at.x + dux + dvx)} ${f(at.y + duy + dvy)}L${f(at.x + dvx)} ${f(at.y + dvy)}`
      })
      rightsRef.current.setAttribute('d', paths.join(''))
    }
    if (tipRef.current) {
      tipRef.current.textContent = snap.readouts.join('\n')
      const lx = Math.max(6, Math.min(rect.width - 150, clientX - rect.left + 14))
      const ly = Math.max(6, Math.min(rect.height - 36, clientY - rect.top - 16))
      tipRef.current.style.left = `${lx}px`
      tipRef.current.style.top = `${ly}px`
    }
  }

  const runSnap = (d: DragState, clientX: number, clientY: number, altKey: boolean) => {
    if (!box.current) return
    const { p, k, rect } = toVb(clientX, clientY)
    const rawVb = { x: p.x + d.offsetVb.x, y: p.y + d.offsetVb.y }
    const snap = snapDragPoint({
      dragName: d.name,
      rawVb,
      points: pick.points,
      segs: pick.segs,
      xform,
      pxSize: k,
      altKey,
      viewBox: { minX, minY, w, h },
    })
    d.lastClient = { x: clientX, y: clientY }
    d.lastSnap = snap
    paintDragDom(d, snap, k, clientX, clientY, rect)
  }

  const finishDrag = (clientX: number, clientY: number, altKey: boolean) => {
    const d = dragRef.current
    if (!d) return
    runSnap(d, clientX, clientY, altKey)
    const { k } = toVb(clientX, clientY)
    const finalSnap = d.lastSnap
    dragRef.current = null
    if (imgRef.current) imgRef.current.style.opacity = '1'
    setDraggingName(null)
    setHover(null)
    if (Math.hypot(finalSnap.vb.x - d.startPtVb.x, finalSnap.vb.y - d.startPtVb.y) > 2 * k) {
      onExtras(savePointCoord(extras, d.name, finalSnap.real[0], finalSnap.real[1], finalSnap.snapped))
    }
  }

  const cancelDrag = () => {
    if (!dragRef.current) return
    dragRef.current = null
    if (imgRef.current) imgRef.current.style.opacity = '1'
    setDraggingName(null)
    setHover(null)
  }

  const latestRef = useRef<{ runSnap: typeof runSnap; finishDrag: typeof finishDrag }>({ runSnap, finishDrag })
  latestRef.current = { runSnap, finishDrag }

  useEffect(() => {
    if (!draggingName) return
    const onKey = (e: KeyboardEvent) => {
      const d = dragRef.current
      if (d && e.key === 'Alt') latestRef.current.runSnap(d, d.lastClient.x, d.lastClient.y, e.altKey)
    }
    const onWinUp = (e: PointerEvent) => latestRef.current.finishDrag(e.clientX, e.clientY, e.altKey)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('pointerup', onWinUp, { once: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('pointerup', onWinUp)
    }
  }, [draggingName])

  // vẽ lần đầu khi vừa bật lớp DOM live (ngay sau pointerdown)
  useEffect(() => {
    const d = dragRef.current
    if (!draggingName || !d || !box.current) return
    const { k, rect } = toVb(d.lastClient.x, d.lastClient.y)
    paintDragDom(d, d.lastSnap, k, d.lastClient.x, d.lastClient.y, rect)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingName])

  return (
    <div
      ref={outer}
      className="flex h-full w-full flex-col items-center justify-center rounded-[4px] border border-line bg-white"
      style={{ containerType: 'size' }}
    >
      <div
        ref={box}
        className="relative select-none"
        style={{
          aspectRatio: `${w} / ${h}`,
          // giữ tỉ lệ px/đơn vị cố định suốt lúc chỉnh: cạnh kéo dài thì hình to ra thật, chỉ co lại khi chạm mép khung
          width: scale ? `min(100cqw, 100cqh * ${w / h}, ${w * scale}px)` : `min(100cqw, 100cqh * ${w / h})`,
        }}
      >
        <img
          ref={imgRef}
          src={svgDataUrl(img.svg)}
          alt="Xem trước"
          draggable={false}
          className="block h-full w-full transition-opacity duration-75"
        />
        <svg
          viewBox={`${minX} ${minY} ${w} ${h}`}
          className="absolute inset-0 h-full w-full touch-none overflow-visible"
          style={{ cursor: draggingName ? 'grabbing' : hover ? 'grab' : 'default' }}
          onPointerDown={(e) => {
            const { p, k } = toVb(e.clientX, e.clientY)
            const name = hitHandle(p, k)
            if (!name) return
            const pt = ptMap.get(name)
            if (!pt) return
            e.currentTarget.setPointerCapture(e.pointerId)
            segRefs.current = []
            const startPtVb = { x: pt.x, y: pt.y }
            const offsetVb = { x: pt.x - p.x, y: pt.y - p.y }
            const snap = snapDragPoint({
              dragName: name,
              rawVb: startPtVb,
              points: pick.points,
              segs: pick.segs,
              xform,
              pxSize: k,
              altKey: e.altKey,
              viewBox: { minX, minY, w, h },
            })
            dragRef.current = {
              name,
              startPtVb,
              offsetVb,
              lastClient: { x: e.clientX, y: e.clientY },
              lastSnap: snap,
            }
            if (imgRef.current) imgRef.current.style.opacity = '0.22'
            setDraggingName(name)
          }}
          onPointerMove={(e) => {
            const d = dragRef.current
            if (d) {
              runSnap(d, e.clientX, e.clientY, e.altKey)
              return
            }
            const { p, k } = toVb(e.clientX, e.clientY)
            setHover(hitHandle(p, k))
          }}
          onPointerUp={(e) => finishDrag(e.clientX, e.clientY, e.altKey)}
          onPointerCancel={cancelDrag}
          onPointerLeave={() => !dragRef.current && setHover(null)}
        >
          {draggingName && (
            <g>
              {pick.segs.map((s, idx) => {
                const A = ptMap.get(s.a)
                const B = ptMap.get(s.b)
                if (!A || !B) return null
                return (
                  <line
                    key={`${s.a}-${s.b}-${idx}`}
                    ref={(el) => {
                      segRefs.current[idx] = { a: s.a, b: s.b, el }
                    }}
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    stroke="#222"
                    strokeWidth={1.6 * k0}
                    strokeLinecap="round"
                  />
                )
              })}
              <path
                ref={guidesRef}
                fill="none"
                stroke="var(--color-clay)"
                strokeWidth={1.2 * k0}
                strokeDasharray={`${5 * k0} ${4 * k0}`}
                strokeOpacity={0.85}
              />
              <path ref={rightsRef} fill="none" stroke="var(--color-clay)" strokeWidth={1.3 * k0} />
              <circle ref={dotRef} r={2.4 * k0} fill="#222" />
            </g>
          )}
          {handles.map((q) => {
            const active = draggingName === q.name || hover === q.name
            return (
              <circle
                key={q.name}
                ref={(el) => {
                  if (el) handleRefs.current.set(q.name, el)
                  else handleRefs.current.delete(q.name)
                }}
                cx={q.x}
                cy={q.y}
                r={(active ? 7.2 : 5.2) * k0}
                fill="#fff"
                stroke="var(--color-clay)"
                strokeWidth={2 * k0}
              />
            )
          })}
        </svg>
        {draggingName && (
          <div
            ref={tipRef}
            className="pointer-events-none absolute z-10 whitespace-pre rounded-[6px] border border-clay-line bg-surface/95 px-2 py-1 font-mono text-[11.5px] font-medium text-ink shadow-soft"
          />
        )}
      </div>
    </div>
  )
}
