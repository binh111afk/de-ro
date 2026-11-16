/** Ô nhập mã màu (#rrggbb) + ô mở bảng màu của máy — dùng chung bảng vẽ và ribbon soạn đề. */
import { useEffect, useState } from 'react'

export function HexInput({ value, onPreview, onCommit }: { value: string; onPreview: (c: string) => void; onCommit: (c: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const valid = (t: string) => /^#?[0-9a-f]{6}$/i.test(t.trim())
  const norm = (t: string) => `#${t.trim().replace('#', '').toLowerCase()}`
  const commit = () => { if (valid(text) && norm(text) !== value.toLowerCase()) onCommit(norm(text)) }
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-[6px] border border-black/10" style={{ background: valid(text) ? norm(text) : value }} data-tip="Mở bảng màu">
        <input type="color" value={valid(text) ? norm(text) : '#000000'} className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { setText(e.target.value); onPreview(e.target.value) }} onBlur={(e) => onCommit(e.target.value)} />
      </label>
      <div className={`flex h-7 flex-1 items-center rounded-[6px] border bg-surface px-2 ${valid(text) ? 'border-line focus-within:border-clay' : 'border-red-400'}`}>
        <span className="whitespace-nowrap text-[12px] text-ink-3">Mã màu</span>
        <input
          value={text} spellCheck={false} maxLength={7} aria-label="Mã màu"
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } e.stopPropagation() }}
          className="ml-2 w-full min-w-0 bg-transparent font-mono text-[12.5px] uppercase text-ink outline-none"
        />
      </div>
    </div>
  )
}
