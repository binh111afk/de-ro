/** Thư viện hình khối (tab Chèn → Hình dạng): 109 hình theo 7 nhóm, giống bảng Shapes của PowerPoint. */
import { PRESET_GROUPS, presetPaths } from '@/lib/slidePresets'

/** Hình xem trước kiểu nét viền (như bảng Shapes của PowerPoint): không tô nền, nét mảnh, đỡ dính nhau ở sao/răng cưa. */
function Preview({ prst }: { prst: string }) {
  const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  if (prst === 'line' || prst === 'lineArrow' || prst === 'lineArrowDouble') {
    const end = prst !== 'line'
    const start = prst === 'lineArrowDouble'
    return (
      <svg viewBox="0 0 32 32" width="26" height="26" {...line}>
        <path d={`M${start ? 4 : 4} 28 L28 4`} />
        {end && <path d="M28 4 H21 M28 4 V11" />}
        {start && <path d="M4 28 H11 M4 28 V21" />}
      </svg>
    )
  }
  // hộp 20×20 (đơn vị % slide của `presetPaths`: w = 2, h = 3,556) — nhỏ hơn ô để nét không chạm mép
  const { W, H, both, fillOnly, strokeOnly } = presetPaths(prst, 2, 3.556)
  const pad = 1.5
  return (
    <svg viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}`} width="26" height="26" preserveAspectRatio="none" {...line} vectorEffect="non-scaling-stroke">
      {both && <path d={both} vectorEffect="non-scaling-stroke" />}
      {fillOnly && <path d={fillOnly} vectorEffect="non-scaling-stroke" />}
      {strokeOnly && <path d={strokeOnly} vectorEffect="non-scaling-stroke" />}
    </svg>
  )
}

export function ShapeGallery({ onPick }: { onPick: (prst: string) => void }) {
  return (
    <div className="max-h-[420px] w-[352px] overflow-y-auto p-1" onMouseDown={(e) => e.preventDefault()}>
      {PRESET_GROUPS.map((group) => (
        <section key={group.group} className="mb-2 last:mb-0">
          <h4 className="mb-1 px-1 text-[11.5px] font-semibold text-ink-3">{group.group}</h4>
          <div className="grid grid-cols-8 gap-1">
            {group.shapes.map((shape) => (
              <button
                key={shape.prst}
                type="button"
                title={shape.label}
                aria-label={shape.label}
                className="flex size-[40px] items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 hover:text-clay"
                onClick={() => onPick(shape.prst)}
              >
                <Preview prst={shape.prst} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
