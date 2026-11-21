import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WandSparkles } from 'lucide-react'
import { HexInput } from '@/components/HexInput'
import type { SlideElement } from '@/store/docs'
import { hasTextEffects } from '@/lib/slideTextEffects'
import { popoverStyle, useAnchoredPopover } from './useAnchoredPopover'

function Effect({ label, enabled, toggle, children }: { label: string; enabled: boolean; toggle: () => void; children: ReactNode }) {
  return (
    <div className="space-y-2 border-b border-line px-2 py-2 last:border-b-0">
      <label className="flex cursor-pointer items-center justify-between gap-2 font-medium">
        {label}
        <input type="checkbox" role="switch" checked={enabled} onChange={toggle} className="accent-clay" />
      </label>
      {enabled && children}
    </div>
  )
}

function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min: number; max: number; onCommit: (n: number) => void }) {
  return (
    <label className="flex min-w-0 items-center gap-1 text-ink-2">
      <span className="shrink-0 whitespace-nowrap">{label}</span>
      <input
        key={value}
        type="number"
        min={min}
        max={max}
        defaultValue={value}
        className="min-w-0 flex-1 rounded border border-line bg-surface px-1 py-0.5 tabular-nums"
        onBlur={(e) => {
          const n = e.currentTarget.valueAsNumber
          const next = Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : value
          e.currentTarget.value = String(next)
          if (next !== value) onCommit(next)
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      />
    </label>
  )
}

function EffectColor({ label, value, onCommit }: { label: string; value: string; onCommit: (color: string) => void }) {
  return <div role="group" aria-label={label}><span className="mb-1 block text-ink-2">{label}</span><HexInput value={value} onPreview={() => {}} onCommit={onCommit} /></div>
}

export function SlideTextEffectsTool({ el, accent, onUpdate, ribbon }: {
  el?: SlideElement
  accent: string
  onUpdate: (patch: Partial<SlideElement>) => void
  ribbon?: boolean
}) {
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 252)
  const id = el?.id
  useEffect(() => setOpen(false), [id])
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector('input')?.focus()
    const closeOutside = (e: PointerEvent) => {
      const node = e.target as Node
      if (!panel.current?.contains(node) && !triggerRef.current?.contains(node)) setOpen(false)
    }
    window.addEventListener('pointerdown', closeOutside)
    return () => window.removeEventListener('pointerdown', closeOutside)
  }, [open, triggerRef])

  const stroke = el?.textStroke ?? { width: 2, color: '#111827' }
  const shadow = el?.textShadow ?? { x: 3, y: 4, blur: 4, color: '#111827' }
  const gradient = el?.textGradient ?? { from: el?.textColor ?? accent, to: '#db2777', angle: 90 }
  const active = el && hasTextEffects(el)
  const canEdit = el?.type === 'text' || (el?.type === 'shape' && Boolean(el.text?.trim()) && el.shape !== 'line')
  return (
    <>
      <span ref={(node) => { triggerRef.current = node }} className="inline-flex">
        <button
          type="button" aria-label="Hiệu ứng chữ" data-tip="Hiệu ứng chữ" aria-haspopup="dialog" aria-expanded={open && canEdit}
          className={ribbon ? `rb-icon ${active || open ? 'active' : ''}` : `flex size-7 items-center justify-center rounded-md text-ink-2 hover:bg-paper-2 ${active || open ? 'bg-paper-2 text-clay' : ''}`}
          disabled={!canEdit}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen(!open)}
        >
          <WandSparkles size={16} />
        </button>
      </span>
      {open && canEdit && createPortal(
        <div
          ref={panel} role="dialog" aria-label="Hiệu ứng chữ"
          className="z-[250] max-h-[min(320px,55vh)] w-[252px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border border-line bg-surface p-1 text-xs text-ink shadow-lg"
          style={popoverStyle(pos)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Escape') {
              setOpen(false)
              triggerRef.current?.querySelector('button')?.focus()
            }
          }}
        >
          <Effect label="Viền chữ" enabled={Boolean(el.textStroke)} toggle={() => onUpdate({ textStroke: el.textStroke ? undefined : stroke })}>
            <NumberField label="Độ dày" value={stroke.width} min={1} max={24} onCommit={width => onUpdate({ textStroke: { ...stroke, width } })} />
            <EffectColor label="Màu viền" value={stroke.color} onCommit={color => onUpdate({ textStroke: { ...stroke, color } })} />
          </Effect>
          <Effect label="Bóng chữ" enabled={Boolean(el.textShadow)} toggle={() => onUpdate({ textShadow: el.textShadow ? undefined : shadow })}>
            <div className="grid grid-cols-3 gap-2">
              <NumberField label="X" value={shadow.x} min={-32} max={32} onCommit={x => onUpdate({ textShadow: { ...shadow, x } })} />
              <NumberField label="Y" value={shadow.y} min={-32} max={32} onCommit={y => onUpdate({ textShadow: { ...shadow, y } })} />
              <NumberField label="Mờ" value={shadow.blur} min={0} max={32} onCommit={blur => onUpdate({ textShadow: { ...shadow, blur } })} />
            </div>
            <EffectColor label="Màu bóng" value={shadow.color} onCommit={color => onUpdate({ textShadow: { ...shadow, color } })} />
          </Effect>
          <Effect label="Màu chuyển sắc" enabled={Boolean(el.textGradient)} toggle={() => onUpdate({ textGradient: el.textGradient ? undefined : gradient })}>
            <NumberField label="Góc (°)" value={gradient.angle} min={0} max={360} onCommit={angle => onUpdate({ textGradient: { ...gradient, angle } })} />
            <EffectColor label="Màu đầu" value={gradient.from} onCommit={from => onUpdate({ textGradient: { ...gradient, from } })} />
            <EffectColor label="Màu cuối" value={gradient.to} onCommit={to => onUpdate({ textGradient: { ...gradient, to } })} />
          </Effect>
          <Effect label="Uốn cong" enabled={el.textArc !== undefined} toggle={() => onUpdate({ textArc: el.textArc === undefined ? 90 : undefined })}>
            <NumberField label="Độ cong (°)" value={el.textArc ?? 0} min={-180} max={180} onCommit={textArc => onUpdate({ textArc })} />
          </Effect>
        </div>,
        document.body,
      )}
    </>
  )
}
