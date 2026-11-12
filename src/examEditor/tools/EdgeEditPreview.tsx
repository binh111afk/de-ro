/**
 * Chế độ "Chỉnh cạnh" cho Hình học phẳng (2D) và Hình học không gian (3D):
 * Hiện nút tròn ở các điểm gốc (đỉnh mẫu, điểm theo toạ độ — các đầu chung cạnh
 * gộp thành 1 nút). Kéo nút để đổi vị trí đỉnh (3D: mặc định kéo ngang theo z
 * hiện tại, giữ Shift để kéo thẳng đứng đổi z), hít + vẽ đường gióng nét đứt bằng
 * lớp phủ SVG trên DOM cho mượt, thả chuột mới ghi toạ độ vào ô "Dựng thêm".
 * Giữ Alt để tắt hít.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { svgDataUrl } from '@/lib/plot'
import type { ToolImage } from '@/lib/toolSpec'
import {
  fitCoordTransform,
  fitCoordTransform3d,
  getDrag3dBehavior,
  savePointCoord,
  savePointsCoord3d,
  snapDragPoint,
  snapDragPoint3d,
  type P3,
  type Pt,
  type Snap3dResult,
  type SnapResult,
} from './edgeSnap'

type DragState =
  | {
      kind: '2d'
      name: string
      startPtVb: Pt
      offsetVb: Pt
      lastClient: { x: number; y: number }
      lastSnap: SnapResult
    }
  | {
      kind: '3d'
      name: string
      startPtVb: Pt
      offsetVb: Pt
      anchorReal: P3
      anchorRawVb: Pt
      allowVert: boolean
      lastShift: boolean
      lastClient: { x: number; y: number }
      lastSnap: Snap3dResult
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
  const is3d = pick.points.some((p) => p.v.length >= 3)

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
  const xform2d = useMemo(() => (is3d ? null : fitCoordTransform(pick.points)), [is3d, pick.points])
  const xform3d = useMemo(() => (is3d ? fitCoordTransform3d(pick.points) : null), [is3d, pick.points])

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

  const paintDragDom = (d: DragState, k: number, clientX: number, clientY: number, rect: DOMRect) => {
    const f = (n: number) => n.toFixed(1)
    const snap = d.lastSnap
    const movedPts = new Map<string, Pt>()
    if (d.kind === '3d') {
      for (const [name, info] of d.lastSnap.moved) movedPts.set(name, info.vb)
    } else {
      movedPts.set(d.name, snap.vb)
    }

    for (const s of segRefs.current) {
      if (!s.el) continue
      const pa = movedPts.get(s.a) ?? ptMap.get(s.a)
      const pb = movedPts.get(s.b) ?? ptMap.get(s.b)
      if (pa) {
        s.el.setAttribute('x1', f(pa.x))
        s.el.setAttribute('y1', f(pa.y))
      }
      if (pb) {
        s.el.setAttribute('x2', f(pb.x))
        s.el.setAttribute('y2', f(pb.y))
      }
    }
    for (const [name, hEl] of handleRefs.current) {
      const p = movedPts.get(name) ?? ptMap.get(name)
      if (p) {
        hEl.setAttribute('cx', f(p.x))
        hEl.setAttribute('cy', f(p.y))
      }
    }
    if (dotRef.current) {
      dotRef.current.setAttribute('cx', f(snap.vb.x))
      dotRef.current.setAttribute('cy', f(snap.vb.y))
    }
    if (guidesRef.current) {
      guidesRef.current.setAttribute('d', snap.guides.map((g) => `M${f(g.x1)} ${f(g.y1)}L${f(g.x2)} ${f(g.y2)}`).join(''))
    }
    if (rightsRef.current) {
      if (d.kind === '2d') {
        const sz = 10 * k
        const paths = d.lastSnap.rightMarks.map(({ at, u, v }) => {
          const lu = Math.hypot(u.x - at.x, u.y - at.y) || 1
          const lv = Math.hypot(v.x - at.x, v.y - at.y) || 1
          const dux = ((u.x - at.x) / lu) * sz
          const duy = ((u.y - at.y) / lu) * sz
          const dvx = ((v.x - at.x) / lv) * sz
          const dvy = ((v.y - at.y) / lv) * sz
          return `M${f(at.x + dux)} ${f(at.y + duy)}L${f(at.x + dux + dvx)} ${f(at.y + duy + dvy)}L${f(at.x + dvx)} ${f(at.y + dvy)}`
        })
        rightsRef.current.setAttribute('d', paths.join(''))
      } else {
        rightsRef.current.setAttribute('d', '')
      }
    }
    if (tipRef.current) {
      tipRef.current.textContent = snap.readouts.join('\n')
      const tipW = tipRef.current.offsetWidth || 160
      const tipH = tipRef.current.offsetHeight || 36
      const lx = Math.max(6, Math.min(rect.width - tipW - 6, clientX - rect.left + 14))
      const ly = Math.max(6, Math.min(rect.height - tipH - 6, clientY - rect.top - 16))
      tipRef.current.style.left = `${lx}px`
      tipRef.current.style.top = `${ly}px`
    }
  }

  const runSnap = (d: DragState, clientX: number, clientY: number, altKey: boolean, shiftKey: boolean) => {
    if (!box.current) return
    const { p, k, rect } = toVb(clientX, clientY)
    const rawVb = { x: p.x + d.offsetVb.x, y: p.y + d.offsetVb.y }
    if (d.kind === '2d') {
      const snap = snapDragPoint({
        dragName: d.name,
        rawVb,
        points: pick.points,
        segs: pick.segs,
        xform: xform2d!,
        pxSize: k,
        altKey,
        viewBox: { minX, minY, w, h },
      })
      d.lastClient = { x: clientX, y: clientY }
      d.lastSnap = snap
    } else {
      const xf = xform3d!
      const vert = d.allowVert && shiftKey
      if (vert !== d.lastShift) {
        d.anchorReal = [...d.lastSnap.real] as P3
        d.anchorRawVb = rawVb
        d.lastShift = vert
      }
      let rawReal: P3
      if (vert) {
        const dz = -(rawVb.y - d.anchorRawVb.y) / xf.scale
        rawReal = [d.anchorReal[0], d.anchorReal[1], d.anchorReal[2] + dz]
      } else {
        const anchorVb = xf.toVb(d.anchorReal)
        const effVb = { x: anchorVb.x + (rawVb.x - d.anchorRawVb.x), y: anchorVb.y + (rawVb.y - d.anchorRawVb.y) }
        rawReal = xf.toRealHoriz(effVb, d.anchorReal[2])
      }
      const snap = snapDragPoint3d({
        dragName: d.name,
        rawReal,
        mode: vert ? 'vert' : 'horiz',
        points: pick.points,
        segs: pick.segs,
        origins: pick.origins,
        base: pick.base,
        top: pick.top,
        footOf: pick.footOf,
        xform: xf,
        pxSize: k,
        altKey,
        viewBox: { minX, minY, w, h },
      })
      d.lastClient = { x: clientX, y: clientY }
      d.lastSnap = snap
    }
    paintDragDom(d, k, clientX, clientY, rect)
  }

  const finishDrag = (clientX: number, clientY: number, altKey: boolean, shiftKey: boolean) => {
    const d = dragRef.current
    if (!d) return
    runSnap(d, clientX, clientY, altKey, shiftKey)
    const { k } = toVb(clientX, clientY)
    const finalSnap = d.lastSnap
    dragRef.current = null
    if (imgRef.current) imgRef.current.style.opacity = '1'
    setDraggingName(null)
    setHover(null)
    if (Math.hypot(finalSnap.vb.x - d.startPtVb.x, finalSnap.vb.y - d.startPtVb.y) > 2 * k) {
      if (d.kind === '2d') {
        onExtras(savePointCoord(extras, d.name, d.lastSnap.real[0], d.lastSnap.real[1], d.lastSnap.snapped))
      } else {
        onExtras(savePointsCoord3d(extras, d.lastSnap.savePoints, d.lastSnap.mode, d.lastSnap.snapped))
      }
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
      if (d && (e.key === 'Alt' || e.key === 'Shift')) {
        latestRef.current.runSnap(d, d.lastClient.x, d.lastClient.y, e.altKey, e.shiftKey)
      }
    }
    const onWinUp = (e: PointerEvent) => latestRef.current.finishDrag(e.clientX, e.clientY, e.altKey, e.shiftKey)
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
    paintDragDom(d, k, d.lastClient.x, d.lastClient.y, rect)
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
            if (is3d) {
              const behavior = getDrag3dBehavior({ dragName: name, base: pick.base, top: pick.top, footOf: pick.footOf })
              const startReal: P3 = [pt.v[0], pt.v[1], pt.v[2] ?? 0]
              const lastShift = behavior.allowVert && e.shiftKey
              const snap = snapDragPoint3d({
                dragName: name,
                rawReal: startReal,
                mode: lastShift ? 'vert' : 'horiz',
                points: pick.points,
                segs: pick.segs,
                origins: pick.origins,
                base: pick.base,
                top: pick.top,
                footOf: pick.footOf,
                xform: xform3d!,
                pxSize: k,
                altKey: e.altKey,
                viewBox: { minX, minY, w, h },
              })
              dragRef.current = {
                kind: '3d',
                name,
                startPtVb,
                offsetVb,
                anchorReal: startReal,
                anchorRawVb: startPtVb,
                allowVert: behavior.allowVert,
                lastShift,
                lastClient: { x: e.clientX, y: e.clientY },
                lastSnap: snap,
              }
            } else {
              const snap = snapDragPoint({
                dragName: name,
                rawVb: startPtVb,
                points: pick.points,
                segs: pick.segs,
                xform: xform2d!,
                pxSize: k,
                altKey: e.altKey,
                viewBox: { minX, minY, w, h },
              })
              dragRef.current = {
                kind: '2d',
                name,
                startPtVb,
                offsetVb,
                lastClient: { x: e.clientX, y: e.clientY },
                lastSnap: snap,
              }
            }
            if (imgRef.current) imgRef.current.style.opacity = '0.22'
            setDraggingName(name)
          }}
          onPointerMove={(e) => {
            const d = dragRef.current
            if (d) {
              runSnap(d, e.clientX, e.clientY, e.altKey, e.shiftKey)
              return
            }
            const { p, k } = toVb(e.clientX, e.clientY)
            setHover(hitHandle(p, k))
          }}
          onPointerUp={(e) => finishDrag(e.clientX, e.clientY, e.altKey, e.shiftKey)}
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
