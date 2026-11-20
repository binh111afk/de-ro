/**
 * "Hỏi AI" trên đoạn chữ đang bôi đen trong trình soạn đề: model chỉ trả lại
 * đoạn chữ mới, người dùng xem trước rồi mới thay vào.
 */
import { callLlm, extractJson } from './llm'
import { GEO2D_SHAPES, GEO3D_SHAPES } from './geometry'
import { PLOT_COLORS, autoYRange, parseExpr, type PlotSpec } from './plot'
import { renderTool, type ToolDoc } from './toolSpec'
import { autoSignTable } from './signTable'
import { autoVarTable } from './varTable'
import { cleanRewrite } from './slideRewrite'
import { AC_DEFAULT, OSC_DEFAULT, OSC_Y_DEFAULT, STANDING_DEFAULT, oscPeriod, parseOscExpr, type OscQty, type OscSpec, type OscStart, type OscStartX0 } from './oscillation'
import { LENS_DEFAULT, type LensNames, type LensRay, type LensType } from './lens'
import { FIELD_DEFAULT, type FieldScene } from './field'
import { normalizeObjects, prepareToolDoc } from './objects'
import { dynamicId } from './figureSprites'
import { OBJECTS } from './objectsCatalog'
import type { GeneTrait } from './punnett'

export const DOC_REWRITE_PRESETS = [
  { label: 'Viết lại rõ hơn', ask: 'Viết lại rõ ràng, chặt chẽ hơn, giữ nguyên ý' },
  { label: 'Ngắn gọn hơn', ask: 'Viết ngắn gọn hơn, giữ ý chính' },
  { label: 'Sửa chính tả', ask: 'Chỉ sửa lỗi chính tả, ngữ pháp, dấu câu; không đổi nội dung' },
  { label: 'Dễ hiểu hơn', ask: 'Viết lại dễ hiểu hơn cho học sinh' },
] as const

export async function rewriteSelection(text: string, instruction: string, context: string, signal?: AbortSignal): Promise<string> {
  const res = await callLlm(
    [
      {
        role: 'user',
        content: `${context ? `Ngữ cảnh: ${context}\n` : ''}Đoạn chữ đang chọn:\n${text}\n\nYêu cầu: ${instruction}`,
      },
    ],
    { signal, reasoningEffort: 'low', task: { name: 'sua-cau' } },
  )
  const out = cleanRewrite(res.content).replace(/\*\*(.+?)\*\*/g, '$1')
  if (!out) throw new Error('AI không trả về nội dung, thử lại nhé.')
  return out
}

/* ------------------------------------------------------------------ *
 * "Vẽ đồ thị": AI chỉ đọc đề và trả cấu hình, app tự vẽ bằng lib/plot.ts
 * ------------------------------------------------------------------ */

export interface PlotPlan {
  spec: PlotSpec
  note: string
}

export async function planPlot(text: string, context: string, signal?: AbortSignal): Promise<PlotPlan> {
  const res = await callLlm(
    [{ role: 'user', content: `${context ? `Ngữ cảnh: ${context}\n` : ''}Đề bài:\n${text}` }],
    { signal, reasoningEffort: 'low', task: { name: 've-do-thi' } },
  )
  let raw: Record<string, unknown>
  try {
    raw = extractJson(res.content)
  } catch {
    throw new Error('AI trả về cấu hình đồ thị không đọc được, thử lại nhé.')
  }
  const p = planFromRaw(raw)
  return { spec: (p.doc as { spec: PlotSpec }).spec, note: p.note }
}

function planFromRaw(raw: Record<string, unknown>): ToolPlan {
  const note = typeof raw.note === 'string' ? raw.note.trim() : ''
  const exprs = (Array.isArray(raw.curves) ? raw.curves : [])
    .map((c) => (typeof c === 'string' ? c : typeof c === 'object' && c && 'expr' in c ? String((c as { expr: unknown }).expr) : ''))
    .filter((e) => {
      try {
        parseExpr(e)
        return true
      } catch {
        return false
      }
    })
    .slice(0, 4)
  if (exprs.length === 0) throw new Error(note || 'Không thấy hàm số nào để vẽ trong đoạn đã chọn.')
  let xMin = Number(raw.xMin)
  let xMax = Number(raw.xMax)
  if (!(Number.isFinite(xMin) && Number.isFinite(xMax) && xMin < xMax && xMax - xMin <= 200)) [xMin, xMax] = [-5, 5]
  const fns = exprs.map((e) => parseExpr(e))
  let [yMin, yMax] = autoYRange(fns, xMin, xMax)
  // khung dọc ghi sẵn (vd câu trong kho) thì theo đó, để không bị nhánh dốc kéo dãn
  const [y0, y1] = [Number(raw.yMin), Number(raw.yMax)]
  if (raw.yMin != null && raw.yMax != null && Number.isFinite(y0) && Number.isFinite(y1) && y0 < y1) [yMin, yMax] = [y0, y1]
  return {
    note,
    doc: {
      kind: 'graph',
      spec: {
        curves: exprs.map((expr, i) => ({ expr, color: PLOT_COLORS[i % PLOT_COLORS.length] })),
        xMin,
        xMax,
        yMin,
        yMax,
        grid: raw.grid === true,
        labels: raw.labels === true || exprs.length > 1,
        points: typeof raw.points === 'string' && raw.points.trim() ? raw.points : undefined,
      },
    },
  }
}

/* ------------------------------------------------------------------ *
 * "Vẽ hình minh hoạ": AI chọn công cụ hợp đề (đồ thị, bảng xét dấu, hệ trục Oxy,
 * biểu đồ thống kê, mạch điện) và trả cấu hình dạng chữ; app tự vẽ.
 * ------------------------------------------------------------------ */

export { FIGURE_GUIDE, figureGuideFor } from './prompts/figureGuide.js'

export interface ToolPlan {
  doc: ToolDoc
  note: string
}

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d)

export async function planTool(text: string, context: string, signal?: AbortSignal): Promise<ToolPlan> {
  const res = await callLlm(
    [{ role: 'user', content: `${context ? `Ngữ cảnh: ${context}\n` : ''}Đề bài:\n${text}` }],
    { signal, reasoningEffort: 'low', task: { name: 'chon-hinh' } },
  )
  let raw: Record<string, unknown>
  try {
    raw = extractJson(res.content)
  } catch {
    throw new Error('AI trả về cấu hình hình vẽ không đọc được, thử lại nhé.')
  }
  const doc = toolFromRaw(raw)
  await prepareToolDoc(doc)
  return { doc, note: typeof raw.note === 'string' ? raw.note.trim() : '' }
}

/** cấu hình chữ AI trả về → ToolDoc đã vẽ thử được; sai thì ném lỗi (kèm note nếu có) */
export function toolFromRaw(raw: Record<string, unknown>): ToolDoc {
  const note = typeof raw.note === 'string' ? raw.note.trim() : ''
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : '')
  const need = (k: string, msg: string) => {
    if (!str(k).trim()) throw new Error(note || msg)
    return str(k)
  }
  const bool = (k: string, d: boolean) => (typeof raw[k] === 'boolean' ? (raw[k] as boolean) : d)
  const names = (d: string[]) => (Array.isArray(raw.names) && raw.names.length ? raw.names.map(String) : d)
  const pick = <T extends string>(k: string, all: readonly T[], d: T): T => all.find((c) => c === raw[k]) ?? d
  const dir = (k: string) => pick(k, ['none', 'up', 'down'] as const, 'none')
  let doc: ToolDoc
  switch (raw.kind) {
    case 'graph':
      doc = planFromRaw(raw).doc
      break
    case 'vartable':
      doc = { kind: 'vartable', spec: { ...autoVarTable(need('expr', 'Không thấy hàm số để lập bảng biến thiên.')), fname: str('fname') || 'y' } }
      break
    case 'signtable':
      doc = { kind: 'signtable', spec: autoSignTable(need('expr', 'Không thấy biểu thức để xét dấu.')) }
      break
    case 'oxy': {
      const xMin = num(raw.xMin, -5)
      const xMax = num(raw.xMax, 5)
      const yMin = num(raw.yMin, -5)
      const yMax = num(raw.yMax, 5)
      const items = need('items', 'AI không đưa ra được hình trên hệ trục.')
      doc = { kind: 'oxy', spec: { xMin, xMax: xMax > xMin ? xMax : xMin + 10, yMin, yMax: yMax > yMin ? yMax : yMin + 10, grid: false, numbers: true, items } }
      break
    }
    case 'geo2d': {
      const { id: shape, names: templateNames } = GEO2D_SHAPES.find((s) => s.id === raw.shape) ?? GEO2D_SHAPES.find((s) => s.id === 'triangle')!
      const circumcircle = bool('circumcircle', false)
      const defaults = circumcircle && templateNames.length === 3 ? [...templateNames, 'O'] : templateNames
      const given = shape !== 'free' && Array.isArray(raw.names)
        ? raw.names.map((n) => typeof n === 'string' ? n.trim() : '')
        : []
      const used = new Set(given.filter(Boolean))
      const filled = defaults.map((d, i) => {
        if (given[i]) return given[i]
        let name = used.has(d) ? defaults.find((n) => !used.has(n)) ?? d : d
        while (used.has(name)) name += "'"
        used.add(name)
        return name
      })
      doc = {
        kind: 'geo2d',
        spec: {
          shape,
          names: filled.concat(given.slice(defaults.length)),
          altitude: bool('altitude', false),
          median: bool('median', false),
          diagonals: bool('diagonals', false),
          circumcircle,
          marks: bool('marks', true),
          extras: shape === 'free' ? need('extras', 'Không thấy lệnh dựng hình theo toạ độ.') : str('extras') || undefined,
        },
      }
      break
    }
    case 'geo3d': {
      const shape3 = pick('shape', ['pyramid3', 'pyramid3-sa', 'pyramid3-regular', 'pyramid4', 'pyramid4-sa', 'pyramid4-regular', 'tetrahedron', 'prism3', 'box', 'cube', 'cone', 'cylinder', 'sphere'] as const, 'pyramid4')
      // AI hay chỉ gửi tên đáy (A,B,C,D) hoặc bỏ trống: bù tên mặc định của khối cho đủ đỉnh (A', B'…)
      const def3 = GEO3D_SHAPES.find((s) => s.id === shape3)?.names ?? []
      const given3 = names([])
      doc = {
        kind: 'geo3d',
        spec: {
          shape: shape3,
          names: def3.map((d, i) => given3[i] || d).concat(given3.slice(def3.length)),
          height: bool('height', true),
          diagonals: bool('diagonals', false),
          marks: bool('marks', true),
          tall: Math.min(1.6, Math.max(0.6, num(raw.tall, 1))),
          extras: str('extras') || undefined,
          circumsphere: bool('circumsphere', false) || undefined,
        },
      }
      break
    }
    case 'stats':
      doc = {
        kind: 'stats',
        spec: { chart: pick('chart', ['bar', 'line', 'pie', 'hist', 'table'] as const, 'bar'), title: str('title'), xLabel: str('xLabel'), yLabel: str('yLabel'), values: true, data: need('data', 'Không thấy số liệu để vẽ biểu đồ.') },
      }
      break
    case 'trig':
      doc = { kind: 'trig', spec: { angles: need('angles', 'Không thấy góc để biểu diễn.'), projections: bool('projections', true), tan: bool('tan', false), values: bool('values', false), cot: bool('cot', false) } }
      break
    case 'probtree':
      doc = { kind: 'probtree', spec: { text: need('text', 'Không thấy sơ đồ cây.'), products: bool('products', false) } }
      break
    case 'numberline':
      doc = { kind: 'numberline', spec: { sets: need('sets', 'Không thấy tập hợp để biểu diễn.'), style: pick('style', ['hatch', 'bold'] as const, 'hatch') } }
      break
    case 'venn':
      doc = { kind: 'venn', spec: { sets: str('sets') || 'A, B', shade: str('shade'), counts: str('counts'), universe: bool('universe', true) } }
      break
    case 'grouped':
      doc = {
        kind: 'grouped',
        spec: {
          groups: need('groups', 'Không có nhóm nào để lập bảng ghép nhóm.'),
          label: str('label'),
          freqLabel: str('freqLabel'),
          view: pick('view', ['htable', 'vtable', 'hist'] as const, 'htable'),
          polygon: bool('polygon', false),
          extras: str('extras'),
        },
      }
      break
    case 'circuit':
      doc = { kind: 'circuit', spec: { text: need('text', 'Không đọc được mạch điện trong đề.'), values: true } }
      break
    case 'motion':
      doc = { kind: 'motion', spec: { yName: str('yName') || 'v (m/s)', tName: str('tName') || 't (s)', points: need('points', 'Không thấy số liệu chuyển động.'), dashed: bool('dashed', true) } }
      break
    case 'scene':
      doc = { kind: 'scene', spec: { text: need('text', 'Không thấy lệnh vẽ hình.') } }
      break
    case 'gas':
      doc = {
        kind: 'gas',
        spec: {
          axes: pick('axes', ['pV', 'pT', 'VT'] as const, 'pV'),
          states: need('states', 'Không thấy các trạng thái khí.'),
          processes: str('processes'),
          pUnit: str('pUnit'),
          vUnit: str('vUnit'),
          tUnit: str('tUnit') || 'K',
          ticks: pick('ticks', ['value', 'symbol', 'none'] as const, 'value'),
          dashed: bool('dashed', true),
          arrows: bool('arrows', true),
          toOrigin: bool('toOrigin', true),
          showStates: bool('showStates', true),
        },
      }
      break
    case 'incline':
      doc = { kind: 'incline', spec: { angle: num(raw.angle, 30), P: bool('P', true), N: bool('N', true), fms: dir('fms'), F: dir('F'), showAngle: true } }
      break
    case 'electron':
      doc = { kind: 'electron', spec: { element: need('element', 'Không thấy nguyên tố.'), valenceOnly: bool('valenceOnly', false) } }
      break
    case 'struct':
      doc = {
        kind: 'struct',
        spec: {
          formula: need('formula', 'Không thấy công thức cấu tạo.'),
          style: pick('style', ['condensed', 'skeletal'] as const, 'condensed'),
          ...(raw.number !== undefined ? { number: bool('number', false) } : {}),
          ...(raw.ringStyle !== undefined ? { ringStyle: pick('ringStyle', ['kekule', 'circle'] as const, 'kekule') } : {}),
          ...(raw.drawRings !== undefined ? { drawRings: bool('drawRings', true) } : {}),
        },
      }
      break
    case 'chemgraph':
      doc = { kind: 'chemgraph', spec: { xName: str('xName') || 'n', yName: str('yName') || 'n↓', points: need('points', 'Không thấy số liệu đồ thị.'), dashed: bool('dashed', true) } }
      break
    case 'table':
      doc = {
        kind: 'table',
        spec: {
          cells: need('cells', 'Chưa có nội dung các ô của bảng.'),
          header: pick('header', ['row', 'col', 'both', 'none'] as const, 'row'),
          align: pick('align', ['left', 'center', 'right'] as const, 'center'),
          merges: str('merges'),
          border: pick('border', ['all', 'outer', 'horizontal'] as const, 'all'),
          fontSize: Math.min(20, Math.max(12, Math.round(num(raw.fontSize, 15)))),
        },
      }
      break
    case 'chemeq':
      doc = {
        kind: 'chemeq',
        spec: {
          equations: need('equations', 'Không thấy phương trình hoá học.'),
          autoBalance: bool('autoBalance', false),
          fontSize: Math.min(22, Math.max(14, num(raw.fontSize, 17))),
          align: pick('align', ['left', 'center'] as const, 'center'),
        },
      }
      break
    case 'phase':
      doc = {
        kind: 'phase',
        spec: {
          yName: str('yName') || 't (°C)',
          tName: str('tName') || 'T (phút)',
          points: need('points', 'Không thấy số liệu đồ thị chuyển thể.'),
          extend: bool('extend', true),
          dashed: bool('dashed', true),
          dots: bool('dots', true),
        },
      }
      break
    case 'osc': {
      const parseVal = (v: unknown, allowPi: boolean, d: number) => {
        if (typeof v === 'number' && Number.isFinite(v)) return v
        if (typeof v === 'string') {
          const parsed = parseOscExpr(v, allowPi)
          if (Number.isFinite(parsed)) return parsed
        }
        return d
      }
      const parsePeriodFrom = (src: Record<string, unknown>, def: OscSpec['period']): OscSpec['period'] => {
        const pRaw = src.period && typeof src.period === 'object' ? (src.period as Record<string, unknown>) : null
        const { T, omega } = oscPeriod({ period: def })
        const defaults = { T, f: 1 / T, omega }
        if (pRaw) {
          const by = (['T', 'f', 'omega'] as const).find((k) => k === pRaw.by) ?? def.by
          return { by, value: parseVal(pRaw.value, by === 'omega', defaults[by]) }
        }
        if (src.omega !== undefined) return { by: 'omega', value: parseVal(src.omega, true, defaults.omega) }
        if (src.f !== undefined) return { by: 'f', value: parseVal(src.f, false, defaults.f) }
        if (src.T !== undefined) return { by: 'T', value: parseVal(src.T, false, defaults.T) }
        return def
      }
      if (raw.mode === 'ac') {
        const s = (raw.ac && typeof raw.ac === 'object' ? raw.ac : raw) as Record<string, unknown>
        const period = parsePeriodFrom(s, AC_DEFAULT.period)
        const { T } = oscPeriod({ period })
        const grid = (['none', 'T/4', 'T/8'] as const).find((k) => k === s.grid) ?? AC_DEFAULT.grid
        const ticks = (['value', 'symbol'] as const).find((k) => k === s.ticks) ?? AC_DEFAULT.ticks
        const phaseDiffLabel = s.phaseDiffLabel === 'phi' ? 'phi' : 'dt'
        doc = {
          kind: 'osc',
          spec: {
            ...OSC_DEFAULT,
            mode: 'ac',
            ac: {
              U0: parseVal(s.U0, false, AC_DEFAULT.U0),
              I0: parseVal(s.I0, false, AC_DEFAULT.I0),
              period,
              phiUPi: parseVal(s.phiUPi, false, AC_DEFAULT.phiUPi),
              phiIPi: parseVal(s.phiIPi, false, AC_DEFAULT.phiIPi),
              tEnd: parseVal(s.tEnd, false, Math.round(1.5 * T * 1e6) / 1e6),
              grid,
              ticks,
              showPhaseDiff: typeof s.showPhaseDiff === 'boolean' ? s.showPhaseDiff : AC_DEFAULT.showPhaseDiff,
              phaseDiffLabel,
            },
          },
        }
        break
      }
      if (raw.mode === 'standing') {
        const s = (raw.standing && typeof raw.standing === 'object' ? raw.standing : raw) as Record<string, unknown>
        const kRaw = Math.round(parseVal(s.k, false, STANDING_DEFAULT.k))
        const k = Math.max(1, Math.min(10, kRaw))
        const ends = s.ends === 'fixed-free' ? 'fixed-free' : 'fixed-fixed'
        doc = {
          kind: 'osc',
          spec: {
            ...OSC_DEFAULT,
            mode: 'standing',
            standing: {
              length: parseVal(s.length, false, STANDING_DEFAULT.length),
              k,
              ends,
              A: parseVal(s.A, false, STANDING_DEFAULT.A),
              showNodes: typeof s.showNodes === 'boolean' ? s.showNodes : STANDING_DEFAULT.showNodes,
              showAntinodes: typeof s.showAntinodes === 'boolean' ? s.showAntinodes : STANDING_DEFAULT.showAntinodes,
              showDim: typeof s.showDim === 'boolean' ? s.showDim : STANDING_DEFAULT.showDim,
            },
          },
        }
        break
      }
      const X0S = ['A', '-A', '0', 'A/2', '-A/2', 'A√2/2', '-A√2/2', 'A√3/2', '-A√3/2'] as const
      const QTYS = ['x', 'v', 'a'] as const
      const parseStart = (s: unknown, d: OscStart): OscStart => {
        if (!s || typeof s !== 'object') return d
        const obj = s as Record<string, unknown>
        if (obj.by === 'phi' || 'phiPi' in obj) {
          return { by: 'phi', phiPi: parseVal(obj.phiPi, false, 0) }
        }
        const rawX0 = typeof obj.x0 === 'string' ? obj.x0.replace(/\s+/g, '').replace(/sqrt\(?2\)?/gi, '√2').replace(/sqrt\(?3\)?/gi, '√3') : ''
        const x0: OscStartX0 = X0S.find((k) => k === rawX0) ?? '0'
        const dir = obj.dir === 'up' || obj.dir === 'down' ? obj.dir : 'down'
        return { by: 'state', x0, dir }
      }
      const qty: OscQty = pick('qty', QTYS, 'x')
      const A = parseVal(raw.A, false, 8)
      const period = parsePeriodFrom(raw, OSC_DEFAULT.period)
      const start = parseStart(
        raw.start ?? (raw.phiPi !== undefined ? { by: 'phi', phiPi: raw.phiPi } : null),
        { by: 'state', x0: '0', dir: 'down' },
      )
      const { T } = oscPeriod({ period })
      const tEnd = parseVal(raw.tEnd, false, Math.round(2 * T * 1000) / 1000)
      const secRaw = raw.second && typeof raw.second === 'object' ? (raw.second as Record<string, unknown>) : null
      const second: OscSpec['second'] = secRaw
        ? {
            qty: QTYS.find((k) => k === secRaw.qty) ?? 'v',
            ...(secRaw.A !== undefined ? { A: parseVal(secRaw.A, false, A) } : {}),
            ...(secRaw.start && typeof secRaw.start === 'object' ? { start: parseStart(secRaw.start, start) } : {}),
            dashed: typeof secRaw.dashed === 'boolean' ? secRaw.dashed : true,
          }
        : null
      doc = {
        kind: 'osc',
        spec: {
          qty,
          A,
          period,
          start,
          tEnd,
          yName: str('yName') || OSC_Y_DEFAULT[qty],
          tName: str('tName') || 't (s)',
          grid: pick('grid', ['none', 'T/4', 'T/8'] as const, 'T/8'),
          ticks: pick('ticks', ['value', 'symbol'] as const, 'value'),
          second,
        },
      }
      break
    }
    case 'lens': {
      const RAYS = ['parallel', 'center', 'focal'] as const
      const rawF = num(raw.f, LENS_DEFAULT.f)
      const lensType: LensType =
        raw.type === 'diverging' || (raw.type === undefined && rawF < 0) ? 'diverging' : 'converging'
      const f = Math.abs(rawF) > 0 ? Math.abs(rawF) : LENS_DEFAULT.f
      const d = num(raw.d, LENS_DEFAULT.d)
      const h = num(raw.h, LENS_DEFAULT.h ?? 2)
      let rays = LENS_DEFAULT.rays
      if (Array.isArray(raw.rays)) {
        const validRays = raw.rays.filter((r): r is LensRay => RAYS.includes(r as LensRay))
        if (validRays.length || !raw.rays.length) rays = validRays
      }
      const rawNames = raw.names && typeof raw.names === 'object' ? (raw.names as Record<string, unknown>) : null
      const lensNames: LensNames | undefined = rawNames
        ? {
            A: typeof rawNames.A === 'string' ? rawNames.A : undefined,
            B: typeof rawNames.B === 'string' ? rawNames.B : undefined,
            APrime: typeof rawNames.APrime === 'string' ? rawNames.APrime : undefined,
            BPrime: typeof rawNames.BPrime === 'string' ? rawNames.BPrime : undefined,
            O: typeof rawNames.O === 'string' ? rawNames.O : undefined,
            F: typeof rawNames.F === 'string' ? rawNames.F : undefined,
            FPrime: typeof rawNames.FPrime === 'string' ? rawNames.FPrime : undefined,
          }
        : undefined
      doc = {
        kind: 'lens',
        spec: {
          type: lensType,
          f,
          d,
          h,
          rays,
          show2F: bool('show2F', false),
          showValues: bool('showValues', false),
          hideImage: bool('hideImage', false),
          objectSide: raw.objectSide === 'right' ? 'right' : 'left',
          ...(lensNames ? { names: lensNames } : {}),
        },
      }
      break
    }

    case 'pedigree':
      doc = {
        kind: 'pedigree',
        spec: {
          text: need('text', 'Không thấy các dòng khai báo phả hệ.'),
          legend: bool('legend', true),
          carrierStyle: pick('carrierStyle', ['half', 'dot'] as const, 'half'),
        },
      }
      break

    case 'punnett': {
      const traits: GeneTrait[] = []
      for (const entry of Array.isArray(raw.traits) ? raw.traits : []) {
        const { gene, dominance, phenotypes } = (entry ?? {}) as Record<string, unknown>
        if (typeof gene !== 'string' || !/^[a-z]$/i.test(gene.trim())) continue
        const trait: GeneTrait = { gene: gene.trim().toUpperCase() }
        if (dominance === 'complete' || dominance === 'incomplete' || dominance === 'codominant') trait.dominance = dominance
        if (Array.isArray(phenotypes) && phenotypes.every((n) => typeof n === 'string' && n.trim())) {
          const [first, second, third] = phenotypes.map((n: string) => n.trim())
          if (phenotypes.length === 2) trait.phenotypes = [first, second]
          if (phenotypes.length === 3) trait.phenotypes = [first, second, third]
        }
        if (trait.dominance || trait.phenotypes) traits.push(trait)
      }
      doc = {
        kind: 'punnett',
        spec: {
          cross: need('cross', 'Chưa có phép lai P.'),
          ...(traits.length ? { traits } : {}),
          showGametes: bool('showGametes', true),
          showGrid: bool('showGrid', true),
          showGenotypeRatio: bool('showGenotypeRatio', true),
          showPhenotypeRatio: bool('showPhenotypeRatio', true),
          blankGrid: bool('blankGrid', false),
          colorByPhenotype: bool('colorByPhenotype', true),
          fontSize: Math.min(18, Math.max(12, Math.round(num(raw.fontSize, 14)))),
        },
      }
      break
    }

    case 'foodweb':
      doc = {
        kind: 'foodweb',
        spec: {
          text: need('text', 'Không thấy chuỗi hoặc lưới thức ăn.'),
          direction: pick('direction', ['bottom-up', 'left-right'] as const, 'bottom-up'),
          nodeStyle: pick('nodeStyle', ['box', 'text'] as const, 'box'),
          showLevels: bool('showLevels', false),
          connectDecomposers: bool('connectDecomposers', true),
        },
      }
      break

    case 'field': {
      const sc = raw.scene && typeof raw.scene === 'object' ? (raw.scene as Record<string, unknown>) : raw
      const st = typeof sc.type === 'string' ? sc.type : 'two-charges'
      let scene: FieldScene
      switch (st) {
        case 'charge':
          scene = { type: 'charge', sign: sc.sign === '-' ? '-' : '+' }
          break
        case 'two-charges': {
          const arr = Array.isArray(sc.signs) ? sc.signs : []
          const s1 = arr[0] === '-' ? '-' : '+'
          const s2 = arr[1] === '+' ? '+' : '-'
          const ratio = typeof sc.ratio === 'number' && Number.isFinite(sc.ratio) && sc.ratio > 0 ? sc.ratio : 1
          scene = { type: 'two-charges', signs: [s1, s2], ratio }
          break
        }
        case 'plates':
          scene = { type: 'plates' }
          break
        case 'wire':
          scene = { type: 'wire', current: sc.current === 'in' ? 'in' : 'out' }
          break
        case 'wire-side':
          scene = { type: 'wire-side', current: sc.current === 'down' ? 'down' : 'up' }
          break
        case 'loop':
          scene = { type: 'loop', current: sc.current === 'cw' ? 'cw' : 'ccw' }
          break
        case 'solenoid':
          scene = { type: 'solenoid', current: sc.current === 'left' ? 'left' : 'right' }
          break
        case 'magnet':
          scene = { type: 'magnet', orient: sc.orient === 'v' ? 'v' : 'h' }
          break
        default:
          scene = FIELD_DEFAULT.scene
      }
      const rawProbe = raw.probe && typeof raw.probe === 'object' ? (raw.probe as Record<string, unknown>) : null
      const probe =
        rawProbe && typeof rawProbe.x === 'number' && typeof rawProbe.y === 'number'
          ? { x: rawProbe.x, y: rawProbe.y, vector: (rawProbe.vector === 'B' ? 'B' : 'E') as 'E' | 'B' }
          : undefined
      doc = {
        kind: 'field',
        spec: {
          scene,
          lines: Math.max(4, Math.min(16, Math.round(num(raw.lines, FIELD_DEFAULT.lines)))),
          showArrows: bool('showArrows', FIELD_DEFAULT.showArrows),
          labels: bool('labels', FIELD_DEFAULT.labels),
          ...(probe ? { probe } : {}),
        },
      }
      break
    }

    case 'objects': {
      const groups = (Array.isArray(raw.groups) ? raw.groups : [])
        .filter((g): g is Record<string, unknown> => Boolean(g) && typeof g === 'object')
        .map((g) => {
          // đồ vật ngoài kho có sẵn: AI ghi tên tiếng Việt + "en" → kho dùng chung (vẽ một lần, lưu lại)
          const item = typeof g.item === 'string' ? g.item.trim() : ''
          const dyn = item && !OBJECTS[item] && typeof g.en === 'string' ? dynamicId(g.en) : null
          return { g, item: dyn ?? (item || undefined), itemName: dyn ? item : undefined }
        })
        .map(({ g, item, itemName }) => ({
          item,
          itemName,
          container: typeof g.container === 'string' ? g.container : undefined,
          each: num(g.each, 0),
          count: num(g.count, 1),
          label: typeof g.label === 'string' || typeof g.label === 'number' ? String(g.label) : undefined,
        }))
      const spec = normalizeObjects({ groups })
      if (!spec.groups.length) throw new Error(note || 'Không có đồ vật nào trong kho hình để vẽ.')
      doc = { kind: 'objects', spec }
      break
    }

    case 'clock':
      doc = { kind: 'clock', spec: { hour: Math.round(num(raw.hour, 8)), minute: Math.round(num(raw.minute, 0)), numbers: bool('numbers', true) } }
      break

    default:
      throw new Error(note || 'Không thấy gì để vẽ minh hoạ trong đoạn đã chọn.')
  }
  renderTool(doc) // vẽ thử: cấu hình sai thì báo ngay
  return doc
}


/** câu yêu cầu tự gõ có phải là "vẽ đồ thị" không */
export const wantsPlot = (ask: string) =>
  /(vẽ|ve|minh hoạ|minh họa).*(đồ thị|hình|bảng xét dấu|biểu đồ|mạch|hệ trục|miền nghiệm|bảng lai|punnett)|(đồ thị|bảng xét dấu|biểu đồ|mạch điện|bảng lai|punnett).*(vẽ|minh hoạ|minh họa)/i.test(ask)
