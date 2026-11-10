/**
 * Nav pane bên phải — port từ GenOffice (`apps/docs/.../components/NavPane.tsx`):
 * thanh icon dọc (Mục lục / Khối mẫu) như thư viện bên soạn slide, panel trượt
 * ra bên trái thanh đó.
 */
import type { ExamDoc } from '@/data/docTypes'
import { MathText } from '@/components/MathText'
import { useMemo, useRef, useState } from 'react'
import { Blocks, ChevronLeft, ChevronRight, ListTree, Wrench, X } from 'lucide-react'
import { NavRailIndicator } from './NavRailIndicator'
import { PanelContentTransition } from './PanelContentTransition'
import { ToolsPanel } from './tools/ToolsPanel'
import type { PlotImage } from './tools/GraphToolModal'
import type { JSONContent } from '@tiptap/core'
import { buildTocFromDoc, type TocEntry } from './convert'
import { BLOCK_TEMPLATES, BLOCK_TEMPLATE_MIME, type BlockTemplate } from './templates'
import { cn } from '@/lib/cn'
import { IconGrip } from './icons'

export type PaneTab = 'toc' | 'blocks' | 'tools'

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
  examDoc = null,
  side = 'right',
  isMobile,
  currentTab,
  onTabChange,
}: {
  doc: JSONContent
  /** panel đang mở hay chỉ còn thanh icon */
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsertTemplate: (tpl: BlockTemplate) => void
  onGoToBlock: (index: number) => void
  onInsertPlot: (img: PlotImage) => void
  /** đề đang soạn (cho công cụ Xáo đề) */
  examDoc?: ExamDoc | null
  /** cột đặt panel: soạn đề để bên trái (AI bên phải, như soạn slide) */
  side?: 'left' | 'right'
  isMobile?: boolean
  currentTab?: PaneTab
  onTabChange?: (tab: PaneTab) => void
}) {
  const left = side === 'left'
  const [internalTab, setInternalTab] = useState<PaneTab>('toc')
  const tab = currentTab ?? internalTab
  const setTab = onTabChange ?? setInternalTab
  const active = open ? tab : null
  const shown = tab

  const navRef = useRef<HTMLElement>(null)
  const toc = useMemo(() => buildTocFromDoc(doc), [doc])

  if (isMobile) {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        {/* Bottom sheet */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mục lục, Khối mẫu và Công cụ"
          className="relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-line bg-surface shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {/* Handle bar */}
          <div className="flex items-center justify-center pt-2.5 pb-1">
            <div className="h-1 w-10 rounded-full bg-line" />
          </div>

          {/* Header with tabs & close */}
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <div className="flex items-center gap-1">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    tab === id
                      ? 'bg-clay-soft text-clay-deep'
                      : 'text-ink-3 hover:bg-paper-2 hover:text-ink',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Đóng"
              className="flex size-8 items-center justify-center rounded-lg text-ink-3 hover:bg-paper-2 hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'toc' && (
              <div className="nav-body">
                {toc.length === 0 ? (
                  <p className="nav-body__empty text-sm text-ink-3">
                    Chưa có tiêu đề hay câu hỏi. Thêm tiêu đề bằng tab <b>Chèn</b> để lập mục lục.
                  </p>
                ) : (
                  <ul className="nav-toc space-y-1">
                    {toc.map((entry: TocEntry) => (
                      <li key={entry.index} style={{ paddingLeft: `${(entry.level - 1) * 12}px` }}>
                        <button
                          type="button"
                          className="w-full text-left py-1.5 px-2 rounded hover:bg-paper-2 text-sm text-ink truncate block"
                          onClick={() => {
                            onGoToBlock(entry.index)
                            onOpenChange(false)
                          }}
                        >
                          <MathText>{entry.kind === 'question' ? `Câu ${entry.no}. ${entry.text}` : entry.text}</MathText>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === 'blocks' && (
              <div className="nav-body space-y-4">
                {groupTemplates(BLOCK_TEMPLATES).map((group) => (
                  <section key={group.name} className="nav-tpl-group">
                    <h3 className="nav-tpl-group__name mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-3">
                      {group.name}
                    </h3>
                    <ul className="nav-tpl space-y-1.5">
                      {group.items.map((tpl) => (
                        <li key={tpl.id}>
                          <button
                            type="button"
                            className="flex w-full items-start gap-2.5 rounded-lg border border-line bg-surface p-2.5 text-left transition-colors hover:border-clay hover:bg-paper-2 active:bg-paper"
                            onClick={() => {
                              onInsertTemplate(tpl)
                              onOpenChange(false)
                            }}
                          >
                            <span className="nav-tpl__grip mt-0.5 text-ink-3">
                              <IconGrip size={14} />
                            </span>
                            <span className="nav-tpl__texts flex-1 min-w-0">
                              <span className="nav-tpl__label block text-sm font-medium text-ink">
                                {tpl.label}
                              </span>
                              <span className="nav-tpl__desc block text-xs text-ink-3 truncate">
                                {tpl.desc}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {tab === 'tools' && (
              <div className="nav-body">
                <ToolsPanel
                  examDoc={examDoc}
                  onInsertPlot={(img) => {
                    onInsertPlot(img)
                    onOpenChange(false)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex min-h-0 shrink-0', left && 'flex-row-reverse')}>
      {/* nút thu panel kiểu Canva: viên thuốc bám mép trái panel */}
      <button
        type="button"
        aria-label="Đóng panel"
        title="Đóng panel"
        tabIndex={active ? 0 : -1}
        onClick={() => onOpenChange(false)}
        className={cn('absolute top-1/2 z-30 flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink-2 shadow-sm transition-[left,right,opacity] duration-200 ease-out hover:text-clay motion-reduce:transition-none', left ? '-translate-x-1/2' : 'translate-x-1/2')}
        style={{ [left ? 'left' : 'right']: 64 + (active ? PANEL_W : 0), opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      >
        {left ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>
      {/* khung ngoài đổi bề rộng để panel trượt; khung trong giữ nguyên bề rộng nên nội dung không bị bóp */}
      <div
        className="min-h-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: active ? PANEL_W : 0 }}
        inert={!active}
      >
        <aside className={cn('nav-panel h-full min-h-0 border-line bg-surface', left ? 'border-r' : 'border-l')} style={{ width: PANEL_W }} aria-label={TABS.find((t) => t.id === shown)?.label}>
          <PanelContentTransition activeTab={active} tabOrder={TABS.map((t) => t.id)}>
            {(tabId) => (
              <>
                {tabId === 'toc' && (
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
                              <MathText>{entry.kind === 'question' ? `Câu ${entry.no}. ${entry.text}` : entry.text}</MathText>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {tabId === 'blocks' && (
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

                {tabId === 'tools' && (
                  <div className="nav-body">
                    <div className="px-3"><ToolsPanel examDoc={examDoc} onInsertPlot={onInsertPlot} /></div>
                  </div>
                )}
              </>
            )}
          </PanelContentTransition>
        </aside>
      </div>
      <nav ref={navRef} aria-label="Bảng điều hướng" className={cn('relative flex w-[64px] flex-col items-center gap-2 border-line bg-surface py-3', left ? 'border-r' : 'border-l')}>
        <NavRailIndicator containerRef={navRef} activeId={active} />
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            data-tab-id={id}
            type="button"
            onClick={() => {
              onOpenChange(!(active === id))
              setTab(id)
            }}
            aria-pressed={active === id}
            className={cn(
              'relative z-10 flex w-[54px] flex-col items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-0.5 py-2.5 text-[11px] leading-none tracking-[-0.01em] transition-colors duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none',
              active === id ? 'font-semibold text-clay-deep' : 'font-medium text-ink-3 hover:bg-paper-2 hover:text-ink',
            )}
          >
            <Icon className="size-5 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none" strokeWidth={active === id ? 2.1 : 1.7} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
