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
import { AC_DEFAULT, OSC_DEFAULT, OSC_Y_DEFAULT, STANDING_DEFAULT, oscPeriod, parseOscExpr, type OscQty, type OscSpec, type OscStart, type OscStartX0 } from './oscillation'
import { LENS_DEFAULT, type LensNames, type LensRay, type LensType } from './lens'

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
        grid: true,
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

/** danh sách loại hình AI được chọn + cấu hình từng loại; dùng chung cho "Vẽ hình minh hoạ" và AI soạn đề */
export const FIGURE_GUIDE =
  '1) Đồ thị hàm số: {"kind":"graph","curves":["x^2-2x"],"xMin":-2,"xMax":4,"points":"M(1; -1) chiếu"}. "points" (tuỳ chọn) chấm và ghi tên điểm đề nhắc tới (cực trị, giao điểm…), mỗi dòng một điểm, thêm "chiếu" để kẻ nét đứt xuống trục; đề gọi tên điểm nào thì PHẢI có điểm đó.\n' +
  '2) Bảng biến thiên của hàm số: {"kind":"vartable","expr":"x^3-3x+1","fname":"y"}\n' +
  '3) Bảng xét dấu của một biểu thức: {"kind":"signtable","expr":"(x-1)(x+2)/(x-3)"}\n' +
  '4) Hệ trục Oxy (điểm, vectơ, đường thẳng, đường tròn, miền nghiệm): {"kind":"oxy","xMin":-1,"xMax":5,"yMin":-1,"yMax":5,"items":"mỗi dòng một lệnh"}. ' +
  'Lệnh: "A(1; 2)", "M(2; 3) chiếu", "AB, BC", "vectơ AB", "vectơ u(2; 1)", "d: 2x - y + 1 = 0", "đường thẳng AB", "x = 2", "(P): y = x^2 - 2x", "đường tròn (I; 2)", "đường tròn (1; -2) 3", "x + y <= 4".\n' +
  '5) Hình học phẳng: {"kind":"geo2d","shape":"triangle|right-triangle|isosceles|equilateral|square|rectangle|parallelogram|trapezoid|rhombus|circle|inscribed-triangle|free","names":["A","B","C"],"altitude":false,"median":false,"diagonals":false,"circumcircle":false,"extras":"mỗi dòng một lệnh dựng thêm"}. ' +
  'Mẫu "free" (tự do theo toạ độ, "names":[]): trong "extras" (cũng dùng được cho các mẫu) hỗ trợ "A(0; 4)" / "M(2,5; 0)", "nhãn AB \\"4 km\\"", "kích thước BC \\"7 km\\"" (thêm trên/dưới/trái/phải), "đường BC kéo dài", "tia BC".\n' +
  '5b) Hình thực tế nét đơn (thang dựa tường, gấp giấy, đo chiều cao qua góc nhìn, mảnh vườn…): {"kind":"scene","text":"mỗi dòng một lệnh"}. Lệnh: "A(0; 0) B(4; 0) C(0; 3)" khai báo điểm (y hướng lên; tên bắt đầu _ thì ẩn nhãn, nối điểm ẩn bằng gạch: _G-_K); "AB, BC" đoạn; "ABCD" đa giác; "đứt MN" nét đứt; "kích thước AB \"15 cm\"" mũi tên kích thước; "góc ABC \"60°\"" cung góc tại B; "vuông ABC" góc vuông tại B; "nhãn AB \"?\"" chữ cạnh đoạn; "đất AB" / "tường AB" gạch chéo. Toạ độ gần đúng tỉ lệ số liệu đề, nhưng đoạn quá ngắn so với hình (chiều cao mắt 1,5 m bên khoảng cách 50 m…) thì vẽ to hơn tỉ lệ cho dễ nhìn; cạnh/góc đã biết dùng kích thước hoặc nhãn; cạnh cần tìm ghi \"?\" hoặc chữ, KHÔNG ghi đáp số.\n' +
  '6) Hình không gian: {"kind":"geo3d","shape":"pyramid3|pyramid3-sa|pyramid3-regular|pyramid4|pyramid4-sa|pyramid4-regular|tetrahedron|prism3|box|cube|cone|cylinder|sphere","names":["S","A","B","C","D"],"height":true,"diagonals":false,"circumsphere":false,"extras":"mỗi dòng một lệnh dựng thêm"}. "circumsphere": true vẽ mặt cầu ngoại tiếp khối (hộp, lập phương, chóp/lăng trụ đều); trong "extras" có thể đặt/đổi toạ độ 3D dạng "S(1; 0,5; 2)". ' +
  'Lệnh dựng thêm (5 và 6; không dùng cho nón, trụ, cầu): "M = trung điểm SC", "N = SB 1/3", "O = AC cắt BD", "H = hình chiếu S lên (ABCD)", "K = hình chiếu A lên SB", "G = trọng tâm ABC", "O = tâm ngoại tiếp ABC", "đường cao AH", "trung tuyến AM", "MN" (nối), "đứt MN". Đề gọi tên điểm nào (trung điểm, giao điểm, tâm I…) thì PHẢI dựng điểm đó cho hiện trên hình.\n' +
  '7) Biểu đồ thống kê: {"kind":"stats","chart":"bar|line|pie|hist|table","title":"","xLabel":"","yLabel":"","data":"dòng 1: nhãn cách nhau bởi ;\\nTên dãy: số; số; ..."}. Ghép nhóm dùng nhãn "[40; 50) [50; 60)".\n' +
  '8) Đường tròn lượng giác: {"kind":"trig","angles":"mỗi dòng một lệnh","values":true|false,"cot":true|false}. Lệnh mỗi dòng: góc "pi/3", "150°"; họ nghiệm "π/4 + kπ/2"; đặt tên điểm "M: pi/6"; điểm theo toạ độ "M(1/2; √3/2)"; tô miền nghiệm "tô: [π/6 → 5π/6)" (mũi tên →, -> hoặc đến; [ ] lấy đầu mút, ( ) không lấy); đường thẳng "y = 1/2", "x = -√2/2"; nối đa giác "nối tô: M N P" (tô nhạt; "nối tô: họ" nối cả họ nghiệm); cung giữa 2 điểm "cung: M N \\"α\\"". Ví dụ: {"kind":"trig","angles":"M: pi/6\\nN: 5pi/6\\ntô: [pi/6 → 5pi/6]\\ny = 1/2","values":true}. values=true ghi giá trị cos, sin trên trục, cot=true vẽ trục cot. Đề gọi điểm M, N… thì ghi M: góc để tên hiện trên hình.\n' +
  '9) Sơ đồ cây xác suất: {"kind":"probtree","text":"mỗi dòng một nhánh \\"Tên: xác suất\\", thụt 2 dấu cách cho nhánh con"}\n' +
  '10) Trục số biểu diễn tập hợp: {"kind":"numberline","sets":"mỗi dòng một tập, vd (-2; 3] hoặc (-oo; -1) ∪ [2; 5]"}\n' +
  '11) Biểu đồ Ven: {"kind":"venn","sets":"A, B","shade":"A ∩ B","counts":"A: 5\\nAB: 3\\nB: 4"}\n' +
  '11b) Bảng ghép nhóm (tần số ghép nhóm): {"kind":"grouped","groups":"mỗi dòng một nhóm, vd \\"[150; 155): 4\\"","label":"Chiều cao (cm)","freqLabel":"Số học sinh","view":"htable","polygon":false,"extras":""}. view: "htable" bảng ngang kiểu SGK (mặc định), "vtable" bảng dọc, "hist" biểu đồ cột liền (polygon=true vẽ thêm đa giác tần số); extras (chỉ bảng): "mid,cum,rel,total" — giá trị đại diện, tần số tích luỹ, tần số tương đối %, cột/hàng Tổng. Nhóm cuối có thể là đoạn đóng [a; b]. Đề cho bảng tần số ghép nhóm thì DÙNG loại này thay cho stats.\n' +
  '12) Mạch điện: {"kind":"circuit","text":"nguồn E = 12 V, r = 1 Ω\\nR1=4Ω - (R2=6Ω // R3=3Ω)"}. "-" nối tiếp, "//" song song, ngoặc gom cụm; linh kiện theo chữ đầu: R, Rb, Đ, A, V, K, C, L, E.\n' +
  '13) Đồ thị chuyển động: {"kind":"motion","yName":"v (m/s)","tName":"t (s)","points":"(0; 0) (2; 4) (5; 4)"}\n' +
  '14) Mặt phẳng nghiêng: {"kind":"incline","angle":30,"fms":"none|up|down","F":"none|up|down"}\n' +
  '15b) Đồ thị trạng thái khí (Vật lí 12): {"kind":"gas","axes":"pV|pT|VT","states":"1: (1; 4)\\n2: (4; 1)\\n3: (4; 4)","processes":"1-2: đẳng nhiệt\\n2-3: đẳng tích\\n3-1: đẳng áp","ticks":"value|symbol|none","showStates":true|false}. Toạ độ (ngang; dọc): p–V là (V; p), p–T là (T; p), V–T là (T; V). Số liệu phải khớp quá trình (đẳng nhiệt trên p–V: p·V bằng nhau; đẳng tích trên p–T: p/T bằng nhau…); thêm "| nhãn" sau quá trình để ghi tên đường (vd "a-b: đẳng áp | p_1"), đặt showStates=false để ẩn chấm/nhãn trạng thái; ticks "symbol" ghi p₁, V₁, T₁ thay cho số.\n' +
  '15) Cấu hình electron: {"kind":"electron","element":"Fe"}\n' +
  '16) Công thức cấu tạo hữu cơ: {"kind":"struct","formula":"CH3-CH(CH3)-CH2-OH","style":"condensed|skeletal"}. Nhánh trong ngoặc (...); điện tích cuối nhóm dùng ^+, ^-, ^2+, ^2- (vd "CH3-CH(NH3^+)-COO^-").\n' +
  '17) Đồ thị số mol (Hoá): {"kind":"chemgraph","xName":"n CO2","yName":"n↓","points":"(0; 0) (0,2; 0,2) (0,4; 0)"}\n' +
  '18) Bảng số liệu / đối chiếu tuỳ ý: {"kind":"table","cells":"hàng 1 | ô 2 | ô 3\\nhàng 2 | a | b","header":"row|col|both|none","align":"center|left|right","merges":"","border":"all|outer|horizontal","fontSize":15}. Ô xuống dòng ghi "\\\\n" (hai kí tự) trong ô; chỉ số dùng x_1, x^2; gộp ô ghi "r1,c1:r2,c2" (vd. "1,1:1,3").\n' +
  '19) Phương trình hoá học (Hoá): {"kind":"chemeq","equations":"2KMnO4 -> K2MnO4 + MnO2 + O2 [t°]","autoBalance":false,"fontSize":17,"align":"center"}. Mũi tên ->, <=>, điều kiện [trên | dưới] (có điện tích như [-OH^- | +H^+]); nhiều mũi tên một dòng đặt [điều kiện] ngay sau mỗi mũi tên; chất cấu tạo bọc trong {...} (vd "{CH3-CH(NH3^+)-COOH} <=> [-OH^- | +H^+] {CH3-CH(NH3^+)-COO^-}"). Chỉ bật autoBalance khi dòng chỉ có 1 mũi tên và không có {...}.\n' +
  '20) Đồ thị chuyển thể (Vật lí 12 — nhiệt độ theo thời gian): {"kind":"phase","yName":"t (°C)","tName":"T (phút)","points":"(0; -45)\\nA: (15; -8,83)\\nB: (27,4; -8,83)\\nC: (40 = T_1; 0)\\n(54 = T_2; 0)\\n_(66; 16)","extend":false,"dashed":true,"dots":true}. Gốc O tự đặt tại giá trị nhỏ nhất của trục dọc; dùng "60 = T_1" để ghi kí hiệu trên trục, "_(x; y)" cho điểm kéo dài không hiện vạch trục; extend=true vẽ đoạn ngang ra mép phải sau điểm cuối.\n' +
  '21) Đồ thị dao động điều hoà (Vật lí 11): {"kind":"osc","qty":"x|v|a","A":8,"period":{"by":"T|f|omega","value":2},"start":{"by":"state","x0":"0|A|-A|A/2|-A/2|A√2/2|-A√2/2|A√3/2|-A√3/2","dir":"up|down"},"tEnd":2.5,"grid":"T/8|T/4|none","ticks":"value|symbol"}. Hoặc start theo pha: {"by":"phi","phiPi":0.5} (đơn vị π). Thêm "second":{"qty":"v","dashed":true} để vẽ đường thứ hai so pha. Dùng cho dao động điều hoà hình sin. Điện xoay chiều u-i (Vật lí 12): {"kind":"osc","mode":"ac","ac":{"U0":311.13,"I0":2,"period":{"by":"f","value":50},"phiUPi":0,"phiIPi":-0.3333,"tEnd":0.03,"grid":"T/8","ticks":"value","showPhaseDiff":true}}. Sóng dừng (Vật lí 12): {"kind":"osc","mode":"standing","standing":{"length":60,"k":3,"ends":"fixed-fixed|fixed-free","A":4,"showNodes":true,"showAntinodes":true,"showDim":true}}.\n' +
  '22) Thấu kính mỏng (Vật lí 11 — tạo ảnh qua thấu kính hội tụ / phân kì): {"kind":"lens","type":"converging|diverging","f":10,"d":30,"h":2,"rays":["parallel","center","focal"],"show2F":false,"showValues":false,"hideImage":false}. f > 0, d > 0 (cm).\n' +
  '23) Sơ đồ phả hệ (Sinh học 12): {"kind":"pedigree","text":"1: nam bt\\n2: nữ bệnh\\n1 x 2 -> 3, 4\\n3: nam bt\\n4: nữ mang gen\\nhỏi 4"}. Khai báo người "id: nam|nữ|? bt|bệnh|mang gen|chết"; vợ chồng "1 x 2" (cận huyết "1 xx 2"); con "1 x 2 -> 3, 4" (sinh đôi cùng trứng "(5 6)", khác trứng "[7 8]"); "hỏi 10" đánh dấu người hỏi; đặt tên bệnh: bệnh "mù màu".\n' +
  '24) Bảng lai Punnett (Sinh học 9 & 12): {"kind":"punnett","cross":"AaBb x Aabb"}. Tối đa 3 cặp gen phân li độc lập (khung tối đa 8x8), hỗ trợ gen liên kết giới tính (XAXa x XaY), trội không hoàn toàn, tên kiểu hình, để trống (blankGrid: true).\n' +
  '25) Chuỗi và lưới thức ăn (Sinh học): {"kind":"foodweb","text":"Cỏ -> Thỏ, Chuột\\nThỏ, Chuột -> Cáo\\nVi sinh vật: phân giải","direction":"bottom-up|left-right","nodeStyle":"box|text","showLevels":true|false,"connectDecomposers":true|false}. Mũi tên -> chỉ chiều năng lượng (thức ăn -> vật ăn); máy tự xếp bậc dinh dưỡng từ dưới lên. Dùng [A] hoặc ?A để ẩn tên loài làm câu hỏi.\n' +

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
    case 'geo2d': {
      const shape = pick('shape', ['triangle', 'right-triangle', 'isosceles', 'equilateral', 'square', 'rectangle', 'parallelogram', 'trapezoid', 'rhombus', 'circle', 'inscribed-triangle', 'free'] as const, 'triangle')
      doc = {
        kind: 'geo2d',
        spec: {
          shape,
          names: shape === 'free' ? [] : names(['A', 'B', 'C', 'D']),
          altitude: bool('altitude', false),
          median: bool('median', false),
          diagonals: bool('diagonals', false),
          circumcircle: bool('circumcircle', false),
          marks: bool('marks', true),
          extras: str('extras') || undefined,
        },
      }
      break
    }
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
          circumsphere: bool('circumsphere', false) || undefined,
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
      doc = { kind: 'struct', spec: { formula: need('formula', 'Không thấy công thức cấu tạo.'), style: pick('style', ['condensed', 'skeletal'] as const, 'condensed') } }
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
        if (pRaw) {
          const by = (['T', 'f', 'omega'] as const).find((k) => k === pRaw.by) ?? 'T'
          return { by, value: parseVal(pRaw.value, by === 'omega', by === 'T' ? 2 : 1) }
        }
        if (src.omega !== undefined) return { by: 'omega', value: parseVal(src.omega, true, Math.PI) }
        if (src.f !== undefined) return { by: 'f', value: parseVal(src.f, false, 1) }
        if (src.T !== undefined) return { by: 'T', value: parseVal(src.T, false, 2) }
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
      const period = parsePeriodFrom(raw, { by: 'T', value: 2 })
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
      const rays: LensRay[] = Array.isArray(raw.rays)
        ? raw.rays.filter((r): r is LensRay => RAYS.includes(r as LensRay))
        : ['parallel', 'center', 'focal']
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

    case 'punnett':
      doc = {
        kind: 'punnett',
        spec: {
          cross: need('cross', 'Chưa có phép lai P.'),
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

    default:
      throw new Error(note || 'Không thấy gì để vẽ minh hoạ trong đoạn đã chọn.')
  }
  renderTool(doc) // vẽ thử: cấu hình sai thì báo ngay
  return doc
}


/** câu yêu cầu tự gõ có phải là "vẽ đồ thị" không */
export const wantsPlot = (ask: string) =>
  /(vẽ|ve|minh hoạ|minh họa).*(đồ thị|hình|bảng xét dấu|biểu đồ|mạch|hệ trục|miền nghiệm|bảng lai|punnett)|(đồ thị|bảng xét dấu|biểu đồ|mạch điện|bảng lai|punnett).*(vẽ|minh hoạ|minh họa)/i.test(ask)
