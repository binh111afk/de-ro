/**
 * Đọc ảnh trang đề (PDF đã dựng thành ảnh, ảnh chụp) thành JSON câu hỏi cho Ngân hàng trong trang Admin.
 * Prompt cố định ở server: endpoint này không phải cổng gọi AI đọc ảnh tuỳ ý.
 * Chỉ thử các provider đọc được ảnh, lần lượt tới khi có kết quả.
 */
import { callAnthropic } from './anthropic.js'
import { visionTargets } from './llmProxy.js'
import { costFromUsage, logAiCall } from './ops.js'

const MAX_IMAGES = 4
const IMAGE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const TIMEOUT_MS = 150_000
const MAX_TOKENS = 16_000

const PROMPT = `Các ảnh sau là các trang liên tiếp của một đề thi tiếng Việt. Chép lại chính xác từng câu hỏi, không tự sáng tác, không sửa nội dung.
Chỉ trả về một JSON đúng dạng sau, không kèm giải thích:
{"questions":[{"number":1,"type":"trac-nghiem","prompt":"...","options":[{"key":"A","text":"..."}],"answer":"A","explanation":"","figure":{"page":1,"box":[x0,y0,x1,y1]}}],"answerKey":{"1":"A"}}
Quy tắc:
- type là một trong: trac-nghiem, dung-sai, tra-loi-ngan, tu-luan.
- prompt chỉ chứa đề bài, bỏ chữ "Câu N". Không đưa phương án hay đáp án vào prompt.
- Công thức toán viết LaTeX trong $...$.
- trac-nghiem: options có key A, B, C, D và answer là một chữ cái. dung-sai: options có key a, b, c, d và answer là chuỗi Đ/S theo thứ tự, ví dụ "ĐSĐS". tra-loi-ngan: answer là đáp số, không có options. tu-luan: không có options, lời giải (nếu có) đặt ở explanation.
- Chỉ điền answer khi trong đề thật sự có đáp án (bảng đáp án, phương án được đánh dấu). Không có thì để chuỗi rỗng, tuyệt đối không tự giải.
- Nếu các trang có bảng đáp án, ghi vào answerKey theo số câu, kể cả khi câu đó không nằm trong các trang này.
- figure: chỉ thêm khi câu có hình vẽ, biểu đồ, bảng dạng ảnh. page là số thứ tự ảnh gửi kèm tính từ 1, box là khung bao sát hình theo thang 0..1000 trên chiều rộng và chiều cao ảnh. Không có hình thì bỏ figure.
- Câu bị cắt ở mép trang, thiếu nội dung vẫn chép phần nhìn thấy.`

export class VisionInputError extends Error {}

export async function readExamPages(images: unknown, userId: string): Promise<{ content: string; model: string }> {
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES) throw new VisionInputError(`Cần gửi từ 1 đến ${MAX_IMAGES} ảnh.`)
  if (!images.every((x) => typeof x === 'string' && IMAGE.test(x))) throw new VisionInputError('Ảnh không hợp lệ.')
  const pages = images as string[]

  const targets = await visionTargets()
  if (targets.length === 0) throw new Error('Chưa có provider đọc được ảnh. Cần cấu hình FOSTA_API_KEY hoặc ANTHROPIC_API_KEY.')

  const errs: string[] = []
  for (const t of targets) {
    const t0 = Date.now()
    const log = (ok: boolean, error: string | null, usage?: unknown) => {
      const u = usage as { prompt_tokens?: number; completion_tokens?: number } | undefined
      return logAiCall({ userId, model: t.model, provider: t.provider, ok, error, promptTokens: u?.prompt_tokens, completionTokens: u?.completion_tokens, cost: costFromUsage(usage), ms: Date.now() - t0 })
    }
    try {
      let content = ''
      let usage: unknown
      if (t.anthropic) {
        const r = await callAnthropic({ apiKey: t.key, baseURL: t.url, model: t.model, messages: [{ role: 'user', content: PROMPT }], images: pages, maxTokens: MAX_TOKENS, effort: 'low', signal: AbortSignal.timeout(TIMEOUT_MS) })
        content = r.content
        usage = r.usage
      } else {
        const r = await fetch(t.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t.key}` },
          body: JSON.stringify({
            model: t.model,
            max_tokens: MAX_TOKENS,
            messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, ...pages.map((url) => ({ type: 'image_url', image_url: { url } }))] }],
          }),
          redirect: 'error',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = (await r.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: unknown }
        content = data.choices?.[0]?.message?.content ?? ''
        usage = data.usage
      }
      if (!content.trim()) throw new Error('trả về rỗng')
      await log(true, null, usage)
      return { content, model: t.model }
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 200) : String(err)
      errs.push(`${t.provider}: ${msg}`)
      await log(false, msg)
    }
  }
  throw new Error(`Không đọc được ảnh đề. ${errs.join('; ')}`)
}
