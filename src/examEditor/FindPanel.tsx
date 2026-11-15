/**
 * Thanh "Tìm và thay thế" nổi ở góc trên bên phải vùng soạn — kiểu Ctrl+F của Google Docs:
 * không phủ nền tối, không che trang; ↑/↓ (Enter / Shift+Enter) nhảy kết quả và tự cuộn tới;
 * bấm nút ⇄ để mở hàng Thay thế.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { createSearchPlugin, findMatches, searchPluginKey, type SearchQuery } from './find'
import { IconChevronDown, IconChevronUp, IconClose, IconReplace } from './icons'
import { cn } from '@/lib/cn'
import { Checkbox } from '@/components/ui'

export function FindPanel({
  editor,
  initialTab,
  onClose,
}: {
  editor: Editor | null
  initialTab?: 'find' | 'replace'
  onClose: () => void
}) {
  const [tab, setTab] = useState<'find' | 'replace'>(initialTab ?? 'find')
  const [text, setText] = useState('')
  const [replacement, setReplacement] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [count, setCount] = useState({ active: -1, total: 0 })
  // tăng sau mỗi lần thay → tìm lại (vị trí cũ đã lệch)
  const [version, setVersion] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // mở lần đầu hoặc bấm lại Ctrl+F / Ctrl+H khi thanh đang mở: về đúng chế độ, chọn sẵn chữ trong ô tìm
  useEffect(() => {
    if (initialTab) setTab(initialTab)
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [initialTab])

  /** đặt kết quả `i` là kết quả đang chọn, tô đậm và cuộn trang tới (không lấy focus khỏi ô tìm) */
  const show = useCallback(
    (matches: Array<{ from: number; to: number }>, query: SearchQuery, i: number) => {
      if (!editor) return
      let tr = editor.state.tr.setMeta(searchPluginKey, { query, matches, active: i })
      if (i >= 0) tr = tr.setSelection(TextSelection.near(editor.state.doc.resolve(matches[i].from))).scrollIntoView()
      editor.view.dispatch(tr)
      setCount({ active: i, total: matches.length })
    },
    [editor],
  )

  useEffect(() => {
    if (!editor) return
    const query: SearchQuery = { text, matchCase, wholeWord }
    const matches = findMatches(editor.state.doc, query)
    // sau khi thay: giữ vị trí gần chỗ vừa thay thay vì nhảy về kết quả đầu
    const prev = searchPluginKey.getState(editor.state)?.active ?? 0
    show(matches, query, matches.length ? Math.min(Math.max(prev, 0), matches.length - 1) : -1)
  }, [editor, text, matchCase, wholeWord, version, show])

  const gotoMatch = useCallback(
    (delta: number) => {
      if (!editor) return
      const s = searchPluginKey.getState(editor.state)
      if (!s || !s.matches.length) return
      show(s.matches, s.query, (s.active + delta + s.matches.length) % s.matches.length)
    },
    [editor, show],
  )

  const replaceCurrent = useCallback(() => {
    if (!editor) return
    const s = searchPluginKey.getState(editor.state)
    const m = s && s.active >= 0 ? s.matches[s.active] : null
    if (!m) return
    // không focus vào trang: con trỏ ở lại ô Thay bằng để bấm Enter thay tiếp
    editor.chain().deleteRange({ from: m.from, to: m.to }).insertContentAt(m.from, replacement).run()
    setVersion((v) => v + 1)
  }, [editor, replacement])

  const replaceAll = useCallback(() => {
    if (!editor) return
    const matches = findMatches(editor.state.doc, { text, matchCase, wholeWord })
    if (!matches.length) return
    const chain = editor.chain()
    // thay từ cuối về đầu để không lệch offset
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i]
      chain.deleteRange({ from: m.from, to: m.to })
      if (replacement) chain.insertContentAt(m.from, replacement)
    }
    chain.run()
    setVersion((v) => v + 1)
  }, [editor, text, matchCase, wholeWord, replacement])

  const counter = count.total ? `${count.active + 1}/${count.total}` : text ? '0/0' : ''
  const field =
    'h-9 w-full min-w-0 rounded-[6px] border border-line-2 bg-white px-3 text-[13.5px] text-ink placeholder:text-ink-4 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/15'
  const iconBtn =
    'grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-ink-2 hover:bg-sunken hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent'
  const textBtn = 'h-9 shrink-0 rounded-[6px] border border-line-2 bg-white px-3 text-[13px] font-medium text-ink hover:bg-sunken disabled:opacity-40'

  return (
    <div
      role="search"
      aria-label="Tìm và thay thế"
      className="absolute right-4 top-3 z-30 w-[min(400px,calc(100%-32px))] rounded-[10px] border border-line bg-surface p-2.5 shadow-lift"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="flex items-center gap-1">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            className={cn(field, 'pr-14')}
            placeholder="Tìm trong đề"
            aria-label="Tìm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                gotoMatch(e.shiftKey ? -1 : 1)
              }
            }}
          />
          <span className={cn('tnum pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px]', count.total ? 'text-ink-3' : 'text-ink-4')}>
            {counter}
          </span>
        </div>
        <button type="button" className={iconBtn} onClick={() => gotoMatch(-1)} disabled={!count.total} data-tip="Kết quả trước (Shift+Enter)" aria-label="Kết quả trước">
          <IconChevronUp size={16} />
        </button>
        <button type="button" className={iconBtn} onClick={() => gotoMatch(1)} disabled={!count.total} data-tip="Kết quả sau (Enter)" aria-label="Kết quả sau">
          <IconChevronDown size={16} />
        </button>
        <button
          type="button"
          className={cn(iconBtn, tab === 'replace' && 'bg-sunken text-ink')}
          onClick={() => setTab(tab === 'replace' ? 'find' : 'replace')}
          aria-pressed={tab === 'replace'}
          data-tip="Thay thế"
          aria-label="Thay thế"
        >
          <IconReplace size={16} />
        </button>
        <button type="button" className={iconBtn} onClick={onClose} data-tip="Đóng (Esc)" aria-label="Đóng">
          <IconClose size={15} />
        </button>
      </div>

      {tab === 'replace' && (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            className={field}
            placeholder="Thay bằng"
            aria-label="Thay bằng"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                replaceCurrent()
              }
            }}
          />
          <button type="button" className={textBtn} onClick={replaceCurrent} disabled={!count.total}>
            Thay
          </button>
          <button type="button" className={textBtn} onClick={replaceAll} disabled={!count.total}>
            Thay hết
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-0.5 text-[12.5px] text-ink-3">
        <Checkbox checked={matchCase} onChange={setMatchCase} className="gap-1.5">
          Phân biệt hoa/thường
        </Checkbox>
        <Checkbox checked={wholeWord} onChange={setWholeWord} className="gap-1.5">
          Nguyên từ
        </Checkbox>
      </div>
    </div>
  )
}

export { createSearchPlugin }
