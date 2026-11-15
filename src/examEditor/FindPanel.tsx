/**
 * Hộp thoại "Tìm và thay thế" kiểu Word / Google Docs: giữa màn hình, nền tối phía sau, 2 tab Tìm / Thay thế.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { createSearchPlugin, findMatches, searchPluginKey, type SearchQuery } from './find'
import { IconClose, IconSearch, IconReplace } from './icons'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { Button, Checkbox } from '@/components/ui'
import { Segmented } from '@/components/Segmented'

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [tab])

  // debounce tìm kiếm mỗi khi query đổi
  useEffect(() => {
    if (!editor) return
    const query: SearchQuery = { text, matchCase, wholeWord }
    const matches = findMatches(editor.state.doc, query)
    setCount({ active: matches.length ? 0 : -1, total: matches.length })
    const tr = editor.state.tr.setMeta(searchPluginKey, { query, matches, active: matches.length ? 0 : -1 })
    editor.view.dispatch(tr)
  }, [editor, text, matchCase, wholeWord])

  const gotoMatch = useCallback(
    (delta: number) => {
      if (!editor) return
      const s = searchPluginKey.getState(editor.state)
      if (!s || !s.matches.length) return
      const next = (s.active + delta + s.matches.length) % s.matches.length
      const m = s.matches[next]
      editor.view.dispatch(
        editor.state.tr
          .setMeta(searchPluginKey, { ...s, active: next })
          .setSelection(TextSelection.near(editor.state.doc.resolve(m.from))),
      )
      setCount({ active: next, total: s.matches.length })
    },
    [editor],
  )

  const replaceCurrent = useCallback(() => {
    if (!editor) return
    const s = searchPluginKey.getState(editor.state)
    if (!s || s.active < 0) return
    const m = s.matches[s.active]
    if (!m) return
    editor.chain().focus().deleteRange({ from: m.from, to: m.to }).insertContentAt(m.from, replacement).run()
  }, [editor, replacement])

  const replaceAll = useCallback(() => {
    if (!editor) return
    const query: SearchQuery = { text, matchCase, wholeWord }
    const matches = findMatches(editor.state.doc, query)
    if (!matches.length) return
    const chain = editor.chain().focus()
    // thay từ cuối về đầu để không lệch offset
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i]
      chain.deleteRange({ from: m.from, to: m.to })
      if (replacement) chain.insertContentAt(m.from, replacement)
    }
    chain.run()
  }, [editor, text, matchCase, wholeWord, replacement])

  const counter = count.total ? `${count.active + 1} / ${count.total}` : text ? 'Không thấy' : ''
  const field = 'h-10 w-full rounded-[6px] border border-line-2 bg-white px-3 text-[14px] text-ink placeholder:text-ink-4 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/15'

  // hộp thoại giữa màn hình, nền tối phía sau (bấm ra ngoài hoặc Esc để đóng)
  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-3"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tìm và thay thế"
      className="w-[min(440px,100%)] rounded-[10px] border border-line bg-surface shadow-lift"
    >
      <div className="flex items-center gap-2 px-5 pb-2 pt-4">
        <h2 className="font-display text-[17px] font-semibold text-ink">Tìm và thay thế</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="ml-auto grid h-8 w-8 place-items-center rounded-[6px] text-ink-3 hover:bg-sunken hover:text-ink"
        >
          <IconClose size={16} />
        </button>
      </div>

      <div className="px-5">
        <Segmented
          label="Chế độ"
          value={tab}
          onChange={setTab}
          className="h-9"
          options={[
            { key: 'find', label: 'Tìm', icon: <IconSearch size={14} /> },
            { key: 'replace', label: 'Thay thế', icon: <IconReplace size={14} /> },
          ]}
        />
      </div>

      <div className="space-y-3 px-5 pb-5 pt-4">
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Tìm</span>
          <div className="relative">
            <input
              ref={inputRef}
              className={cn(field, 'pr-24')}
              placeholder="Nhập chữ cần tìm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  gotoMatch(e.shiftKey ? -1 : 1)
                }
              }}
            />
            <span className={cn('tnum absolute right-3 top-1/2 -translate-y-1/2 text-[12.5px]', count.total ? 'text-ink-3' : 'text-ink-4')}>
              {counter}
            </span>
          </div>
        </label>

        {tab === 'replace' && (
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">Thay bằng</span>
            <input
              className={field}
              placeholder="Nhập chữ thay thế"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  replaceCurrent()
                }
              }}
            />
          </label>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-2">
          <Checkbox checked={matchCase} onChange={setMatchCase} className="gap-2">
            Phân biệt hoa/thường
          </Checkbox>
          <Checkbox checked={wholeWord} onChange={setWholeWord} className="gap-2">
            Nguyên từ
          </Checkbox>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          {tab === 'replace' && (
            <>
              <Button size="sm" variant="outline" onClick={replaceCurrent} disabled={!count.total}>
                Thay
              </Button>
              <Button size="sm" variant="outline" onClick={replaceAll} disabled={!count.total}>
                Thay tất cả
              </Button>
              <span className="flex-1" />
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => gotoMatch(-1)} disabled={!count.total}>
            Trước
          </Button>
          <Button size="sm" variant="clay" onClick={() => gotoMatch(1)} disabled={!count.total}>
            Sau
          </Button>
        </div>
      </div>
    </div>
    </div>,
    document.body,
  )
}

export { createSearchPlugin }
