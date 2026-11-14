/** Hộp công cụ Dao động (điều hoà, xoay chiều, sóng dừng). */
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { type ToolDoc } from '@/lib/toolSpec'
import { svgDataUrl } from '@/lib/plot'
import { AC_DEFAULT, OSC_DEFAULT, OSC_Y_DEFAULT, STANDING_DEFAULT, acEquation, fmtAcAmp, formatOmega, oscEquation, oscParams, oscPeriod, parseOscExpr, standingInfo, type AcSpec, type OscMode, type OscQty, type OscSpec, type OscStart, type OscStartX0, type StandingSpec } from '@/lib/oscillation'
import { Segmented } from '@/components/Segmented'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { type Props, useRender } from './toolModalKit'

const OSC_QTYS: Array<{ id: OscQty; label: string }> = [
  { id: 'x', label: 'Li độ x' },
  { id: 'v', label: 'Vận tốc v' },
  { id: 'a', label: 'Gia tốc a' },
]

const OSC_PERIOD_BY: Array<{ id: OscSpec['period']['by']; label: string }> = [
  { id: 'T', label: 'T (s)' },
  { id: 'f', label: 'f (Hz)' },
  { id: 'omega', label: 'ω (rad/s)' },
]

const OSC_X0S: Array<{ id: OscStartX0; label: string }> = [
  { id: '-A', label: '−A' },
  { id: '-A√3/2', label: '−A√3/2' },
  { id: '-A√2/2', label: '−A√2/2' },
  { id: '-A/2', label: '−A/2' },
  { id: '0', label: '0 (VTCB)' },
  { id: 'A/2', label: 'A/2' },
  { id: 'A√2/2', label: 'A√2/2' },
  { id: 'A√3/2', label: 'A√3/2' },
  { id: 'A', label: 'A' },
]

const OSC_PHI_PRESETS: Array<{ label: string; text: string; val: number }> = [
  { label: '0', text: '0', val: 0 },
  { label: 'π/2', text: '0,5', val: 0.5 },
  { label: '−π/2', text: '-0,5', val: -0.5 },
  { label: 'π', text: '1', val: 1 },
  { label: 'π/3', text: '1/3', val: 1 / 3 },
  { label: '−π/3', text: '-1/3', val: -1 / 3 },
]

const OSC_TEND_PRESETS: Array<{ label: string; k: number }> = [
  { label: '1T', k: 1 },
  { label: '1,25T', k: 1.25 },
  { label: '1,5T', k: 1.5 },
  { label: '2T', k: 2 },
]

const OSC_GRIDS: Array<{ id: OscSpec['grid']; label: string }> = [
  { id: 'T/8', label: 'T/8 (ô A/4)' },
  { id: 'T/4', label: 'T/4 (ô A/2)' },
  { id: 'none', label: 'Không' },
]

const OSC_TICKS: Array<{ id: OscSpec['ticks']; label: string }> = [
  { id: 'value', label: 'Số liệu' },
  { id: 'symbol', label: 'Kí hiệu (A, T…)' },
]

const fmtOscInput = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 1e6) / 1e6).replace('.', ',') : '')

function OscStartPicker({
  value,
  onChange,
}: {
  value: OscStart
  onChange: (next: OscStart) => void
}) {
  const [phiText, setPhiText] = useState(() => fmtOscInput(value.by === 'phi' ? value.phiPi : 0.5))
  const pill = (on: boolean) =>
    cn(
      'rounded-[6px] border px-2 py-1 text-[12px] transition-colors',
      on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
    )

  const toPhiMode = () => {
    if (value.by === 'phi') return
    let phiPi = 0
    try {
      phiPi = oscParams({ A: 1, period: { by: 'T', value: 1 }, start: value }).phi / Math.PI
    } catch {
      phiPi = 0
    }
    setPhiText(fmtOscInput(phiPi))
    onChange({ by: 'phi', phiPi })
  }

  const toStateMode = () => {
    if (value.by === 'state') return
    onChange({ by: 'state', x0: '0', dir: 'down' })
  }

  const atBoundary = value.by === 'state' && (value.x0 === 'A' || value.x0 === '-A')

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <button type="button" aria-pressed={value.by === 'state'} onClick={toStateMode} className={pill(value.by === 'state')}>
          Từ x₀, chiều
        </button>
        <button type="button" aria-pressed={value.by === 'phi'} onClick={toPhiMode} className={pill(value.by === 'phi')}>
          Nhập pha φ
        </button>
      </div>
      {value.by === 'state' ? (
        <>
          <div className="grid grid-cols-3 gap-1">
            {OSC_X0S.map((it) => (
              <button
                key={it.id}
                type="button"
                aria-pressed={value.x0 === it.id}
                onClick={() => onChange({ by: 'state', x0: it.id, dir: value.dir })}
                className={pill(value.x0 === it.id)}
              >
                {it.label}
              </button>
            ))}
          </div>
          {atBoundary ? (
            <p className="text-[11.5px] text-ink-3">Tại biên ±A, vận tốc bằng 0 (không phân biệt chiều).</p>
          ) : (
            <div className="flex gap-1.5">
              {(
                [
                  ['up', 'Chiều dương (+)'],
                  ['down', 'Chiều âm (−)'],
                ] as const
              ).map(([d, label]) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={value.dir === d}
                  onClick={() => onChange({ by: 'state', x0: value.x0, dir: d })}
                  className={cn(pill(value.dir === d), 'flex-1')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[12.5px] text-ink-2">φ =</span>
            <input
              value={phiText}
              onChange={(e) => {
                const v = e.target.value
                setPhiText(v)
                onChange({ by: 'phi', phiPi: parseOscExpr(v, false) })
              }}
              placeholder="vd. 0,5 hoặc -1/3"
              aria-label="Pha ban đầu theo đơn vị pi"
              className={cn(inputClass, 'h-9 flex-1')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">π (rad)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {OSC_PHI_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPhiText(p.text)
                  onChange({ by: 'phi', phiPi: p.val })
                }}
                className={pill(Math.abs(value.phiPi - p.val) < 1e-6)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function OscModal({ initial, submitLabel, onClose, onInsert }: Props<OscSpec>) {
  const [spec, setSpec] = useState<OscSpec>(() => (initial ? { ...OSC_DEFAULT, ...initial } : OSC_DEFAULT))
  const mode: OscMode = spec.mode ?? 'osc'
  const ac = spec.ac ?? AC_DEFAULT
  const st = spec.standing ?? STANDING_DEFAULT
  const [aText, setAText] = useState(() => fmtOscInput(spec.A))
  const [pText, setPText] = useState(() =>
    spec.period.by === 'omega' ? formatOmega(spec.period.value) : fmtOscInput(spec.period.value),
  )
  const [tEndText, setTEndText] = useState(() => fmtOscInput(spec.tEnd))
  const [sAText, setSAText] = useState(() =>
    spec.second?.A !== undefined ? fmtOscInput(spec.second.A) : '',
  )
  const [u0Text, setU0Text] = useState(() => fmtAcAmp(ac.U0))
  const [i0Text, setI0Text] = useState(() => fmtAcAmp(ac.I0))
  const [acPText, setAcPText] = useState(() =>
    ac.period.by === 'omega' ? formatOmega(ac.period.value) : fmtOscInput(ac.period.value),
  )
  const [phiUText, setPhiUText] = useState(() => fmtOscInput(ac.phiUPi))
  const [phiIText, setPhiIText] = useState(() => fmtOscInput(ac.phiIPi))
  const [acTEndText, setAcTEndText] = useState(() => fmtOscInput(ac.tEnd))
  const [stLenText, setStLenText] = useState(() => fmtOscInput(st.length))
  const [stAText, setStAText] = useState(() => fmtOscInput(st.A))

  const set = (p: Partial<OscSpec>) => setSpec((s) => ({ ...s, ...p }))
  const setAc = (p: Partial<AcSpec>) => setSpec((s) => ({ ...s, mode: 'ac', ac: { ...(s.ac ?? AC_DEFAULT), ...p } }))
  const setSt = (p: Partial<StandingSpec>) =>
    setSpec((s) => ({ ...s, mode: 'standing', standing: { ...(s.standing ?? STANDING_DEFAULT), ...p } }))
  const doc = useMemo((): ToolDoc => ({ kind: 'osc', spec }), [spec])
  const { preview, error } = useRender(doc)

  const curT = useMemo(() => {
    try {
      return oscPeriod(spec).T
    } catch {
      return null
    }
  }, [spec])

  const acT = useMemo(() => {
    try {
      return oscPeriod({ period: ac.period }).T
    } catch {
      return null
    }
  }, [ac.period])

  const eqText = useMemo(() => {
    if (mode !== 'osc') return null
    try {
      return oscEquation(spec)
    } catch {
      return null
    }
  }, [mode, spec])

  const eq2Text = useMemo(() => {
    if (mode !== 'osc' || !spec.second) return null
    try {
      return oscEquation(spec, spec.second)
    } catch {
      return null
    }
  }, [mode, spec])

  const acEq = useMemo(() => {
    if (mode !== 'ac') return null
    try {
      return acEquation({ ac })
    } catch {
      return null
    }
  }, [mode, ac])

  const stSummary = useMemo(() => {
    if (mode !== 'standing') return null
    try {
      const info = standingInfo(st)
      return `λ = ${fmtOscInput(info.lambda)} cm · ${info.nodes.length} nút · ${info.antinodes.length} bụng`
    } catch {
      return null
    }
  }, [mode, st])

  const pill = (on: boolean) =>
    cn(
      'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
      on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
    )

  const switchMode = (next: OscMode) => {
    if (next === 'ac') set({ mode: 'ac', ac: spec.ac ?? AC_DEFAULT })
    else if (next === 'standing') set({ mode: 'standing', standing: spec.standing ?? STANDING_DEFAULT })
    else set({ mode: 'osc' })
  }

  const switchQty = (qty: OscQty) => {
    const isDefaultY = !spec.yName.trim() || Object.values(OSC_Y_DEFAULT).includes(spec.yName)
    set({ qty, ...(isDefaultY ? { yName: OSC_Y_DEFAULT[qty] } : {}) })
  }

  const switchPeriodBy = (by: OscSpec['period']['by']) => {
    if (by === spec.period.by) return
    if (curT) {
      const nextVal = by === 'T' ? curT : by === 'f' ? 1 / curT : (2 * Math.PI) / curT
      setPText(by === 'omega' ? formatOmega(nextVal) : fmtOscInput(nextVal))
      set({ period: { by, value: nextVal } })
    } else {
      set({ period: { by, value: spec.period.value } })
    }
  }

  const switchAcPeriodBy = (by: AcSpec['period']['by']) => {
    if (by === ac.period.by) return
    if (acT) {
      const nextVal = by === 'T' ? acT : by === 'f' ? 1 / acT : (2 * Math.PI) / acT
      setAcPText(by === 'omega' ? formatOmega(nextVal) : fmtOscInput(nextVal))
      setAc({ period: { by, value: nextVal } })
    } else {
      setAc({ period: { by, value: ac.period.value } })
    }
  }

  const applyTEndPreset = (k: number) => {
    if (!curT) return
    const next = Math.round(k * curT * 1e6) / 1e6
    setTEndText(fmtOscInput(next))
    set({ tEnd: next })
  }

  const applyAcTEndPreset = (k: number) => {
    if (!acT) return
    const next = Math.round(k * acT * 1e6) / 1e6
    setAcTEndText(fmtOscInput(next))
    setAc({ tEnd: next })
  }

  const modeSelector = (
    <section>
      <h3 className={sectionTitle}>Loại đồ thị</h3>
      <Segmented<OscMode>
        value={mode}
        onChange={switchMode}
        label="Loại đồ thị"
        className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
        options={[
          { key: 'osc', label: 'Dao động' },
          { key: 'ac', label: 'Điện xoay chiều' },
          { key: 'standing', label: 'Sóng dừng' },
        ]}
      />
    </section>
  )

  const acInputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Giá trị cực đại</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[12.5px] text-ink-2">U₀ =</span>
            <input
              value={u0Text}
              onChange={(e) => {
                const v = e.target.value
                setU0Text(v)
                setAc({ U0: parseOscExpr(v, false) })
              }}
              placeholder="220√2"
              aria-label="Điện áp cực đại U0 (V)"
              className={cn(inputClass, 'h-9 flex-1 min-w-0')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">V</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[12.5px] text-ink-2">I₀ =</span>
            <input
              value={i0Text}
              onChange={(e) => {
                const v = e.target.value
                setI0Text(v)
                setAc({ I0: parseOscExpr(v, false) })
              }}
              placeholder="2"
              aria-label="Cường độ dòng điện cực đại I0 (A)"
              className={cn(inputClass, 'h-9 flex-1 min-w-0')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">A</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Chu kì / Tần số</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {OSC_PERIOD_BY.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={ac.period.by === p.id}
              onClick={() => switchAcPeriodBy(p.id)}
              className={pill(ac.period.by === p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          value={acPText}
          onChange={(e) => {
            const v = e.target.value
            setAcPText(v)
            setAc({ period: { by: ac.period.by, value: parseOscExpr(v, ac.period.by === 'omega') } })
          }}
          placeholder={ac.period.by === 'omega' ? 'vd. 100π' : 'vd. 50'}
          aria-label="Giá trị chu kì hoặc tần số dòng điện"
          className={cn(inputClass, 'h-9')}
        />
      </section>

      <section>
        <h3 className={sectionTitle}>Pha ban đầu (đơn vị π rad)</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[12.5px] text-ink-2">φᵤ =</span>
            <input
              value={phiUText}
              onChange={(e) => {
                const v = e.target.value
                setPhiUText(v)
                setAc({ phiUPi: parseOscExpr(v, false) })
              }}
              placeholder="0"
              aria-label="Pha ban đầu của u theo đơn vị pi"
              className={cn(inputClass, 'h-9 flex-1 min-w-0')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">π</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[12.5px] text-ink-2">φᵢ =</span>
            <input
              value={phiIText}
              onChange={(e) => {
                const v = e.target.value
                setPhiIText(v)
                setAc({ phiIPi: parseOscExpr(v, false) })
              }}
              placeholder="-1/3"
              aria-label="Pha ban đầu của i theo đơn vị pi"
              className={cn(inputClass, 'h-9 flex-1 min-w-0')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">π</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Khoảng vẽ (từ 0 đến)</h3>
        <div className="flex items-center gap-2">
          <input
            value={acTEndText}
            onChange={(e) => {
              const v = e.target.value
              setAcTEndText(v)
              setAc({ tEnd: parseOscExpr(v, false) })
            }}
            inputMode="decimal"
            aria-label="Thời gian kết thúc (s)"
            className={cn(inputClass, 'h-9 flex-1')}
          />
          <span className="shrink-0 text-[13px] text-ink-2">s</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {OSC_TEND_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={!acT}
              onClick={() => applyAcTEndPreset(p.k)}
              className={pill(Boolean(acT && Math.abs(ac.tEnd - p.k * acT) < 1e-6))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Lưới ô nét đứt</h3>
        <div className="flex flex-wrap gap-1.5">
          {OSC_GRIDS.map((g) => (
            <button key={g.id} type="button" aria-pressed={ac.grid === g.id} onClick={() => setAc({ grid: g.id })} className={pill(ac.grid === g.id)}>
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Nhãn trên trục</h3>
        <div className="flex flex-wrap gap-1.5">
          {OSC_TICKS.map((t) => (
            <button key={t.id} type="button" aria-pressed={ac.ticks === t.id} onClick={() => setAc({ ticks: t.id })} className={pill(ac.ticks === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Check checked={ac.showPhaseDiff} onChange={(showPhaseDiff) => setAc({ showPhaseDiff })}>
          Hiện độ lệch pha giữa hai đỉnh gần nhau
        </Check>
        {ac.showPhaseDiff && (
          <div className="flex items-center gap-1.5 pl-6">
            <span className="text-[12px] text-ink-3">Nhãn:</span>
            {([
              ['dt', 'Δt'],
              ['phi', 'φ'],
            ] as const).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                aria-pressed={(ac.phaseDiffLabel ?? 'dt') === k}
                onClick={() => setAc({ phaseDiffLabel: k })}
                className={pill((ac.phaseDiffLabel ?? 'dt') === k)}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  )

  const standingInputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Loại đầu dây</h3>
        <Segmented<'fixed-fixed' | 'fixed-free'>
          value={st.ends}
          onChange={(ends) => setSt({ ends })}
          label="Loại đầu dây"
          className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { key: 'fixed-fixed', label: 'Hai đầu cố định' },
            { key: 'fixed-free', label: 'Một đầu tự do' },
          ]}
        />
      </section>

      <section>
        <h3 className={sectionTitle}>Thông số dây</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[12.5px] text-ink-2">ℓ =</span>
            <input
              value={stLenText}
              onChange={(e) => {
                const v = e.target.value
                setStLenText(v)
                setSt({ length: parseOscExpr(v, false) })
              }}
              inputMode="decimal"
              aria-label="Chiều dài dây (cm)"
              className={cn(inputClass, 'h-9 flex-1 min-w-0')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">cm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[12.5px] text-ink-2">A =</span>
            <input
              value={stAText}
              onChange={(e) => {
                const v = e.target.value
                setStAText(v)
                setSt({ A: parseOscExpr(v, false) })
              }}
              inputMode="decimal"
              aria-label="Biên độ bụng (cm)"
              className={cn(inputClass, 'h-9 flex-1 min-w-0')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">cm</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Số bó sóng (k)</h3>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
            <button key={k} type="button" aria-pressed={st.k === k} onClick={() => setSt({ k })} className={pill(st.k === k)}>
              {k}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <h3 className={sectionTitle}>Hiển thị</h3>
        <Check checked={st.showNodes} onChange={(showNodes) => setSt({ showNodes })}>
          Đánh dấu nút sóng (chấm tròn, nhãn N)
        </Check>
        <Check checked={st.showAntinodes} onChange={(showAntinodes) => setSt({ showAntinodes })}>
          Đánh dấu bụng sóng (nhãn B)
        </Check>
        <Check checked={st.showDim} onChange={(showDim) => setSt({ showDim })}>
          Hiện kích thước (λ/2 và ℓ)
        </Check>
      </section>
    </>
  )

  const inputs = (
    <>
      {modeSelector}
      {mode === 'ac' ? acInputs : mode === 'standing' ? standingInputs : (
        <>
          <section>
            <h3 className={sectionTitle}>Đại lượng</h3>
            <div className="flex flex-wrap gap-1.5">
              {OSC_QTYS.map((q) => (
                <button key={q.id} type="button" aria-pressed={spec.qty === q.id} onClick={() => switchQty(q.id)} className={pill(spec.qty === q.id)}>
                  {q.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Biên độ</h3>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[13px] text-ink-2">A =</span>
              <input
                value={aText}
                onChange={(e) => {
                  const v = e.target.value
                  setAText(v)
                  set({ A: parseOscExpr(v, false) })
                }}
                inputMode="decimal"
                aria-label="Biên độ A (cm)"
                className={cn(inputClass, 'h-9 flex-1')}
              />
              <span className="shrink-0 text-[13px] text-ink-2">cm</span>
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Chu kì / Tần số</h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {OSC_PERIOD_BY.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={spec.period.by === p.id}
                  onClick={() => switchPeriodBy(p.id)}
                  className={pill(spec.period.by === p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              value={pText}
              onChange={(e) => {
                const v = e.target.value
                setPText(v)
                set({ period: { by: spec.period.by, value: parseOscExpr(v, spec.period.by === 'omega') } })
              }}
              placeholder={spec.period.by === 'omega' ? 'vd. 2π, π hoặc 10' : 'vd. 2'}
              aria-label="Giá trị chu kì hoặc tần số"
              className={cn(inputClass, 'h-9')}
            />
          </section>

          <section>
            <h3 className={sectionTitle}>
              Trạng thái đầu (<span className="normal-case">t = 0</span>)
            </h3>
            <OscStartPicker value={spec.start} onChange={(start) => set({ start })} />
          </section>

          <section>
            <h3 className={sectionTitle}>Khoảng vẽ (từ 0 đến)</h3>
            <div className="flex items-center gap-2">
              <input
                value={tEndText}
                onChange={(e) => {
                  const v = e.target.value
                  setTEndText(v)
                  set({ tEnd: parseOscExpr(v, false) })
                }}
                inputMode="decimal"
                aria-label="Thời gian kết thúc (s)"
                className={cn(inputClass, 'h-9 flex-1')}
              />
              <span className="shrink-0 text-[13px] text-ink-2">s</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {OSC_TEND_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={!curT}
                  onClick={() => applyTEndPreset(p.k)}
                  className={pill(Boolean(curT && Math.abs(spec.tEnd - p.k * curT) < 1e-6))}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Lưới ô nét đứt</h3>
            <div className="flex flex-wrap gap-1.5">
              {OSC_GRIDS.map((g) => (
                <button key={g.id} type="button" aria-pressed={spec.grid === g.id} onClick={() => set({ grid: g.id })} className={pill(spec.grid === g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Nhãn trên trục</h3>
            <div className="flex flex-wrap gap-1.5">
              {OSC_TICKS.map((t) => (
                <button key={t.id} type="button" aria-pressed={spec.ticks === t.id} onClick={() => set({ ticks: t.id })} className={pill(spec.ticks === t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <label className="text-[12.5px] text-ink-2">
              Trục dọc
              <input className={cn(inputClass, 'mt-1 h-9')} value={spec.yName} onChange={(e) => set({ yName: e.target.value })} />
            </label>
            <label className="text-[12.5px] text-ink-2">
              Trục ngang
              <input className={cn(inputClass, 'mt-1 h-9')} value={spec.tName} onChange={(e) => set({ tName: e.target.value })} />
            </label>
          </section>

          <section>
            <Check
              checked={Boolean(spec.second)}
              onChange={(on) => {
                if (!on) {
                  set({ second: null })
                } else {
                  const qty: OscQty = spec.qty === 'x' ? 'v' : 'x'
                  setSAText('')
                  set({ second: { qty, dashed: true } })
                }
              }}
            >
              Vẽ đường thứ hai để so pha
            </Check>
            {spec.second && (
              <div className="mt-2 space-y-2.5 rounded-[8px] border border-line bg-paper-2 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {OSC_QTYS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      aria-pressed={spec.second?.qty === q.id}
                      onClick={() => spec.second && set({ second: { ...spec.second, qty: q.id } })}
                      className={pill(spec.second?.qty === q.id)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[12.5px] text-ink-2">A₂ =</span>
                  <input
                    value={sAText}
                    onChange={(e) => {
                      const v = e.target.value
                      setSAText(v)
                      if (!spec.second) return
                      set({ second: { ...spec.second, A: v.trim() ? parseOscExpr(v, false) : undefined } })
                    }}
                    placeholder="Bằng A"
                    aria-label="Biên độ đường thứ hai"
                    className={cn(inputClass, 'h-9 flex-1')}
                  />
                  <span className="shrink-0 text-[12.5px] text-ink-2">cm</span>
                </div>
                <Check
                  checked={!spec.second.start}
                  onChange={(same) => spec.second && set({ second: { ...spec.second, start: same ? undefined : { ...spec.start } } })}
                >
                  Cùng trạng thái đầu
                </Check>
                {spec.second.start && (
                  <OscStartPicker
                    value={spec.second.start}
                    onChange={(start) => spec.second && set({ second: { ...spec.second, start } })}
                  />
                )}
                <Check
                  checked={spec.second.dashed}
                  onChange={(dashed) => spec.second && set({ second: { ...spec.second, dashed } })}
                >
                  Đường thứ hai nét đứt
                </Check>
              </div>
            )}
          </section>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-[6px] bg-clay-tint px-2.5 py-1.5 text-[12px] leading-snug text-clay-deep">
          {error}
        </p>
      )}

      {eqText && (
        <div className="rounded-[6px] border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">
          <div>
            Phương trình: <span className="font-serif text-[13.5px] font-medium text-ink">{eqText}</span>
          </div>
          {eq2Text && (
            <div className="mt-0.5">
              Đường 2: <span className="font-serif text-[13.5px] font-medium text-ink">{eq2Text}</span>
            </div>
          )}
        </div>
      )}

      {acEq && (
        <div className="rounded-[6px] border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">
          <div>
            <span className="font-serif text-[13.5px] font-medium text-ink">{acEq.u}</span>
          </div>
          <div className="mt-0.5">
            <span className="font-serif text-[13.5px] font-medium text-ink">{acEq.i}</span>
          </div>
        </div>
      )}

      {stSummary && (
        <div className="rounded-[6px] border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">
          <span className="font-medium text-ink">{stSummary}</span>
        </div>
      )}
    </>
  )

  return (
    <ToolShell
      title={mode === 'ac' ? 'Đồ thị điện xoay chiều u – i' : mode === 'standing' ? 'Hình sóng dừng trên dây' : 'Đồ thị dao động điều hoà'}
      hint={
        mode === 'ac'
          ? 'Nhập U₀, I₀, tần số và pha ban đầu; tự vẽ hai trục tung u (V), i (A) và độ lệch pha'
          : mode === 'standing'
            ? 'Nhập chiều dài dây ℓ, số bó sóng k và loại đầu dây; tự tính bước sóng λ, nút N, bụng B'
            : 'Nhập biên độ, chu kì và trạng thái đầu; tự tính phương trình và vẽ lưới ô kiểu đề thi'
      }
      inputs={inputs}
      inputsWidth={390}
      preview={preview}
      renderPreview={(img) => (
        <div className="flex max-h-full max-w-full flex-col items-center gap-2.5">
          <img
            src={svgDataUrl(img.svg)}
            alt="Xem trước"
            className="min-h-0 max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain"
          />
          {eqText && (
            <div className="shrink-0 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-center text-[12.5px] text-ink-2">
              <div>
                Phương trình: <span className="font-serif text-[13.5px] font-medium text-ink">{eqText}</span>
              </div>
              {eq2Text && (
                <div className="mt-0.5">
                  Đường 2: <span className="font-serif text-[13.5px] font-medium text-ink">{eq2Text}</span>
                </div>
              )}
            </div>
          )}
          {acEq && (
            <div className="shrink-0 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-center text-[12.5px] text-ink-2">
              <div>
                <span className="font-serif text-[13.5px] font-medium text-ink">{acEq.u}</span>
              </div>
              <div className="mt-0.5">
                <span className="font-serif text-[13.5px] font-medium text-ink">{acEq.i}</span>
              </div>
            </div>
          )}
          {stSummary && (
            <div className="shrink-0 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-center text-[12.5px] font-medium text-ink">
              {stSummary}
            </div>
          )}
        </div>
      )}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí: Thấu kính mỏng (hội tụ / phân kì)
 * ------------------------------------------------------------------ */
