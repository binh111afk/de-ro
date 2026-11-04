/**
 * Tab "Công cụ" dùng chung cho soạn đề và soạn slide: danh sách công cụ chia
 * theo môn, bấm vào mở modal của công cụ. Môn chưa có công cụ thì không hiện.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, ChartColumn, ChartSpline, Grid3x3, SquarePlus, Table2, Triangle, Zap } from 'lucide-react'
import type { ToolImage, ToolKind } from '@/lib/toolSpec'
import { ToolModal } from './ToolModal'
import { cn } from '@/lib/cn'

type ToolId = ToolKind

const SUBJECTS: Array<{ name: string; tools: Array<{ id: ToolId; label: string; desc: string; Icon: typeof ChartSpline }> }> = [
  {
    name: 'Toán',
    tools: [
      { id: 'graph', label: 'Đồ thị hàm số', desc: 'Vẽ y = f(x), nhiều hàm trên một hệ trục', Icon: ChartSpline },
      { id: 'vartable', label: 'Bảng biến thiên', desc: 'Tự dựng từ hàm số, sửa tay từng ô', Icon: Table2 },
      { id: 'signtable', label: 'Bảng xét dấu', desc: 'Tự tách nhân tử, tìm nghiệm; sửa tay từng ô', Icon: SquarePlus },
      { id: 'oxy', label: 'Hệ trục Oxy', desc: 'Điểm, vectơ, đường thẳng, đường tròn, miền nghiệm', Icon: Grid3x3 },
      { id: 'stats', label: 'Thống kê', desc: 'Biểu đồ cột, đường, quạt tròn, ghép nhóm; bảng số liệu', Icon: ChartColumn },
      { id: 'geo2d', label: 'Hình học phẳng', desc: 'Tam giác, tứ giác, đường tròn; đường cao, trung tuyến', Icon: Triangle },
      { id: 'geo3d', label: 'Hình học không gian', desc: 'Hình chóp, lăng trụ, hộp, nón, trụ, cầu; nét khuất đứt', Icon: Box },
    ],
  },
  {
    name: 'Vật lí',
    tools: [{ id: 'circuit', label: 'Mạch điện', desc: 'Gõ nối tiếp, song song; ký hiệu SGK, tự xếp nhánh', Icon: Zap }],
  },
]

export function ToolsPanel({ disabled, onInsertPlot }: { disabled?: boolean; onInsertPlot: (img: ToolImage) => void }) {
  const [open, setOpen] = useState<ToolId | null>(null)
  const [subject, setSubject] = useState(() => {
    try {
      return localStorage.getItem('tools.subject') ?? SUBJECTS[0].name
    } catch {
      return SUBJECTS[0].name
    }
  })
  const pick = (v: string) => {
    setSubject(v)
    try {
      localStorage.setItem('tools.subject', v)
    } catch {
      /* bỏ qua */
    }
  }
  const shown = SUBJECTS.filter((s) => s.name === subject).length ? SUBJECTS.filter((s) => s.name === subject) : SUBJECTS.slice(0, 1)

  return (
    <div className="flex flex-col gap-3 py-3">
      <div role="tablist" aria-label="Chọn môn" className="flex flex-wrap gap-1.5">
        {SUBJECTS.map((s) => (
          <button
            key={s.name}
            type="button"
            role="tab"
            aria-selected={s.name === shown[0].name}
            onClick={() => pick(s.name)}
            className={cn(
              'rounded-full border px-3 py-1 text-[13px] font-medium transition-colors',
              s.name === shown[0].name ? 'border-clay bg-clay-tint text-clay' : 'border-line bg-white text-ink-2 hover:border-ink-4',
            )}
          >
            {s.name}
            <span className="ml-1 text-[11.5px] font-normal opacity-60">{s.tools.length}</span>
          </button>
        ))}
      </div>
      {shown.map((s) => (
        <section key={s.name}>
          <ul className="flex flex-col gap-1">
            {s.tools.map(({ id, label, desc, Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setOpen(id)}
                  className="flex w-full items-start gap-3 rounded-[6px] border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-ink-4 disabled:opacity-50"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-paper-2 text-clay">
                    <Icon className="size-[18px]" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium text-ink">{label}</span>
                    <span className="block text-[12px] leading-snug text-ink-3">{desc}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {open &&
        createPortal(
        <ToolModal
          kind={open}
          onClose={() => setOpen(null)}
          onInsert={(img) => {
            onInsertPlot(img)
            setOpen(null)
          }}
        />,
        document.body,
      )}
    </div>
  )
}
