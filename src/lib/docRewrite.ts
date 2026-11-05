/**
 * "Hỏi AI" trên đoạn chữ đang bôi đen trong trình soạn đề: model chỉ trả lại
 * đoạn chữ mới, người dùng xem trước rồi mới thay vào.
 */
import { callLlm, extractJson } from './llm'
import { PLOT_COLORS, autoYRange, parseExpr, type PlotSpec } from './plot'
import { renderTool, type ToolDoc } from './toolSpec'
import { autoSignTable } from './signTable'
import { autoVarTable } from './varTable'
import { cleanRewrite } from './slideRewrite'

export const DOC_REWRITE_PRESETS = [
  { label: 'Viết lại rõ hơn', ask: 'Viết lại rõ ràng, chặt chẽ hơn, giữ nguyên ý' },
  { label: 'Ngắn gọn hơn', ask: 'Viết ngắn gọn hơn, giữ ý chính' },
  { label: 'Sửa chính tả', ask: 'Chỉ sửa lỗi chính tả, ngữ pháp, dấu câu; không đổi nội dung' },
  { label: 'Dễ hiểu hơn', ask: 'Viết lại dễ hiểu hơn cho học sinh' },
] as const

const SYSTEM =
  'Bạn sửa MỘT đoạn chữ trong đề thi/tài liệu tiếng Việt theo yêu cầu của giáo viên. ' +
  'Chỉ trả về đoạn chữ mới: không giải thích, không tiêu đề, không dấu ngoặc kép bao quanh, không markdown. ' +
  'Giữ nguyên công thức $...$, số liệu và thuật ngữ chuyên môn. Không thêm đáp án hay lời giải nếu không được yêu cầu. ' +
  'Nếu yêu cầu là một câu hỏi về đoạn chữ (không phải sửa), hãy trả lời ngắn gọn.'

export async function rewriteSelection(text: string, instruction: string, context: string, signal?: AbortSignal): Promise<string> {
  const res = await callLlm(
    [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `${context ? `Ngữ cảnh: ${context}\n` : ''}Đoạn chữ đang chọn:\n${text}\n\nYêu cầu: ${instruction}`,
      },
    ],
    { signal, reasoningEffort: 'low' },
  )
  const out = cleanRewrite(res.content).replace(/\*\*(.+?)\*\*/g, '$1')
  if (!out) throw new Error('AI không trả về nội dung, thử lại nhé.')
  return out
}

/* ------------------------------------------------------------------ *
 * "Vẽ đồ thị": AI chỉ đọc đề và trả cấu hình, app tự vẽ bằng lib/plot.ts
 * ------------------------------------------------------------------ */

const PLOT_SYSTEM =
  'Bạn đọc một đề bài Toán tiếng Việt và chọn đồ thị hàm số y = f(x) cần vẽ minh hoạ. ' +
  'Chỉ trả về MỘT object JSON, không giải thích: ' +
  '{"curves": ["biểu thức f(x)", ...], "xMin": số, "xMax": số, "labels": true|false, "note": "ghi chú ngắn hoặc chuỗi rỗng"}. ' +
  'Biểu thức viết theo biến x, dùng ^ cho luỹ thừa, sqrt(), abs() hoặc |...|, sin, cos, tan, ln, log, exp, pi; nhân ngầm được (2x). ' +
  'Tối đa 4 hàm; labels = true khi có từ 2 hàm. Chọn [xMin, xMax] vừa đủ thấy các điểm đặc biệt (đỉnh, giao điểm với trục, tiệm cận), độ rộng 6–16 đơn vị, ưu tiên số nguyên. ' +
  'Hàm có tham số (m, a…) thì chọn một giá trị minh hoạ hợp lí và ghi trong note, ví dụ "Chọn m = 1 để minh hoạ". ' +
  'note CHỈ dùng cho việc đó (hoặc khi không vẽ được); TUYỆT ĐỐI không ghi lời giải, toạ độ đỉnh, giao điểm hay đáp số — đây là đề cho học sinh. ' +
  'Nếu đề không có hàm số nào để vẽ, trả {"curves": [], "note": "lí do ngắn"}.'

export interface PlotPlan {
  spec: PlotSpec
  note: string
}

export async function planPlot(text: string, context: string, signal?: AbortSignal): Promise<PlotPlan> {
  const res = await callLlm(
    [
      { role: 'system', content: PLOT_SYSTEM },
      { role: 'user', content: `${context ? `Ngữ cảnh: ${context}\n` : ''}Đề bài:\n${text}` },
    ],
    { signal, reasoningEffort: 'low' },
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
  const [yMin, yMax] = autoYRange(fns, xMin, xMax)
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
        grid: true,
        labels: raw.labels === true || exprs.length > 1,
      },
    },
  }
}

/* ------------------------------------------------------------------ *
 * "Vẽ hình minh hoạ": AI chọn công cụ hợp đề (đồ thị, bảng xét dấu, hệ trục Oxy,
 * biểu đồ thống kê, mạch điện) và trả cấu hình dạng chữ; app tự vẽ.
 * ------------------------------------------------------------------ */

/** danh sách loại hình AI được chọn + cấu hình từng loại; dùng chung cho "Vẽ hình minh hoạ" và AI soạn đề */
export const FIGURE_GUIDE =
  '1) Đồ thị hàm số: {"kind":"graph","curves":["x^2-2x"],"xMin":-2,"xMax":4}\n' +
  '2) Bảng biến thiên của hàm số: {"kind":"vartable","expr":"x^3-3x+1","fname":"y"}\n' +
  '3) Bảng xét dấu của một biểu thức: {"kind":"signtable","expr":"(x-1)(x+2)/(x-3)"}\n' +
  '4) Hệ trục Oxy (điểm, vectơ, đường thẳng, đường tròn, miền nghiệm): {"kind":"oxy","xMin":-1,"xMax":5,"yMin":-1,"yMax":5,"items":"mỗi dòng một lệnh"}. ' +
  'Lệnh: "A(1; 2)", "M(2; 3) chiếu", "AB, BC", "vectơ AB", "vectơ u(2; 1)", "d: 2x - y + 1 = 0", "đường thẳng AB", "x = 2", "(P): y = x^2 - 2x", "đường tròn (I; 2)", "đường tròn (1; -2) 3", "x + y <= 4".\n' +
  '5) Hình học phẳng: {"kind":"geo2d","shape":"triangle|right-triangle|isosceles|equilateral|square|rectangle|parallelogram|trapezoid|rhombus|circle|inscribed-triangle","names":["A","B","C"],"altitude":false,"median":false,"diagonals":false,"circumcircle":false}\n' +
  '6) Hình không gian: {"kind":"geo3d","shape":"pyramid3|pyramid3-sa|pyramid3-regular|pyramid4|pyramid4-sa|pyramid4-regular|tetrahedron|prism3|box|cube|cone|cylinder|sphere","names":["S","A","B","C","D"],"height":true,"diagonals":false}\n' +
  '7) Biểu đồ thống kê: {"kind":"stats","chart":"bar|line|pie|hist|table","title":"","xLabel":"","yLabel":"","data":"dòng 1: nhãn cách nhau bởi ;\\nTên dãy: số; số; ..."}. Ghép nhóm dùng nhãn "[40; 50) [50; 60)".\n' +
  '8) Đường tròn lượng giác: {"kind":"trig","angles":"mỗi dòng một góc, vd pi/3"}\n' +
  '9) Sơ đồ cây xác suất: {"kind":"probtree","text":"mỗi dòng một nhánh \\"Tên: xác suất\\", thụt 2 dấu cách cho nhánh con"}\n' +
  '10) Trục số biểu diễn tập hợp: {"kind":"numberline","sets":"mỗi dòng một tập, vd (-2; 3] hoặc (-oo; -1) ∪ [2; 5]"}\n' +
  '11) Biểu đồ Ven: {"kind":"venn","sets":"A, B","shade":"A ∩ B","counts":"A: 5\\nAB: 3\\nB: 4"}\n' +
  '12) Mạch điện: {"kind":"circuit","text":"nguồn E = 12 V, r = 1 Ω\\nR1=4Ω - (R2=6Ω // R3=3Ω)"}. "-" nối tiếp, "//" song song, ngoặc gom cụm; linh kiện theo chữ đầu: R, Rb, Đ, A, V, K, C, L, E.\n' +
  '13) Đồ thị chuyển động: {"kind":"motion","yName":"v (m/s)","tName":"t (s)","points":"(0; 0) (2; 4) (5; 4)"}\n' +
  '14) Mặt phẳng nghiêng: {"kind":"incline","angle":30,"fms":"none|up|down","F":"none|up|down"}\n' +
  '15) Cấu hình electron: {"kind":"electron","element":"Fe"}\n' +
  '16) Công thức cấu tạo hữu cơ: {"kind":"struct","formula":"CH3-CH(CH3)-CH2-OH"}\n' +
  '17) Đồ thị số mol (Hoá): {"kind":"chemgraph","xName":"n CO2","yName":"n↓","points":"(0; 0) (0,2; 0,2) (0,4; 0)"}\n' +
  'Biểu thức dùng biến x, ^ cho luỹ thừa, sqrt(), ln, sin, cos; nhân ngầm được (2x).'

const TOOL_SYSTEM =
  'Bạn đọc một đề bài tiếng Việt và chọn MỘT hình minh hoạ cần vẽ. Chỉ trả về MỘT object JSON, không giải thích. Các loại:\n' +
  FIGURE_GUIDE +
  ' Có thể thêm "note". Hàm có tham số thì chọn giá trị minh hoạ và ghi trong note. ' +
  'note chỉ để ghi giá trị tham số đã chọn hoặc lí do không vẽ được; TUYỆT ĐỐI không ghi lời giải hay đáp số. ' +
  'Nếu đề không có gì để vẽ, trả {"kind":"none","note":"lí do ngắn"}.'

export interface ToolPlan {
  doc: ToolDoc
  note: string
}

const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d)

export async function planTool(text: string, context: string, signal?: AbortSignal): Promise<ToolPlan> {
  const res = await callLlm(
    [
      { role: 'system', content: TOOL_SYSTEM },
      { role: 'user', content: `${context ? `Ngữ cảnh: ${context}\n` : ''}Đề bài:\n${text}` },
    ],
    { signal, reasoningEffort: 'low' },
  )
  let raw: Record<string, unknown>
  try {
    raw = extractJson(res.content)
  } catch {
    throw new Error('AI trả về cấu hình hình vẽ không đọc được, thử lại nhé.')
  }
  return { doc: toolFromRaw(raw), note: typeof raw.note === 'string' ? raw.note.trim() : '' }
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
    case 'geo2d':
      doc = {
        kind: 'geo2d',
        spec: {
          shape: pick('shape', ['triangle', 'right-triangle', 'isosceles', 'equilateral', 'square', 'rectangle', 'parallelogram', 'trapezoid', 'rhombus', 'circle', 'inscribed-triangle'] as const, 'triangle'),
          names: names(['A', 'B', 'C', 'D']),
          altitude: bool('altitude', false),
          median: bool('median', false),
          diagonals: bool('diagonals', false),
          circumcircle: bool('circumcircle', false),
          marks: bool('marks', true),
          extras: str('extras') || undefined,
        },
      }
      break
    case 'geo3d':
      doc = {
        kind: 'geo3d',
        spec: {
          shape: pick('shape', ['pyramid3', 'pyramid3-sa', 'pyramid3-regular', 'pyramid4', 'pyramid4-sa', 'pyramid4-regular', 'tetrahedron', 'prism3', 'box', 'cube', 'cone', 'cylinder', 'sphere'] as const, 'pyramid4'),
          names: names(['S', 'A', 'B', 'C', 'D']),
          height: bool('height', true),
          diagonals: bool('diagonals', false),
          marks: bool('marks', true),
          tall: Math.min(1.6, Math.max(0.6, num(raw.tall, 1))),
          extras: str('extras') || undefined,
        },
      }
      break
    case 'stats':
      doc = {
        kind: 'stats',
        spec: { chart: pick('chart', ['bar', 'line', 'pie', 'hist', 'table'] as const, 'bar'), title: str('title'), xLabel: str('xLabel'), yLabel: str('yLabel'), values: true, data: need('data', 'Không thấy số liệu để vẽ biểu đồ.') },
      }
      break
    case 'trig':
      doc = { kind: 'trig', spec: { angles: need('angles', 'Không thấy góc để biểu diễn.'), projections: bool('projections', true), tan: bool('tan', false) } }
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
    case 'circuit':
      doc = { kind: 'circuit', spec: { text: need('text', 'Không đọc được mạch điện trong đề.'), values: true } }
      break
    case 'motion':
      doc = { kind: 'motion', spec: { yName: str('yName') || 'v (m/s)', tName: str('tName') || 't (s)', points: need('points', 'Không thấy số liệu chuyển động.'), dashed: bool('dashed', true) } }
      break
    case 'incline':
      doc = { kind: 'incline', spec: { angle: num(raw.angle, 30), P: bool('P', true), N: bool('N', true), fms: dir('fms'), F: dir('F'), showAngle: true } }
      break
    case 'electron':
      doc = { kind: 'electron', spec: { element: need('element', 'Không thấy nguyên tố.'), valenceOnly: bool('valenceOnly', false) } }
      break
    case 'struct':
      doc = { kind: 'struct', spec: { formula: need('formula', 'Không thấy công thức cấu tạo.'), style: pick('style', ['condensed', 'skeletal'] as const, 'condensed') } }
      break
    case 'chemgraph':
      doc = { kind: 'chemgraph', spec: { xName: str('xName') || 'n', yName: str('yName') || 'n↓', points: need('points', 'Không thấy số liệu đồ thị.'), dashed: bool('dashed', true) } }
      break
    default:
      throw new Error(note || 'Không thấy gì để vẽ minh hoạ trong đoạn đã chọn.')
  }
  renderTool(doc) // vẽ thử: cấu hình sai thì báo ngay
  return doc
}


/** câu yêu cầu tự gõ có phải là "vẽ đồ thị" không */
export const wantsPlot = (ask: string) =>
  /(vẽ|ve|minh hoạ|minh họa).*(đồ thị|hình|bảng xét dấu|biểu đồ|mạch|hệ trục|miền nghiệm)|(đồ thị|bảng xét dấu|biểu đồ|mạch điện).*(vẽ|minh hoạ|minh họa)/i.test(ask)
