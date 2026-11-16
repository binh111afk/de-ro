/**
 * Các dropdown/dialog cho ribbon tab "Chèn":
 *   - TablePicker: lưới chọn kích thước bảng (giống Word)
 *   - SymbolPicker: bảng ký hiệu thường dùng (toán/lý/hóa)
 *   - EquationDialog: nhập công thức LaTeX (render KaTeX khi gõ)
 *   - LinkDialog: chèn/sửa siêu liên kết
 *   - ImagePicker: chọn ảnh từ máy → chèn base64
 */
import { dialog } from '@/components/Dialog'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import katex from 'katex'
import { cn } from '@/lib/cn'
import { uploadImage } from '@/lib/mediaStore'
import { IconClose, IconEquation, IconLink, IconPicture, IconShapes, IconSymbol, IconTable } from './icons'
import { RibbonButton } from './Layout'
import { Portal } from '@/components/Portal'
import { Segmented } from '@/components/Segmented'
import { SNIPPET_GROUPS, applySnippet } from './mathSnippets'
import { useAnchoredPopover, popoverStyle } from './useAnchoredPopover'

/* ------------------------------------------------------------------ *
 * Table picker — lưới 10×8 như Word
 * ------------------------------------------------------------------ */

export function TablePicker({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 228)
  const MAX_R = 8
  const MAX_C = 10

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const insert = (rows: number, cols: number) => {
    if (!editor || editor.isDestroyed) return
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setOpen(false)
  }

  return (
    <div className="rb-drop" ref={ref}>
      <span ref={triggerRef as React.RefObject<HTMLSpanElement>} className="rb-drop-trigger">
        <RibbonButton
          icon={<IconTable size={26} />}
          label="Bảng"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        />
      </span>
      {open && (
        <div className="rb-drop-menu rb-table-picker" style={popoverStyle(pos)}>
          <div
            className="rb-table-grid"
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: MAX_R * MAX_C }).map((_, i) => {
              const r = Math.floor(i / MAX_C)
              const c = i % MAX_C
              const on = hover && r <= hover.r && c <= hover.c
              return (
                <button
                  key={i}
                  type="button"
                  className={cn('rb-table-cell', on && 'on')}
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(r + 1, c + 1)}
                  aria-label={`${r + 1} hàng ${c + 1} cột`}
                />
              )
            })}
          </div>
          <div className="rb-table-label tnum">
            {hover ? `${hover.r + 1} × ${hover.c + 1}` : 'Chọn kích thước bảng'}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Symbol picker
 * ------------------------------------------------------------------ */

const SYMBOLS = [
  '±', '×', '÷', '≠', '≤', '≥', '≈', '∞', '∑', '∏',
  '√', '∛', '∫', '∂', '∇', '∆', 'π', 'α', 'β', 'γ',
  'δ', 'θ', 'λ', 'μ', 'σ', 'φ', 'ω', '°', '′', '″',
  '½', '⅓', '¼', '¾', '⅛', '→', '←', '↑', '↓', '↔',
  '⇒', '⇔', '∈', '∉', '⊂', '⊆', '∪', '∩', '∅', 'ℕ',
  'ℤ', 'ℚ', 'ℝ', 'ℂ', '✓', '✗', '★', '☆', '♪', '§',
]

export function SymbolPicker({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // lưới 10 cột × 28px + 9 gap 2px = 298px, cộng padding 2×8px của menu
  const { triggerRef, pos } = useAnchoredPopover(open, 314)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="rb-drop" ref={ref}>
      <span ref={triggerRef as React.RefObject<HTMLSpanElement>} className="rb-drop-trigger">
        <RibbonButton
          icon={<IconSymbol size={26} />}
          label="Ký hiệu"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        />
      </span>
      {open && (
        <div className="rb-drop-menu rb-symbol-grid" style={popoverStyle(pos)}>
          {SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              className="rb-symbol-cell"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!editor || editor.isDestroyed) {
                  setOpen(false)
                  return
                }
                editor.chain().focus().insertContent(s).run()
                setOpen(false)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Equation dialog — nhập LaTeX, preview KaTeX ngay khi gõ
 * ------------------------------------------------------------------ */

export function EquationDialog({
  editor,
  onClose,
  initial,
  onSave,
}: {
  editor: Editor
  onClose: () => void
  /** sửa công thức có sẵn: LaTeX cũ */
  initial?: string
  /** sửa: thay công thức cũ thay vì chèn mới */
  onSave?: (tex: string) => void
}) {
  const [tex, setTex] = useState(initial ?? '')
  const [err, setErr] = useState('')
  const [group, setGroup] = useState(SNIPPET_GROUPS[0].key)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  /** vị trí con trỏ cần đặt sau khi chèn lệnh (đặt ngay sau lần vẽ kế tiếp) */
  const caretRef = useRef<number | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useLayoutEffect(() => {
    const ta = inputRef.current
    if (caretRef.current === null || !ta) return
    ta.focus()
    ta.setSelectionRange(caretRef.current, caretRef.current)
    caretRef.current = null
  }, [tex])

  const preview = () => {
    try {
      return { html: katex.renderToString(tex, { throwOnError: false, displayMode: true }), ok: true }
    } catch {
      return { html: '', ok: false }
    }
  }

  /** bấm một lệnh: chèn vào chỗ con trỏ trong ô LaTeX, chữ đang chọn vào chỗ nhập, con trỏ đặt sẵn để gõ tiếp */
  const addSnippet = (snip: string) => {
    const ta = inputRef.current
    const start = ta?.selectionStart ?? tex.length
    const end = ta?.selectionEnd ?? tex.length
    const next = applySnippet(tex, start, end, snip)
    caretRef.current = next.caret
    setTex(next.text)
    setErr('')
  }

  const insert = () => {
    const latex = tex.trim()
    if (!latex) return
    if (onSave) onSave(latex)
    // chèn thẳng thành node công thức (lưu lại vẫn là $...$ như quy ước cũ)
    else editor.chain().focus().insertContent([{ type: 'inlineMath', attrs: { latex } }, { type: 'text', text: ' ' }]).run()
    onClose()
  }

  const p = tex.trim() ? preview() : null
  const items = SNIPPET_GROUPS.find((g) => g.key === group)?.items ?? []

  // ra thẳng body: mở từ trong khung trang đang zoom thì lớp nền mờ đặt tại chỗ chỉ phủ một phần trang
  return (
    <Portal>
      <div className="rb-modal-backdrop" onMouseDown={onClose}>
        <div className="rb-modal rb-modal--eq" onMouseDown={(e) => e.stopPropagation()}>
          <div className="rb-modal__header">
            <IconEquation size={16} />
            <b>Công thức</b>
            <button type="button" className="rb-modal__close" onClick={onClose} aria-label="Đóng">
              <IconClose size={14} />
            </button>
          </div>
          <div className="rb-modal__body">
            <Segmented
              value={group}
              onChange={setGroup}
              label="Nhóm lệnh công thức"
              className="!h-8 w-full [&>button]:flex-1 [&>button]:justify-center [&>button]:px-1.5 [&>button]:text-[12px]"
              options={SNIPPET_GROUPS.map((g) => ({ key: g.key, label: g.label }))}
            />
            <div className="eq-snippets" role="toolbar" aria-label="Lệnh công thức">
              {items.map((it) => (
                <button
                  key={it.tip}
                  type="button"
                  className="eq-snippet"
                  data-tip={it.tip}
                  aria-label={it.tip}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addSnippet(it.snip)}
                  dangerouslySetInnerHTML={{ __html: snippetHtml(it.show ?? it.snip.replace(/#/g, '\\square')) }}
                />
              ))}
            </div>
            <textarea
              ref={inputRef}
              className="rb-modal__input"
              rows={3}
              placeholder="Nhập LaTeX hoặc bấm lệnh phía trên, ví dụ: \frac{a}{b} + \sqrt{x^2}"
              value={tex}
              spellCheck={false}
              onChange={(e) => {
                setTex(e.target.value)
                setErr('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  insert()
                }
                if (e.key === 'Escape') onClose()
              }}
            />
            {p && (
              <div
                className="rb-modal__preview"
                dangerouslySetInnerHTML={{ __html: p.html }}
                aria-label="Xem trước công thức"
              />
            )}
            {err && <div className="rb-modal__err">{err}</div>}
          </div>
          <div className="rb-modal__footer">
            <button type="button" className="rb-modal__btn" onClick={onClose}>
              Hủy
            </button>
            <button type="button" className="rb-modal__btn rb-modal__btn--primary" onClick={insert}>
              {onSave ? 'Lưu' : 'Chèn'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

/** KaTeX của nút lệnh, vẽ một lần rồi nhớ */
const snippetCache = new Map<string, string>()
function snippetHtml(tex: string) {
  let html = snippetCache.get(tex)
  if (html === undefined) {
    html = katex.renderToString(tex, { throwOnError: false, strict: false })
    snippetCache.set(tex, html)
  }
  return html
}

/* ------------------------------------------------------------------ *
 * Link dialog
 * ------------------------------------------------------------------ */

export function LinkDialog({
  editor,
  onClose,
  initialHref,
}: {
  editor: Editor
  onClose: () => void
  /** sửa liên kết có sẵn: điền sẵn địa chỉ cũ */
  initialHref?: string
}) {
  const [text, setText] = useState('')
  const [href, setHref] = useState(initialHref || 'https://')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const { from, to } = editor.state.selection
    if (from < to) setText(editor.state.doc.textBetween(from, to, ' '))
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editor])

  const insert = () => {
    const url = href.trim()
    if (!url) return
    const { from, to } = editor.state.selection
    if (from < to) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      editor.chain().focus().insertContent({ type: 'text', text: text || url, marks: [{ type: 'link', attrs: { href: url } }] }).run()
    }
    onClose()
  }

  return (
    <div className="rb-modal-backdrop" onMouseDown={onClose}>
      <div className="rb-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rb-modal__header">
          <IconLink size={16} />
          <b>Siêu liên kết</b>
          <button type="button" className="rb-modal__close" onClick={onClose} aria-label="Đóng">
            <IconClose size={14} />
          </button>
        </div>
        <div className="rb-modal__body">
          <label className="rb-modal__label">
            Văn bản hiển thị
            <input
              className="rb-modal__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="(để trống nếu dùng URL)"
            />
          </label>
          <label className="rb-modal__label">
            Địa chỉ
            <input
              ref={inputRef}
              className="rb-modal__input"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  insert()
                }
                if (e.key === 'Escape') onClose()
              }}
            />
          </label>
        </div>
        <div className="rb-modal__footer">
          <button
            type="button"
            className="rb-modal__btn"
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              onClose()
            }}
          >
            Bỏ liên kết
          </button>
          <button type="button" className="rb-modal__btn" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="rb-modal__btn rb-modal__btn--primary" onClick={insert}>
            Chèn
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Image picker — chọn ảnh từ máy, chèn base64
 * ------------------------------------------------------------------ */

export function ImagePicker({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      if (!editor || editor.isDestroyed) return
      try {
        const src = await uploadImage(String(reader.result ?? ''))
        if (!editor.isDestroyed) editor.chain().focus().setImage({ src }).run()
      } catch (err) {
        void dialog.alert(err instanceof Error ? err.message : 'Không chèn được ảnh này.', { title: 'Không chèn được ảnh' })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <RibbonButton
        icon={<IconPicture size={26} />}
        label="Hình ảnh"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Hình dạng — dùng chung thư viện hình của slide, chèn thành ảnh nét đen
 * ------------------------------------------------------------------ */

/** Vẽ hình ra PNG nền trong suốt (2× để in nét), nét đen như hình vẽ trong đề. */
async function shapePng(prst: string, px = 240): Promise<string> {
  const [{ renderToStaticMarkup }, { ShapePreview }] = await Promise.all([import('react-dom/server'), import('./ShapeGallery')])
  const raw = renderToStaticMarkup(<ShapePreview prst={prst} />)
  // hình khép kín vẽ nét không phóng (non-scaling-stroke) → cỡ nét tính bằng px ảnh; đường thẳng thì nét phóng theo khung 32
  const stroke = raw.includes('non-scaling-stroke') ? 2.4 : (2.4 * 32) / px
  const svg = raw
    .replace(/width="26" height="26"/, `width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg"`)
    .replace(/currentColor/g, '#000')
    // 2.4px ở ảnh 2× ≈ 1.2px khi hiện, gần nét bút vẽ hình trong đề
    .replace(/stroke-width="1.3"/g, `stroke-width="${stroke}"`)
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = px
  canvas.getContext('2d')!.drawImage(img, 0, 0, px, px)
  return canvas.toDataURL('image/png')
}

export function ShapePicker({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 368)
  const [Gallery, setGallery] = useState<null | typeof import('./ShapeGallery').ShapeGallery>(null)

  useEffect(() => {
    if (!open) return
    // thư viện hình chỉ nạp khi mở lần đầu
    if (!Gallery) void import('./ShapeGallery').then((m) => setGallery(() => m.ShapeGallery))
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, Gallery])

  const pick = async (prst: string) => {
    setOpen(false)
    if (!editor || editor.isDestroyed) return
    try {
      const src = await uploadImage(await shapePng(prst))
      if (!editor.isDestroyed) editor.chain().focus().setImage({ src, width: 120 }).run()
    } catch (err) {
      void dialog.alert(err instanceof Error ? err.message : 'Không chèn được hình này.', { title: 'Không chèn được hình' })
    }
  }

  return (
    <div className="rb-drop" ref={ref}>
      <span ref={triggerRef as React.RefObject<HTMLSpanElement>} className="rb-drop-trigger">
        <RibbonButton icon={<IconShapes size={26} />} label="Hình dạng" disabled={disabled} onClick={() => setOpen((o) => !o)} />
      </span>
      {open && (
        <div className="rb-drop-menu" style={popoverStyle(pos)}>
          {Gallery ? <Gallery onPick={(p) => void pick(p)} /> : <div className="h-40 w-[352px]" />}
        </div>
      )}
    </div>
  )
}
