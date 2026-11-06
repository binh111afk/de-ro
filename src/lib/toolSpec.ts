/**
 * Ảnh do tab "Công cụ" vẽ đều mang theo cấu hình ({kind, spec}) trong thẻ
 * <desc> của SVG (slide) hoặc attr `plot` của ảnh (soạn đề) — nhấp đúp là mở
 * lại đúng công cụ với cấu hình cũ. Ảnh đồ thị đời đầu chỉ có PlotSpec trần.
 */
import { readPlotSpec, renderPlotSvg, type PlotSpec } from './plot'
import { renderVarTableSvg, type VarTableSpec } from './varTable'
import { renderGeo2dSvg, renderGeo3dSvg, type Geo2dSpec, type Geo3dSpec } from './geometry'
import { renderSignTableSvg, type SignTableSpec } from './signTable'
import { renderOxySvg, type OxySpec } from './oxy'
import { renderStatsSvg, type StatsSpec } from './stats'
import { renderCircuitSvg, type CircuitSpec } from './circuit'
import { renderInclineSvg, renderMotionSvg, type InclineSpec, type MotionSpec } from './physics'
import { renderNumberLineSvg, renderTreeSvg, renderTrigSvg, renderVennSvg, type NumberLineSpec, type TreeSpec, type TrigSpec, type VennSpec } from './mathExtra'
import { renderGasSvg, type GasSpec } from './gas'
import { renderChemGraphSvg, renderElectronSvg, renderStructSvg, type ChemGraphSpec, type ElectronSpec, type StructSpec } from './chem'

export type ToolDoc =
  | { kind: 'graph'; spec: PlotSpec }
  | { kind: 'vartable'; spec: VarTableSpec }
  | { kind: 'geo2d'; spec: Geo2dSpec }
  | { kind: 'geo3d'; spec: Geo3dSpec }
  | { kind: 'signtable'; spec: SignTableSpec }
  | { kind: 'oxy'; spec: OxySpec }
  | { kind: 'stats'; spec: StatsSpec }
  | { kind: 'circuit'; spec: CircuitSpec }
  | { kind: 'motion'; spec: MotionSpec }
  | { kind: 'incline'; spec: InclineSpec }
  | { kind: 'gas'; spec: GasSpec }
  | { kind: 'electron'; spec: ElectronSpec }
  | { kind: 'struct'; spec: StructSpec }
  | { kind: 'chemgraph'; spec: ChemGraphSpec }
  | { kind: 'trig'; spec: TrigSpec }
  | { kind: 'probtree'; spec: TreeSpec }
  | { kind: 'numberline'; spec: NumberLineSpec }
  | { kind: 'venn'; spec: VennSpec }

export type ToolKind = ToolDoc['kind']

export interface ToolImage {
  svg: string
  width: number
  height: number
  /** lỗi nhập (dựng thêm hình học) theo dòng */
  errors?: Array<{ line: number; msg: string }>
  /** điểm/đoạn bấm được (hình học) */
  pick?: import('./geometry').GeoPick
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const toolDesc = (doc: ToolDoc) => `<desc>${esc(JSON.stringify({ deTool: doc }))}</desc>`

export function renderTool(doc: ToolDoc): ToolImage {
  switch (doc.kind) {
    case 'graph':
      // đồ thị giữ định dạng <desc> cũ ({dePlot}) để ảnh cũ/mới đọc như nhau
      return renderPlotSvg(doc.spec)
    case 'vartable':
      return renderVarTableSvg(doc.spec, toolDesc(doc))
    case 'geo2d':
      return renderGeo2dSvg(doc.spec, toolDesc(doc))
    case 'geo3d':
      return renderGeo3dSvg(doc.spec, toolDesc(doc))
    case 'signtable':
      return renderSignTableSvg(doc.spec, toolDesc(doc))
    case 'oxy':
      return renderOxySvg(doc.spec, toolDesc(doc))
    case 'stats':
      return renderStatsSvg(doc.spec, toolDesc(doc))
    case 'circuit':
      return renderCircuitSvg(doc.spec, toolDesc(doc))
    case 'motion':
      return renderMotionSvg(doc.spec, toolDesc(doc))
    case 'incline':
      return renderInclineSvg(doc.spec, toolDesc(doc))
    case 'gas':
      return renderGasSvg(doc.spec, toolDesc(doc))
    case 'electron':
      return renderElectronSvg(doc.spec, toolDesc(doc))
    case 'struct':
      return renderStructSvg(doc.spec, toolDesc(doc))
    case 'chemgraph':
      return renderChemGraphSvg(doc.spec, toolDesc(doc))
    case 'trig':
      return renderTrigSvg(doc.spec, toolDesc(doc))
    case 'probtree':
      return renderTreeSvg(doc.spec, toolDesc(doc))
    case 'numberline':
      return renderNumberLineSvg(doc.spec, toolDesc(doc))
    case 'venn':
      return renderVennSvg(doc.spec, toolDesc(doc))
  }
}

/** đọc từ SVG/data URL của ảnh công cụ */
export function readToolDoc(svgOrUrl: string | null | undefined): ToolDoc | null {
  if (!svgOrUrl) return null
  let svg = svgOrUrl
  if (svg.startsWith('data:image/svg+xml;base64,')) {
    try {
      svg = decodeURIComponent(escape(atob(svg.slice(26))))
    } catch {
      return null
    }
  }
  const m = /<desc>([^<]*)<\/desc>/.exec(svg)
  if (!m) return null
  const raw = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  return parseToolJson(raw) ?? (readPlotSpec(svg) ? { kind: 'graph', spec: readPlotSpec(svg)! } : null)
}

/** đọc attr `plot` (JSON) của ảnh trong trang đề: {kind, spec}, {deTool}, hoặc PlotSpec trần đời đầu */
export function parseToolJson(json: string | null | undefined): ToolDoc | null {
  if (!json) return null
  try {
    const v = JSON.parse(json) as Record<string, unknown>
    const doc = (v.deTool ?? v) as Partial<ToolDoc> & { curves?: unknown }
    if (doc && typeof doc === 'object' && 'kind' in doc && 'spec' in doc) return doc as ToolDoc
    if (Array.isArray(doc.curves)) return { kind: 'graph', spec: doc as unknown as PlotSpec }
    return null
  } catch {
    return null
  }
}
