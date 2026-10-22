/**
 * Panel Tìm / Thay thế — dock bên phải (hoặc nổi), 2 tab: Tìm / Thay thế.
 * Tương tự FindPanel của GenOffice nhưng thu gọn cho trình soạn đề.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { createSearchPlugin, findMatches, searchPluginKey, type SearchQuery } from './find'
import { IconClose, IconSearch, IconReplace } from './icons'
import { cn } from '@/lib/cn'

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

  return (
    <div className="find-panel">
      <div className="find-panel__header">
        <div className="find-panel__tabs">
          <button
            type="button"
            className={cn('find-panel__tab', tab === 'find' && 'on')}
            onClick={() => setTab('find')}
          >
            <IconSearch size={14} />
            Tìm
          </button>
          <button
            type="button"
            className={cn('find-panel__tab', tab === 'replace' && 'on')}
            onClick={() => setTab('replace')}
          >
            <IconReplace size={14} />
            Thay thế
          </button>
        </div>
        <button type="button" className="find-panel__close" onClick={onClose} title="Đóng" aria-label="Đóng">
          <IconClose size={14} />
        </button>
      </div>

      <div className="find-panel__body">
        <div className="find-panel__row">
          <input
            ref={inputRef}
            className="find-panel__input"
            placeholder="Tìm..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                gotoMatch(e.shiftKey ? -1 : 1)
              }
              if (e.key === 'Escape') onClose()
            }}
          />
          <span className="find-panel__count tnum">
            {count.total ? `${count.active + 1}/${count.total}` : text ? '0' : ''}
          </span>
          <button type="button" className="find-panel__nav" title="Kết quả trước" aria-label="Kết quả trước" onClick={() => gotoMatch(-1)}>
            ‹
          </button>
          <button type="button" className="find-panel__nav" title="Kết quả sau" aria-label="Kết quả sau" onClick={() => gotoMatch(1)}>
            ›
          </button>
        </div>

        {tab === 'replace' && (
          <div className="find-panel__row">
            <input
              className="find-panel__input"
              placeholder="Thay bằng..."
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  replaceCurrent()
                }
                if (e.key === 'Escape') onClose()
              }}
            />
            <button type="button" className="find-panel__btn" onClick={replaceCurrent}>
              Thay
            </button>
            <button type="button" className="find-panel__btn find-panel__btn--primary" onClick={replaceAll}>
              Thay tất cả
            </button>
          </div>
        )}

        <div className="find-panel__opts">
          <label>
            <input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} />
            Phân biệt hoa/thường
          </label>
          <label>
            <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
            Nguyên từ
          </label>
        </div>
      </div>
    </div>
  )
}

export { createSearchPlugin }
