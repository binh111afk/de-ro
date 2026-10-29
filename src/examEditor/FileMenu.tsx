/**
 * Menu "Tệp" ở đầu hàng tab ribbon (đề + slide): Đề mới / Nhập file / Tải xuống.
 *
 * Nút nâu chữ trắng để tách khỏi các tab thường. Menu neo `position: fixed`
 * (useAnchoredPopover) nên không bị ribbon cắt; file nhập đi qua /api/extract
 * và được chuyển thành block đề / slide ở call site.
 */
import { useEffect, useRef, useState } from 'react'
import { IconPlus } from './icons'
import { popoverStyle, useAnchoredPopover } from './useAnchoredPopover'
import { IMPORT_ACCEPT } from '@/lib/importFile'

export interface FileMenuProps {
  kind: 'exam' | 'slide'
  onNew: () => void
  onImport: (file: File) => Promise<void>
  onDownload: () => void | Promise<void>
  /** phần mở rộng của tệp tải xuống, chỉ để hiện gợi ý */
  downloadHint: string
  /** lưu ý dưới mục tải xuống (vd. giới hạn khi xuất) */
  downloadNote?: string
  /** mục xuất thêm sau "Tải xuống file" (vd. PDF) */
  extra?: { label: string; hint: string; onClick: () => void; icon?: React.ReactNode }
}

function IconTray({ up = false }: { up?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={up ? 'M8 9.5v-7m0 0L5.4 5.1M8 2.5l2.6 2.6' : 'M8 2.5v7m0 0L5.4 6.9M8 9.5l2.6-2.6'}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.8 10.4v1.4c0 .8.6 1.4 1.4 1.4h7.6c.8 0 1.4-.6 1.4-1.4v-1.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FileMenu({ kind, onNew, onImport, onDownload, downloadHint, downloadNote, extra }: FileMenuProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 268)

  const newLabel = kind === 'slide' ? 'Bài giảng mới' : 'Đề mới'
  const newHint = kind === 'slide' ? 'Bài giảng trống trong tab mới' : 'Đề trống trong tab mới'

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    setError(null)
    setOpen((o) => !o)
  }

  const runDownload = async () => {
    setBusy(true)
    setError(null)
    try {
      await onDownload()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải xuống được.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="file-menu" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        className="file-menu__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        Tệp
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 6.5 8 10.5l4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="file-menu__pop" style={popoverStyle(pos)} role="menu" aria-label="Tệp">
          <button
            type="button"
            role="menuitem"
            className="file-menu__item"
            disabled={busy}
            onClick={() => {
              setOpen(false)
              onNew()
            }}
          >
            <span className="file-menu__icon">
              <IconPlus size={16} />
            </span>
            <span className="file-menu__text">
              <span className="file-menu__label">{newLabel}</span>
              <span className="file-menu__hint">{newHint}</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="file-menu__item"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <span className="file-menu__icon">
              <IconTray />
            </span>
            <span className="file-menu__text">
              <span className="file-menu__label">Nhập file…</span>
              <span className="file-menu__hint">Word, Excel, PowerPoint</span>
            </span>
          </button>

          <div className="file-menu__sep" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="file-menu__item"
            disabled={busy}
            onClick={runDownload}
          >
            <span className="file-menu__icon">
              <IconTray up />
            </span>
            <span className="file-menu__text">
              <span className="file-menu__label">Tải xuống file</span>
              <span className="file-menu__hint">{downloadHint}</span>
            </span>
          </button>

          {extra && (
            <button
              type="button"
              role="menuitem"
              className="file-menu__item"
              disabled={busy}
              onClick={() => {
                setOpen(false)
                extra.onClick()
              }}
            >
              <span className="file-menu__icon">{extra.icon ?? <IconTray up />}</span>
              <span className="file-menu__text">
                <span className="file-menu__label">{extra.label}</span>
                <span className="file-menu__hint">{extra.hint}</span>
              </span>
            </button>
          )}
          {downloadNote && <div className="file-menu__note">{downloadNote}</div>}
          {busy && <div className="file-menu__status">Đang xử lý tệp…</div>}
          {error && (
            <div className="file-menu__error" role="alert">
              {error}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={IMPORT_ACCEPT}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setBusy(true)
          setError(null)
          try {
            await onImport(file)
            setOpen(false)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Không nhập được tệp.')
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
