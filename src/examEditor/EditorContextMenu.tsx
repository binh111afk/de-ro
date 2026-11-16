/** Menu chuột phải trong trình soạn đề, giống Word: thanh định dạng nhanh + lệnh cắt/dán, bảng, liên kết. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { Portal } from '@/components/Portal'
import { LinkDialog } from './InsertMenus'
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconClearFormat,
  IconColDelete,
  IconColInsertLeft,
  IconColInsertRight,
  IconCopy,
  IconCut,
  IconLink,
  IconMergeCells,
  IconPaste,
  IconPasteText,
  IconRowDelete,
  IconRowInsertAbove,
  IconRowInsertBelow,
  IconSelectAll,
  IconSplitCells,
  IconTableDelete,
} from './icons'

const MOD = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl+'

type Pos = { x: number; y: number }

export function EditorContextMenu({ editor }: { editor: Editor | null }) {
  const [pos, setPos] = useState<Pos | null>(null)
  const [place, setPlace] = useState<Pos | null>(null)
  const [link, setLink] = useState<{ href?: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    const onMenu = (e: MouseEvent) => {
      // xem đề (chỉ đọc) giữ menu mặc định của trình duyệt
      if (!editor.isEditable) return
      e.preventDefault()
      // bấm ngoài vùng đang chọn thì đặt con trỏ tại chỗ bấm, như Word
      const hit = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
      const { from, to } = editor.state.selection
      if (hit && (hit.pos < from || hit.pos > to)) editor.commands.setTextSelection(hit.pos)
      editor.commands.focus()
      setPlace(null)
      setPos({ x: e.clientX, y: e.clientY })
    }
    dom.addEventListener('contextmenu', onMenu)
    return () => dom.removeEventListener('contextmenu', onMenu)
  }, [editor])

  useEffect(() => {
    if (!pos) return
    const close = (e: Event) => {
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return
      setPos(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  // giữ menu trong khung nhìn: sát mép phải/dưới thì lật sang trái/lên trên
  useLayoutEffect(() => {
    if (!pos || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = pos.x + r.width > window.innerWidth - 8 ? Math.max(8, pos.x - r.width) : pos.x
    const y = pos.y + r.height > window.innerHeight - 8 ? Math.max(8, window.innerHeight - 8 - r.height) : pos.y
    setPlace({ x, y })
  }, [pos])

  if (!editor || editor.isDestroyed) return null
  if (!pos) return link ? <LinkDialog editor={editor} initialHref={link.href} onClose={() => setLink(null)} /> : null

  const empty = editor.state.selection.empty
  const inTable = editor.isActive('table')
  const inLink = editor.isActive('link')
  const run = (fn: () => void) => () => {
    fn()
    setPos(null)
  }
  const chain = () => editor.chain().focus()
  const paste = async (plain: boolean) => {
    try {
      if (!plain && navigator.clipboard.read) {
        const items = await navigator.clipboard.read()
        const html = items.find((i) => i.types.includes('text/html'))
        if (html) {
          editor.view.pasteHTML(await (await html.getType('text/html')).text())
          return
        }
      }
      const text = await navigator.clipboard.readText()
      if (text) editor.view.pasteText(text)
    } catch {
      // trình duyệt chặn đọc clipboard: vẫn còn Ctrl+V
    }
  }

  const fmt: Array<[string, ReactNode, boolean, () => void]> = [
    ['Đậm', <b key="b">B</b>, editor.isActive('bold'), () => chain().toggleBold().run()],
    ['Nghiêng', <i key="i">I</i>, editor.isActive('italic'), () => chain().toggleItalic().run()],
    ['Gạch chân', <u key="u">U</u>, editor.isActive('underline'), () => chain().toggleUnderline().run()],
    ['Căn trái', <IconAlignLeft key="l" size={16} />, editor.isActive({ textAlign: 'left' }), () => chain().setTextAlign('left').run()],
    ['Căn giữa', <IconAlignCenter key="c" size={16} />, editor.isActive({ textAlign: 'center' }), () => chain().setTextAlign('center').run()],
    ['Căn phải', <IconAlignRight key="r" size={16} />, editor.isActive({ textAlign: 'right' }), () => chain().setTextAlign('right').run()],
    ['Căn đều', <IconAlignJustify key="j" size={16} />, editor.isActive({ textAlign: 'justify' }), () => chain().setTextAlign('justify').run()],
  ]

  const item = (icon: ReactNode, label: string, onClick: () => void, opts?: { hint?: string; disabled?: boolean }) => (
    <button
      key={label}
      type="button"
      role="menuitem"
      className="rb-color-item ctx-item"
      disabled={opts?.disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run(onClick)}
    >
      <span className="ctx-item__icon">{icon}</span>
      <span className="rb-color-item__label">{label}</span>
      {opts?.hint && <span className="ctx-item__hint">{opts.hint}</span>}
    </button>
  )
  const sep = (k: string) => <div key={k} className="ctx-sep" role="separator" />

  return (
    <Portal>
      <div
        ref={ref}
        className="rb-color-menu ctx-menu"
        role="menu"
        aria-label="Menu chuột phải"
        style={{ left: (place ?? pos).x, top: (place ?? pos).y, visibility: place ? 'visible' : 'hidden' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="ctx-fmt">
          {fmt.map(([label, icon, active, fn]) => (
            <button
              key={label}
              type="button"
              className={`rb-icon${active ? ' active' : ''}`}
              data-tip={label}
              aria-label={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={fn}
            >
              {icon}
            </button>
          ))}
        </div>
        {sep('s0')}
        {item(<IconCut size={16} />, 'Cắt', () => document.execCommand('cut'), { hint: `${MOD}X`, disabled: empty })}
        {item(<IconCopy size={16} />, 'Sao chép', () => document.execCommand('copy'), { hint: `${MOD}C`, disabled: empty })}
        {item(<IconPaste size={16} />, 'Dán', () => void paste(false), { hint: `${MOD}V` })}
        {item(<IconPasteText size={16} />, 'Dán chỉ giữ chữ', () => void paste(true), { hint: `${MOD}⇧V` })}
        {inTable && (
          <>
            {sep('s1')}
            {item(<IconRowInsertAbove size={16} />, 'Chèn hàng phía trên', () => chain().addRowBefore().run())}
            {item(<IconRowInsertBelow size={16} />, 'Chèn hàng phía dưới', () => chain().addRowAfter().run())}
            {item(<IconColInsertLeft size={16} />, 'Chèn cột bên trái', () => chain().addColumnBefore().run())}
            {item(<IconColInsertRight size={16} />, 'Chèn cột bên phải', () => chain().addColumnAfter().run())}
            {item(<IconMergeCells size={16} />, 'Gộp ô', () => chain().mergeCells().run(), { disabled: !editor.can().mergeCells() })}
            {item(<IconSplitCells size={16} />, 'Tách ô', () => chain().splitCell().run(), { disabled: !editor.can().splitCell() })}
            {item(<IconRowDelete size={16} />, 'Xoá hàng', () => chain().deleteRow().run())}
            {item(<IconColDelete size={16} />, 'Xoá cột', () => chain().deleteColumn().run())}
            {item(<IconTableDelete size={16} />, 'Xoá bảng', () => chain().deleteTable().run())}
          </>
        )}
        {sep('s2')}
        {item(<IconLink size={16} />, inLink ? 'Sửa liên kết' : 'Chèn liên kết', () => {
          const href = inLink ? (editor.getAttributes('link').href as string | undefined) : undefined
          if (inLink) chain().extendMarkRange('link').run()
          setLink({ href })
        })}
        {inLink && item(<IconLink size={16} />, 'Bỏ liên kết', () => chain().extendMarkRange('link').unsetLink().run())}
        {item(<IconClearFormat size={16} />, 'Xoá định dạng', () => chain().unsetAllMarks().run(), { disabled: empty })}
        {item(<IconSelectAll size={16} />, 'Chọn tất cả', () => chain().selectAll().run(), { hint: `${MOD}A` })}
      </div>
    </Portal>
  )
}
