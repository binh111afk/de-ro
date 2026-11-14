/** Bảng vẽ — định nghĩa giao diện: icon, danh sách bút / hình / giấy, các nút và ô chọn nhỏ. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { isDarkPaper, paperBg, type Kind, type Paper, type PenKind, type Pt, type FillStyle } from './scene'
import { penOutline, svgPathFromStroke } from './render'
import { createPortal } from 'react-dom'
import { splitTipKbd } from '@/components/Tooltip'
import { useAnimatedPresence } from '@/lib/useAnimatedPresence'
import { type Tip } from './boardModel'

/* ---------- định nghĩa giao diện ---------- */

export type Main = 'pen' | 'eraser' | 'laser' | 'select' | 'shape' | 'bucket' | 'text' | 'hand'

export const ERASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><g transform="rotate(-40 13 13)"><rect x="5" y="8" width="17" height="10" rx="2.5" fill="#f4a3a8" stroke="#3f3f46" stroke-width="1.3"/><rect x="5" y="8" width="6" height="10" rx="2.5" fill="#e5e7eb" stroke="#3f3f46" stroke-width="1.3"/></g></svg>'
export const LASER_COLORS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2']
export const LASER_SIZES = [0.6, 1, 1.6, 2.4]
export const LASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="7" fill="#ff3b30" fill-opacity="0.25"/><circle cx="9" cy="9" r="3.5" fill="#ff3b30" stroke="white" stroke-width="1.2"/></svg>'
export const KIND_LABEL: Record<Kind, string> = {
  rectangle: 'Hình chữ nhật', ellipse: 'Hình elip', diamond: 'Hình thoi', line: 'Đường thẳng', arrow: 'Mũi tên',
  freedraw: 'Nét bút', text: 'Chữ', image: 'Hình vẽ công cụ',
}
export const TOOL_LABEL: Record<string, string> = {
  graph: 'đồ thị', vartable: 'bảng biến thiên', signtable: 'bảng xét dấu', oxy: 'hệ trục Oxy', geo2d: 'hình phẳng', geo3d: 'hình không gian',
  stats: 'biểu đồ', circuit: 'mạch điện', motion: 'đồ thị chuyển động', incline: 'mặt phẳng nghiêng', gas: 'đồ thị trạng thái khí',
  scene: 'hình minh hoạ', electron: 'cấu hình electron', struct: 'công thức cấu tạo', chemgraph: 'đồ thị số mol', chemeq: 'phương trình hoá học', trig: 'đường tròn lượng giác',
  probtree: 'sơ đồ cây', numberline: 'trục số', venn: 'biểu đồ Ven', grouped: 'bảng ghép nhóm', table: 'bảng',
  phase: 'đồ thị chuyển thể', osc: 'đồ thị dao động', lens: 'thấu kính', foodweb: 'lưới thức ăn', pedigree: 'sơ đồ phả hệ', punnett: 'bảng lai',
}

/** nét bút AI vẽ theo dạng có sẵn (tròn, elip, sóng, sao, đa giác) */
export function curvePoints(cv: Record<string, unknown>, dx: number, dy: number): Pt[] {
  const n = (k: string, d: number) => (typeof cv[k] === 'number' && Number.isFinite(cv[k]) ? (cv[k] as number) : d)
  const cx = n('cx', dx), cy = n('cy', dy)
  const out: Pt[] = []
  switch (cv.type) {
    case 'circle':
    case 'ellipse': {
      const rx = n('rx', n('r', 60)), ry = n('ry', n('r', 60))
      for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]) }
      break
    }
    case 'wave': {
      const len = n('len', 300), amp = n('amp', 20), waves = n('n', 3)
      for (let i = 0; i <= 120; i++) { const t = i / 120; out.push([cx - len / 2 + t * len, cy + amp * Math.sin(t * Math.PI * 2 * waves)]) }
      break
    }
    case 'star': {
      const r = n('r', 60), k = Math.max(3, Math.round(n('n', 5)))
      for (let i = 0; i <= k * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / k, rr = i % 2 ? r * 0.45 : r; out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]) }
      break
    }
    case 'polygon': {
      const P = Array.isArray(cv.points) ? (cv.points as unknown[]).filter((p): p is number[] => Array.isArray(p)).map((p) => [Number(p[0]), Number(p[1])] as Pt) : []
      if (P.length) out.push(...P, P[0])
      else {
        const r = n('r', 60), k = Math.max(3, Math.round(n('n', 6)))
        for (let i = 0; i <= k; i++) { const a = -Math.PI / 2 + (i / k) * Math.PI * 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
      }
      break
    }
  }
  return out
}

/** chèn thêm điểm giữa các đỉnh xa nhau để nét bút (perfect-freehand) đều và trơn */
export function densify(P: Pt[]): Pt[] {
  const out: Pt[] = [P[0]]
  for (let i = 1; i < P.length; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i]
    const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6))
    for (let j = 1; j <= k; j++) out.push([ax + ((bx - ax) * j) / k, ay + ((by - ay) * j) / k])
  }
  return out
}

export type SideTab = 'ai' | 'tools'
export const SIDE_W = 360
export const WRENCH_D = 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3.6 17.4a1.4 1.4 0 0 0 2 2l5.7-5.7a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-.5-.5-2z'
export const PEN_D = 'M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16zM14 7l3 3'
export const ERASER_D = 'M8 20h12M5.5 14.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8l-2.5-2.5a1.5 1.5 0 0 1 0-2z'
export const LASER_D = 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1'
export const SELECT_D = 'M5 3l14 7-6 2-2 6z'
/** khoanh tự do: lucide lasso-select */
export const LASSO_D = 'M7 22a5 5 0 0 1-2-4M7 16.93c.96.43 1.96.74 2.99.91M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8a7.19 7.19 0 0 1-.33 2M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14.33 22h-.09a.35.35 0 0 1-.24-.32v-10a.34.34 0 0 1 .33-.34c.08 0 .15.03.21.08l7.34 6a.33.33 0 0 1-.21.59h-4.49l-2.57 3.85a.35.35 0 0 1-.28.14z'
export const SHAPE_D = 'M3 3h9v9H3zM16.5 12a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z'
export const TEXT_D = 'M5 6V4h14v2M12 4v16m-3 0h6'
export const DOT_SIZES = [4, 6, 8, 10, 12, 14]
/** thùng sơn: vẽ lại dạng nét viền theo icons/paint-bucket.svg */
export const BUCKET_D = 'M10.6 4.6L19 13l-7.3 7.3a1.6 1.6 0 0 1-2.2 0l-6.2-6.2a1.6 1.6 0 0 1 0-2.2zM3 13h15.5M5.4 9.8a3.6 3.6 0 1 1 5.2-5.2M20.5 15.5s2 2.3 2 3.6a2 2 0 1 1-4 0c0-1.3 2-3.6 2-3.6z'
export const HAND_D = 'M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.9-2.5L3.6 13a1.5 1.5 0 0 1 2.4-1.8L8 13'

export const UNDO_D = 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3'
export const REDO_D = 'M15 14l5-5-5-5m5 5H9a5 5 0 0 0 0 10h3'
export const PLUS_D = 'M12 5v14M5 12h14'
export const IMG_D = 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01'
export const PDF_NOTE_D = 'M6 3h9l4 4v14H6zM14 3v5h5M9 17l5-5 2 2-5 5H9z'
export const EXPORT_D = 'M12 4v11M7 10l5 5 5-5M5 20h14'
export const PAPER_D = 'M6 3h9l4 4v14H6zM14 3v5h5'
export const RULER_D = 'M3 15.5L15.5 3l5.5 5.5L8.5 21zM7 11.5l2 2M10 8.5l1.5 1.5M13 5.5l2 2M5.5 14l1 1M11.5 10l1 1'
/** bút máy: vẽ lại dạng nét viền theo icons/pen-nib.svg */
export const FOUNTAIN_D = 'M13 6l-5.2 1.5a2.4 2.4 0 0 0-1.7 1.8L3 21l11.7-3.1a2.4 2.4 0 0 0 1.8-1.7L18 11M13 6l2.2-2.2a1.3 1.3 0 0 1 1.8 0l3.2 3.2a1.3 1.3 0 0 1 0 1.8L18 11M13 6l5 5M3 21l5.4-5.4M11 14.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0'
// viên phấn nghiêng (vẽ lại dạng nét từ icons/chalk-goc.svg): thân dài + đầu phấn mòn ở góc dưới trái
export const CHALK_D = 'M18.1 3.1 2 19.2l2 2h3.8L22 7Z'
/** outside = hiện thẳng ở hàng 2; còn lại nằm trong bảng "Kiểu bút" */
export const PENS: { id: PenKind; label: string; icon: string; outside?: boolean }[] = [
  { id: 'ball', label: 'Bút bi', icon: PEN_D, outside: true },
  { id: 'highlight', label: 'Dạ quang', icon: 'M9 11l-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4', outside: true },
  { id: 'fountain', label: 'Bút máy', icon: FOUNTAIN_D },
  { id: 'brush', label: 'Bút lông', icon: 'm9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z' },
  { id: 'pencil', label: 'Bút chì', icon: 'M4 20l1.5-4.5L16 5l3 3L8.5 18.5zM14 7l3 3M4 20l3-1' },
  { id: 'marker', label: 'Bút dạ', icon: 'M10 13l6.5-6.5 3.5 3.5-6.5 6.5zM16.5 6.5l1.4-1.4a1.6 1.6 0 0 1 2.2 0l1.3 1.3a1.6 1.6 0 0 1 0 2.2L20 10M10 13l-2.3 2.3 3.5 3.5 2.3-2.3M7.7 15.3L4 20.5l.5.5 5.2-3.7' },
  { id: 'chalk', label: 'Bút phấn', icon: CHALK_D },
]

export const CHALK_GRAIN_DOTS: [number, number, number, number, number][] = [
  [0, 0, 2, 2, 0.9], [3, 0, 2, 1.5, 0.55], [6, 1, 2, 2, 0.85], [9, 0, 2, 2, 0.6],
  [1, 3, 2, 2, 0.7], [4, 2, 1.5, 2, 0.95], [7, 3, 2, 1.5, 0.45], [10, 3, 2, 2, 0.85],
  [0, 5, 1.5, 2, 0.6], [2, 6, 2, 2, 0.9], [5, 5, 2, 2, 0.5], [8, 6, 2, 2, 0.85], [10, 6, 1.5, 1.5, 0.7],
  [1, 8, 2, 2, 0.8], [3, 9, 2, 1.5, 0.45], [6, 8, 2, 2, 0.95], [9, 9, 2, 2, 0.65],
  [0, 10, 2, 2, 0.75], [4, 10, 2, 2, 0.85], [7, 10, 1.5, 2, 0.55], [10, 10, 2, 1.5, 0.9],
]

/** bảng Kiểu bút: nét mẫu xem trước + các loại ngòi + độ nhọn / độ nhạy lực nhấn */
export function PenPanel({ pen, paper, color, width, tip, onPen, onTip }: {
  pen: PenKind; paper: Paper; color: string; width: number; tip: Tip; onPen: (p: PenKind) => void; onTip: (t: Tip) => void
}) {
  const label = PENS.find((p) => p.id === pen)?.label ?? ''
  // đường cong chữ S, lực nhấn tăng rồi giảm như khi viết thật
  const pts: number[][] = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    pts.push([24 + t * 232, 52 - Math.sin(t * Math.PI * 2 - 0.4) * 26, 0.25 + 0.7 * Math.sin(t * Math.PI)])
  }
  const d = svgPathFromStroke(penOutline(pts, { pen, width: Math.max(width, 1.5), sharp: tip.sharp, sens: tip.sens, real: true }))
  const tunable = pen !== 'highlight' && pen !== 'marker'
  const darkPreview = isDarkPaper(paper) || (pen === 'chalk' && (color.toLowerCase() === '#f5f3ea' || color.toLowerCase() === '#ffffff'))
  return (
    <div className="w-[min(300px,calc(100vw-40px))] space-y-3">
      <div className="text-[12px] font-medium text-ink-2">{label}</div>
      <div className="grid h-[104px] place-items-center rounded-[8px] border border-line"
        style={{ backgroundColor: isDarkPaper(paper) ? paperBg(paper) : darkPreview ? '#2b2f2e' : '#ffffff' }}>
        <svg className="w-full" height="104" viewBox="0 0 280 104">
          {pen === 'chalk' && (
            <defs>
              <pattern id="chalk-preview-grain" width="12" height="12" patternUnits="userSpaceOnUse">
                {CHALK_GRAIN_DOTS.map(([x, y, w, h, a], idx) => (
                  <rect key={idx} x={x} y={y} width={w} height={h} fill={color} fillOpacity={a} />
                ))}
              </pattern>
            </defs>
          )}
          <path d={d} fill={pen === 'chalk' ? 'url(#chalk-preview-grain)' : color} fillOpacity={pen === 'highlight' ? 0.45 : pen === 'pencil' ? 0.8 : 1} />
        </svg>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {PENS.filter((p) => !p.outside).map((p) => (
          <button key={p.id} type="button" onClick={() => onPen(p.id)} aria-pressed={pen === p.id}
            className={`flex flex-col items-center gap-1 rounded-[8px] py-2 text-[11px] ${pen === p.id ? 'bg-clay/15 font-medium text-clay' : 'text-ink hover:bg-sunken'}`}>
            <Ico d={p.icon} size={20} />
            {p.label}
          </button>
        ))}
      </div>
      {tunable && (
        <div className="space-y-2.5 border-t border-line pt-3">
          <Slider label="Độ nhọn ngòi" value={tip.sharp} onChange={(v) => onTip({ ...tip, sharp: v })} />
          <Slider label="Độ nhạy lực nhấn" value={tip.sens} onChange={(v) => onTip({ ...tip, sens: v })} />
        </div>
      )}
    </div>
  )
}

export function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[11.5px] text-ink-3">
        <span>{label}</span>
        <span className="tnum">{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#b4532a]" />
    </label>
  )
}

/** thêm hình mới: khai báo ở đây và đưa vào một mục của SHAPE_SECTIONS */
export const SHAPE_DEFS: { id: Kind; label: string; short: string; kbd: string; icon: string }[] = [
  { id: 'rectangle', label: 'Hình chữ nhật', short: 'Chữ nhật', kbd: 'R', icon: 'M4 5h16v14H4z' },
  { id: 'ellipse', label: 'Hình tròn / elip', short: 'Tròn', kbd: 'O', icon: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z' },
  { id: 'diamond', label: 'Hình thoi', short: 'Thoi', kbd: 'D', icon: 'M12 3l9 9-9 9-9-9z' },
  { id: 'arrow', label: 'Mũi tên', short: 'Mũi tên', kbd: 'A', icon: 'M4 20L20 4m0 0h-8m8 0v8' },
  { id: 'line', label: 'Đường thẳng', short: 'Đường', kbd: 'L', icon: 'M4 20L20 4' },
]
export const SHAPE_BY_ID = Object.fromEntries(SHAPE_DEFS.map((d) => [d.id, d])) as Record<Kind, (typeof SHAPE_DEFS)[number]>
export const SHAPE_SECTIONS: { label: string; ids: Kind[] }[] = [
  { label: 'Khối cơ bản', ids: ['rectangle', 'ellipse', 'diamond'] },
  { label: 'Đường nối', ids: ['arrow', 'line'] },
]

/** cùng bảng màu với trình soạn thảo */
export const THEME_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

export const PAPERS: { id: Paper; label: string; bg?: string; color?: string }[] = [
  { id: 'plain', label: 'Trắng' },
  { id: 'grid', label: 'Kẻ ô', bg: 'linear-gradient(#e2ddd7 1px, transparent 1px), linear-gradient(90deg, #e2ddd7 1px, transparent 1px)' },
  { id: 'lines', label: 'Kẻ dòng', bg: 'linear-gradient(#cfe0ee 1px, transparent 1px)' },
  { id: 'dots', label: 'Chấm', bg: 'radial-gradient(#bdb6ae 1px, transparent 1.2px)' },
  { id: 'chalkboard', label: 'Bảng đen', color: '#2b2f2e', bg: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)' },
  { id: 'greenboard', label: 'Bảng xanh', color: '#2f4a3a', bg: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)' },
]

/** một nhóm tuỳ chọn ở tầng 2: nhãn nhỏ + các nút; vạch ngăn giữa các nhóm cao đều nhau */
/** "Trợ lý giấy" của app, bản nét rỗng (theo /brand/ai-static.svg) */
export function AiIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={size > 24 ? 2.6 : 4.4} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M17 22.6l-6.1 2.9a6.4 6.4 0 0 0-3.1 8.5l7.4 15.9" />
      <path d="M49.7 22.6l5.6 2.6a6.4 6.4 0 0 1 3.1 8.5l-7.6 16.3" />
      <path d="M24.1 7.6h14.1l11.5 11.5v26.9a7.7 7.7 0 0 1-7.7 7.7H24.1a7.7 7.7 0 0 1-7.7-7.7V15.3a7.7 7.7 0 0 1 7.7-7.7z" />
      <path d="M38.2 7.6v6.4a5.1 5.1 0 0 0 5.1 5.1h6.4" />
      <path d="M26.3 27.8v3.2M39.8 27.8v3.2" strokeWidth={size > 24 ? 4 : 6} />
      <path d="M26.7 39.7c3.6 3.8 9.2 3.8 12.8 0" />
    </svg>
  )
}

export function SideBtn({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" data-tip={label} aria-label={label} aria-pressed={on} onClick={onClick}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] transition-colors ${on ? 'bg-clay/10 text-clay' : 'text-ink hover:bg-sunken'}`}>
      {children}
      <span className="hidden whitespace-nowrap @[980px]:inline">{label}</span>
    </button>
  )
}

export function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="relative flex shrink-0 items-center gap-1 px-3 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-px before:-translate-y-1/2 before:bg-line first:before:hidden">
      {label && <span className="mr-1 whitespace-nowrap text-[11.5px] text-ink-3">{label}</span>}
      {children}
    </div>
  )
}

export function Chip({ active, disabled, onClick, onMouseDown, children, title, kbd: kbdProp }: { kbd?: string; active?: boolean; disabled?: boolean; onClick: () => void; onMouseDown?: (ev: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode; title?: string }) {
  const split = splitTipKbd(title ?? '')
  const tip = split.tip, kbd = kbdProp ?? split.kbd
  return (
    <button
      type="button" data-tip={tip || undefined} data-tip-kbd={kbd} aria-label={tip || undefined} disabled={disabled}
      onClick={onClick} onMouseDown={onMouseDown} aria-pressed={active}
      className={`flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 text-[12.5px] transition-colors disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:min-w-8 sm:px-2 ${active ? 'bg-clay/10 text-clay' : 'text-ink hover:bg-sunken'}`}
    >
      {children}
    </button>
  )
}

export function Toggle({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  const { tip, kbd } = splitTipKbd(title ?? '')
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} data-tip={tip || undefined} data-tip-kbd={kbd} className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[6px] px-2 text-[12.5px] text-ink hover:bg-sunken sm:h-8">
      <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? 'bg-clay' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      {children}
    </button>
  )
}

export function Pop({ id, pop, setPop, title, face, children, align, className, btnClassName }: {
  id: string; pop: string | null; setPop: (p: string | null) => void; title: string; face: ReactNode; children: ReactNode; align?: 'right'; className?: string; btnClassName?: string
}) {
  const open = pop === id
  const popAnim = useAnimatedPresence(open, 140)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const btn = btnRef.current
      const panel = panelRef.current
      if (!btn || !panel) return
      const br = btn.getBoundingClientRect()
      const pr = panel.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      const vh = document.documentElement.clientHeight
      const rawLeft = align === 'right' ? br.right - pr.width : br.left
      const left = Math.max(8, Math.min(rawLeft, vw - pr.width - 8))
      const top = Math.max(8, Math.min(br.bottom + 6, vh - pr.height - 8))
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
    }
    place()
    const ro = new ResizeObserver(place)
    if (panelRef.current) ro.observe(panelRef.current)
    window.addEventListener('resize', place)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [open, align])

  return (
    <div className={`relative ${className ?? ''}`} data-pop={id}>
      <button
        ref={btnRef}
        type="button" data-tip={title} aria-label={title} aria-expanded={open} onClick={() => setPop(open ? null : id)}
        className={`${btnClassName ?? 'flex h-9 min-w-9 items-center justify-center rounded-[7px] px-1.5 sm:h-8 sm:min-w-0 sm:px-1'} ${open ? 'bg-sunken' : 'hover:bg-sunken'}`}
      >
        {face}
      </button>
      {/* gắn vào body: thanh công cụ cuộn ngang (overflow) sẽ cắt mất bảng nếu để bên trong */}
      {popAnim.mounted && createPortal(
        <div
          ref={panelRef}
          data-pop={id}
          className={`fixed z-50 max-h-[calc(100dvh-120px)] max-w-[calc(100vw-16px)] space-y-2.5 overflow-auto rounded-[10px] border border-line bg-surface p-3 shadow-lift ${popAnim.closing ? 'pop-out' : 'pop-in'}`}
        >
          {children}
        </div>,
        document.body,
      )}
    </div>
  )
}

/** ô nhập mã màu (#rrggbb) + nút mở bảng màu của máy */
/** bảng màu đầy đủ + ô nhập mã màu; dùng cho màu nền (kéo thả được như ô màu thường) */
export function MoreColors({ value, onPick, onPreview, drag }: { value: string; onPick: (c: string) => void; onPreview: (c: string) => void; drag?: FillStyle }) {
  return (
    <>
      <div className="grid grid-cols-10 gap-1">
        {THEME_COLORS.map((c) => (
          <button key={c} type="button" data-tip={c} aria-label={c} onClick={() => onPick(c)}
            draggable={!!drag}
            onDragStart={drag ? (ev) => startFillDrag(ev, c, drag) : undefined}
            onDragEnd={drag ? () => { draggingFill = null } : undefined}
            className={`h-[18px] w-[18px] rounded-[3px] border border-black/10 hover:scale-110 ${value === c ? 'ring-2 ring-clay ring-offset-1' : ''}`} style={{ background: c }} />
        ))}
      </div>
      <HexInput value={value === 'transparent' ? '#ffffff' : value} onPreview={onPreview} onCommit={onPick} />
    </>
  )
}

export function HexInput({ value, onPreview, onCommit }: { value: string; onPreview: (c: string) => void; onCommit: (c: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const valid = (t: string) => /^#?[0-9a-f]{6}$/i.test(t.trim())
  const norm = (t: string) => `#${t.trim().replace('#', '').toLowerCase()}`
  const commit = () => { if (valid(text) && norm(text) !== value.toLowerCase()) onCommit(norm(text)) }
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-[6px] border border-black/10" style={{ background: valid(text) ? norm(text) : value }} data-tip="Mở bảng màu">
        <input type="color" value={valid(text) ? norm(text) : '#000000'} className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { setText(e.target.value); onPreview(e.target.value) }} onBlur={(e) => onCommit(e.target.value)} />
      </label>
      <div className={`flex h-7 flex-1 items-center rounded-[6px] border bg-surface px-2 ${valid(text) ? 'border-line focus-within:border-clay' : 'border-red-400'}`}>
        <span className="whitespace-nowrap text-[12px] text-ink-3">Mã màu</span>
        <input
          value={text} spellCheck={false} maxLength={7} aria-label="Mã màu"
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } e.stopPropagation() }}
          className="ml-2 w-full min-w-0 bg-transparent font-mono text-[12.5px] uppercase text-ink outline-none"
        />
      </div>
    </div>
  )
}

export function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 whitespace-nowrap text-[11.5px] text-ink-3">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

export const NONE_BG = 'linear-gradient(135deg, #fff 45%, #e03131 45%, #e03131 55%, #fff 55%)'

/** kéo ô màu nền thả vào hình để tô. Lúc kéo (dragover) trình duyệt không cho đọc dữ liệu nên giữ màu ở đây */
export const FILL_MIME = 'application/x-board-fill'
export let draggingFill: { color: string; style: FillStyle } | null = null
export const SPREAD_MS = 380
export const BUCKET_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11 3l8 8-7 7-8-8z" fill="#fff" stroke="#27272a" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 10l8 8 3-3H4z" fill="#4dabf7"/><path d="M20 14s2 2.6 2 4a2 2 0 0 1-4 0c0-1.4 2-4 2-4z" fill="#4dabf7" stroke="#27272a" stroke-width="1.2"/></svg>'

/** ảnh đi theo con trỏ khi kéo: giọt màu tròn có bóng */
export function startFillDrag(ev: React.DragEvent, color: string, style: FillStyle) {
  draggingFill = { color, style }
  ev.dataTransfer.setData(FILL_MIME, color)
  ev.dataTransfer.effectAllowed = 'copy'
  const g = document.createElement('div')
  const none = color === 'transparent'
  g.style.cssText = `position:fixed;top:-100px;left:-100px;width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${none ? '#fff' : color};border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25),inset -4px -4px 0 rgba(0,0,0,.08)`
  document.body.appendChild(g)
  ev.dataTransfer.setDragImage(g, 6, 28)
  setTimeout(() => g.remove(), 0)
}

export function Swatch({ color, active, onClick, round, title, drag }: { color: string; active: boolean; onClick: () => void; round?: boolean; title?: string; drag?: FillStyle }) {
  const none = color === 'transparent'
  return (
    <button
      type="button" onClick={onClick}
      draggable={!!drag}
      onDragStart={drag ? (ev) => startFillDrag(ev, color, drag) : undefined}
      onDragEnd={drag ? () => { draggingFill = null } : undefined} data-tip={none ? 'Không màu' : title ?? color} aria-label={none ? 'Không màu' : `${title ?? 'Màu'} ${color}`} aria-pressed={active}
      className={`mx-[3px] h-5 w-5 shrink-0 ${round ? 'rounded-full' : 'rounded-[5px]'} border border-black/10 transition-transform hover:scale-110 ${active ? 'ring-2 ring-clay ring-offset-2 ring-offset-surface' : ''}`}
      style={{ background: none ? NONE_BG : color }}
    />
  )
}

export function Ico({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
  )
}

export function IconBtn({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  const { tip, kbd } = splitTipKbd(label)
  return (
    <button
      type="button" data-tip={tip} data-tip-kbd={kbd} aria-label={tip} onClick={onClick} disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-[6px] text-ink hover:bg-sunken disabled:opacity-35 disabled:hover:bg-transparent sm:h-8 sm:w-8"
    >
      {children}
    </button>
  )
}

/** nút icon trong thanh nổi hàng 3 */
export function SelBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  const { tip, kbd } = splitTipKbd(label)
  return (
    <button
      type="button" data-tip={tip} data-tip-kbd={kbd} aria-label={tip} onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 sm:h-8 sm:w-8 ${danger ? 'hover:bg-red-500/10 hover:text-red-600' : 'hover:bg-sunken'}`}
    >
      {children}
    </button>
  )
}
