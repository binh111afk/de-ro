/** Kiểu dữ liệu của một lượt chat và các hàm thuần quanh nó (nhật ký bước, lịch sử gửi model, điểm đã tiêu). */
import { lastAiQuota, TOKENS_PER_POINT, type LlmMessage } from '@/lib/llm'
import { examIntent } from '@/lib/aiDocContext'
import type { DeckPlan } from '@/lib/aiDeck'
import type { PickedSource, SourcePack } from '@/lib/sources'
import { askHistoryText, type AiAsk } from '../AiAskPanel'
import type { Attachment } from './chatParts'

/** soạn đề, soạn slide, hay bảng vẽ (chỉ trò chuyện, chưa vẽ lên bảng) */
export type AiMode = 'exam' | 'slide' | 'board'

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** tệp đính kèm của lượt người dùng (để hiển thị lại trong chat) */
  files?: Attachment[]
  fileNames?: string[]
  pickedSources?: Pick<PickedSource, 'name' | 'kind'>[]
  askSourcePack?: SourcePack
  /** thành phần đang chọn được đính kèm (bảng vẽ, câu hỏi, slide) */
  refs?: string[]
  /** true khi đang chờ model */
  pending?: boolean
  /** 'doc' = yêu cầu soạn/sửa tài liệu, 'chat' = hỏi đáp thường */
  intent?: 'doc' | 'chat'
  /** tên các nguồn đã dùng cho lượt này (tệp mẫu / tài liệu lưu / web) */
  sources?: string[]
  /** trang web lượt tìm trên web đã dẫn */
  webSources?: Array<{ url: string; title: string }>
  /** cảnh báo nguồn (tệp không đọc được, chưa cấu hình search…) */
  sourceNote?: string
  /** thông báo lỗi nếu lượt lỗi */
  error?: string
  /** dàn ý slide chờ duyệt (chặng 26a) */
  plan?: DeckPlan
  planState?: 'pending' | 'approved' | 'cancelled'
  /** tiến trình sinh từng slide (chặng 26b) */
  progress?: { done: number; total: number; current?: string; written?: number; live?: string }
  /** soạn đề: nhật ký việc AI đang làm (chỉ bước có thật), bước cuối `active` là bước đang chạy */
  log?: ActStep[]
  /** AI hỏi lại vì yêu cầu mơ hồ; 'open' = panel hỏi đang chờ trả lời */
  ask?: AiAsk
  askState?: 'open' | 'done'
  /** kết quả không áp được vào đề: yêu cầu để gửi lại bằng nút Thử lại */
  retry?: string
  /** bản viết lại cả đề đang chờ giáo viên chọn thay hay giữ */
  replace?: { content: string; request: string }
  /** người dùng đã bấm 👎 */
  vote?: 'up' | 'down'
  /** token đã tiêu cho lượt này (chênh lệch hạn mức trước / sau); không có khi không biết hạn mức */
  cost?: number
  /** lỗi do không đủ điểm AI: kèm link nạp điểm */
  topup?: boolean
}

export interface ActStep {
  label: string
  state: 'active' | 'done' | 'failed'
  /** tóm tắt ngắn bên phải (vd "45 giây", "7/20 câu") */
  note?: string
  /** dòng chữ mờ chạy theo khi bước đang chạy: AI đang nghĩ gì / đang viết câu nào */
  live?: string
}

/** đóng bước đang chạy (xong / lỗi) */
export const closeLog = (log: ActStep[], state: 'done' | 'failed', note?: string): ActStep[] =>
  log.map((s) => (s.state === 'active' ? { ...s, state, live: undefined, ...(note !== undefined ? { note } : {}) } : s))

/** một dòng, giữ phần cuối (chữ mới nhất) */
export const tailLine = (s: string, n: number) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? `…${t.slice(-n)}` : t
}

export const leftTokens = () => (lastAiQuota ? lastAiQuota.limit - lastAiQuota.used : null)
/** token đã tiêu kể từ `start` (số còn lại lúc bắt đầu lượt); undefined khi không biết hoặc không tốn */
export const spentSince = (start: number | null) => {
  const now = leftTokens()
  if (start == null || now == null || start <= now) return undefined
  // tính theo số điểm vòng điểm hiển thị (làm tròn xuống) để hiệu khớp với con số người dùng đọc
  const pts = Math.floor(start / TOKENS_PER_POINT) - Math.floor(now / TOKENS_PER_POINT)
  return Math.max(1, pts) * TOKENS_PER_POINT
}

/** Đoán nhanh yêu cầu có sửa tài liệu không, để chọn dải trạng thái phù hợp. */
export function detectIntent(text: string, mode: AiMode): 'doc' | 'chat' {
  if (mode === 'board') return 'chat'
  if (mode === 'exam') return examIntent(text)
  const t = text.toLowerCase()
  const hints = ['slide', 'bài giảng', 'dàn ý', 'tóm tắt', 'hình ảnh', 'thêm', 'sửa', 'đổi', 'soạn', 'sinh', 'viết']
  return hints.some((h) => t.includes(h)) ? 'doc' : 'chat'
}

/** Lịch sử hội thoại gửi kèm mỗi lượt gọi model. */
export function historyOf(turns: ChatTurn[]): LlmMessage[] {
  return turns.flatMap((t) => {
    const names = t.files?.map((f) => f.name) ?? t.fileNames
    const pickedNames = t.pickedSources?.map((p) => p.name)
    if (!t.text.trim() && !names?.length && !pickedNames?.length && !t.refs?.length) return []
    return [{
      role: t.role,
      content: t.text +
        (t.ask ? `\n${askHistoryText(t.ask)}` : '') +
        (names?.length ? `\n[Tệp đính kèm: ${names.join(', ')}]` : '') +
        (pickedNames?.length ? `\n[Nguồn đính kèm: ${pickedNames.join(', ')}]` : '') +
        (t.refs?.length ? `\n[Phần đính kèm: ${t.refs.join(', ')}]` : ''),
    }]
  })
}
