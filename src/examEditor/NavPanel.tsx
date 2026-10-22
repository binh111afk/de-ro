/**
 * Nav pane bên phải — port từ GenOffice (`apps/docs/.../components/NavPane.tsx`):
 * ô tìm kiếm trên, dải tab (Mục lục / Khối mẫu / Tìm kiếm), rồi vùng nội dung.
 */
import { useMemo, useState } from 'react'
import type { JSONContent } from '@tiptap/core'
import { buildTocFromDoc, type TocEntry } from './convert'
import { BLOCK_TEMPLATES, type BlockTemplate } from './templates'
import { cn } from '@/lib/cn'
import { IconSearch } from './icons'

type PaneTab = 'toc' | 'blocks' | 'search'

export function NavPanel({
  doc,
  onInsertTemplate,
  onGoToBlock,
}: {
  doc: JSONContent
  onInsertTemplate: (tpl: BlockTemplate) => void
  onGoToBlock: (index: number) => void
}) {
  const [tab, setTab] = useState<PaneTab>('toc')
  const [query, setQuery] = useState('')

  const toc = useMemo(() => buildTocFromDoc(doc), [doc])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Array<{ index: number; text: string }> = []
    ;(doc.content ?? []).forEach((node, index) => {
      const text = collectText(node)
      if (text.toLowerCase().includes(q)) out.push({ index, text: text.slice(0, 120) })
    })
    return out.slice(0, 40)
  }, [doc, query])

  return (
    <div className="nav-panel">
      <div className="nav-search">
        <IconSearch size={14} />
        <input
          className="nav-search-input"
          placeholder="Tìm trong đề…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setTab('search')}
          aria-label="Tìm trong đề"
        />
        {query.trim() ? (
          <span className="nav-search-count">{matches.length}</span>
        ) : null}
      </div>

      <div className="nav-tabs" role="tablist">
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'toc'}
          className={cn('nav-tab', tab === 'toc' && 'on')}
          onClick={() => setTab('toc')}
        >
          Mục lục
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'blocks'}
          className={cn('nav-tab', tab === 'blocks' && 'on')}
          onClick={() => setTab('blocks')}
        >
          Khối mẫu
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'search'}
          className={cn('nav-tab', tab === 'search' && 'on')}
          onClick={() => setTab('search')}
        >
          Tìm kiếm
        </button>
      </div>

      {tab === 'toc' && (
        <div className="nav-body">
          {toc.length === 0 ? (
            <p className="nav-body__empty">
              Chưa có tiêu đề phần. Thêm tiêu đề bằng tab <b>Chèn</b> để lập mục lục.
            </p>
          ) : (
            <ul className="nav-toc">
              {toc.map((entry: TocEntry) => (
                <li key={entry.index} style={{ paddingLeft: `${(entry.level - 1) * 12}px` }}>
                  <button type="button" onClick={() => onGoToBlock(entry.index)}>
                    {entry.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'blocks' && (
        <div className="nav-body">
          <ul className="nav-tpl">
            {BLOCK_TEMPLATES.map((tpl) => (
              <li key={tpl.id}>
                <button type="button" onClick={() => onInsertTemplate(tpl)}>
                  <span className="nav-tpl__label">{tpl.label}</span>
                  <span className="nav-tpl__desc">{tpl.desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'search' && (
        <div className="nav-body">
          {!query.trim() ? (
            <p className="nav-body__empty">Nhập từ khóa để tìm trong nội dung đề.</p>
          ) : matches.length === 0 ? (
            <p className="nav-body__empty">Không tìm thấy nội dung phù hợp.</p>
          ) : (
            <ul className="nav-toc">
              {matches.map((m) => (
                <li key={m.index}>
                  <button type="button" onClick={() => onGoToBlock(m.index)}>
                    {m.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function collectText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  if (!node.content) return ''
  return node.content.map(collectText).join(' ')
}
