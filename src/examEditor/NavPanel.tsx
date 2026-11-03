/**
 * Nav pane bên phải — port từ GenOffice (`apps/docs/.../components/NavPane.tsx`):
 * thanh icon dọc (Mục lục / Khối mẫu) như thư viện bên soạn slide, panel trượt
 * ra bên trái thanh đó.
 */
import { useMemo, useState } from 'react'
import { Blocks, ChevronRight, ListTree, Wrench } from 'lucide-react'
import { ToolsPanel } from './tools/ToolsPanel'
import type { PlotImage } from './tools/GraphToolModal'
import type { JSONContent } from '@tiptap/core'
import { buildTocFromDoc, type TocEntry } from './convert'
import { BLOCK_TEMPLATES, BLOCK_TEMPLATE_MIME, type BlockTemplate } from './templates'
import { cn } from '@/lib/cn'
import { IconGrip } from './icons'

type PaneTab = 'toc' | 'blocks' | 'tools'

/** Gom danh sách mẫu theo nhóm liền kề, giữ thứ tự khai báo. */
function groupTemplates(list: BlockTemplate[]): Array<{ name: string; items: BlockTemplate[] }> {
  const out: Array<{ name: string; items: BlockTemplate[] }> = []
  for (const tpl of list) {
    const last = out[out.length - 1]
    if (last && last.name === tpl.group) last.items.push(tpl)
    else out.push({ name: tpl.group, items: [tpl] })
  }
  return out
}

const TABS: Array<{ id: PaneTab; label: string; Icon: typeof ListTree }> = [
  { id: 'toc', label: 'Mục lục', Icon: ListTree },
  { id: 'blocks', label: 'Khối mẫu', Icon: Blocks },
  { id: 'tools', label: 'Công cụ', Icon: Wrench },
]

/** rộng panel trượt (cùng cỡ thư viện bên soạn slide) */
const PANEL_W = 280

export function NavPanel({
  doc,
  open,
  onOpenChange,
  onInsertTemplate,
  onGoToBlock,
  onInsertPlot,
}: {
  doc: JSONContent
  /** panel đang mở hay chỉ còn thanh icon */
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsertTemplate: (tpl: BlockTemplate) => void
  onGoToBlock: (index: number) => void
  onInsertPlot: (img: PlotImage) => void
}) {
  // tab cuối cùng đã chọn: giữ nội dung trong lúc panel trượt đóng
  const [tab, setTab] = useState<PaneTab>('toc')
  const active = open ? tab : null
  const shown = tab

  const toc = useMemo(() => buildTocFromDoc(doc), [doc])

  return (
    <div className="relative flex min-h-0 shrink-0">
      {/* nút thu panel kiểu Canva: viên thuốc bám mép trái panel */}
      <button
        type="button"
        aria-label="Đóng panel"
        title="Đóng panel"
        tabIndex={active ? 0 : -1}
        onClick={() => onOpenChange(false)}
        className="absolute top-1/2 z-30 flex h-12 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm transition-[right,opacity] duration-200 ease-out hover:text-clay motion-reduce:transition-none"
        style={{ right: 64 + (active ? PANEL_W : 0), opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      >
        <ChevronRight className="size-4" />
      </button>
      {/* khung ngoài đổi bề rộng để panel trượt; khung trong giữ nguyên bề rộng nên nội dung không bị bóp */}
      <div
        className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: active ? PANEL_W : 0 }}
        inert={!active}
      >
        <aside className="nav-panel h-full min-h-0 border-l border-line bg-surface" style={{ width: PANEL_W }} aria-label={TABS.find((t) => t.id === shown)?.label}>
        {shown === 'toc' && (
          <div className="nav-body">
            {toc.length === 0 ? (
              <p className="nav-body__empty">
                Chưa có tiêu đề hay câu hỏi. Thêm tiêu đề bằng tab <b>Chèn</b> để lập mục lục.
              </p>
            ) : (
              <ul className="nav-toc">
                {toc.map((entry: TocEntry) => (
                  <li key={entry.index} style={{ paddingLeft: `${(entry.level - 1) * 12}px` }}>
                    <button type="button" onClick={() => onGoToBlock(entry.index)}>
                      {entry.kind === 'question' ? `Câu ${entry.no}. ${entry.text}` : entry.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {shown === 'blocks' && (
          <div className="nav-body">
            {groupTemplates(BLOCK_TEMPLATES).map((group) => (
              <section key={group.name} className="nav-tpl-group">
                <h3 className="nav-tpl-group__name">{group.name}</h3>
                <ul className="nav-tpl">
                  {group.items.map((tpl) => (
                    <li key={tpl.id}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(BLOCK_TEMPLATE_MIME, JSON.stringify(tpl.build()))
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                        onClick={() => onInsertTemplate(tpl)}
                        title="Bấm để chèn tại con trỏ, hoặc kéo vào trang"
                      >
                        <span className="nav-tpl__grip">
                          <IconGrip size={12} />
                        </span>
                        <span className="nav-tpl__texts">
                          <span className="nav-tpl__label">{tpl.label}</span>
                          <span className="nav-tpl__desc">{tpl.desc}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
          {shown === 'tools' && (
            <div className="nav-body">
              <div className="px-3"><ToolsPanel onInsertPlot={onInsertPlot} /></div>
            </div>
          )}
        </aside>
      </div>
      <nav aria-label="Bảng điều hướng" className="flex w-[64px] flex-col items-center gap-1 border-l border-line bg-surface py-2">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              onOpenChange(!(active === id))
              setTab(id)
            }}
            aria-pressed={active === id}
            className={cn(
              'flex w-[60px] flex-col items-center gap-1 whitespace-nowrap rounded-lg px-0.5 py-2 text-[11px] font-medium tracking-[-0.01em] transition-colors',
              active === id ? 'bg-paper-2 text-clay' : 'text-ink-3 hover:bg-paper-2 hover:text-ink',
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
