/**
 * "Hỏi AI" trên đoạn chữ đang bôi đen trong trình soạn đề: model chỉ trả lại
 * đoạn chữ mới, người dùng xem trước rồi mới thay vào.
 */
import { callLlm, extractJson } from './llm'
import { PLOT_COLORS, autoYRange, parseExpr, type PlotSpec } from './plot'
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
  let raw: { curves?: unknown; xMin?: unknown; xMax?: unknown; labels?: unknown; note?: unknown }
  try {
    raw = extractJson(res.content)
  } catch {
    throw new Error('AI trả về cấu hình đồ thị không đọc được, thử lại nhé.')
  }
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
    spec: {
      curves: exprs.map((expr, i) => ({ expr, color: PLOT_COLORS[i % PLOT_COLORS.length] })),
      xMin,
      xMax,
      yMin,
      yMax,
      grid: true,
      labels: raw.labels === true || exprs.length > 1,
    },
  }
}

/** câu yêu cầu tự gõ có phải là "vẽ đồ thị" không */
export const wantsPlot = (ask: string) => /(vẽ|ve|minh hoạ|minh họa).*đồ thị|đồ thị.*(vẽ|minh hoạ|minh họa)/i.test(ask)
