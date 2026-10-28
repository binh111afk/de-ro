/**
 * "Hỏi AI" trên một ô chữ: model chỉ trả lại chữ mới của ô đó, engine giữ nguyên mọi thứ còn lại của slide
 * (vị trí, màu, phông, hiệu ứng) và co cỡ chữ cho vừa hộp. Lệnh sửa cả slide nằm ở slideEdit.ts.
 */
import type { SlideElement } from '@/store/docs'
import { callLlm } from './llm'
import { limitBold } from './slideMath'
import { fitFontSize } from './slideMeasure'

export const REWRITE_PRESETS = [
  { label: 'Ngắn gọn hơn', ask: 'Viết ngắn gọn hơn, giữ ý chính' },
  { label: 'Dễ hiểu hơn', ask: 'Viết lại dễ hiểu hơn cho học sinh' },
  { label: 'Thêm ví dụ', ask: 'Thêm một ví dụ ngắn, cụ thể' },
  { label: 'Viết lại', ask: 'Viết lại hay hơn, giữ nguyên ý' },
] as const

const SYSTEM =
  'Bạn sửa MỘT ô chữ trên slide bài giảng tiếng Việt theo yêu cầu của người dùng. ' +
  'Chỉ trả về nội dung mới của ô đó: không giải thích, không tiêu đề, không dấu ngoặc kép bao quanh, không markdown (trừ **đậm** cho 1–2 từ khoá). ' +
  'Giữ cấu trúc dòng của ô gốc (mỗi ý một dòng; nếu dòng gốc bắt đầu bằng "• " thì giữ). Giữ nguyên công thức $...$. ' +
  'Không dài hơn bản gốc quá nhiều trừ khi yêu cầu thêm nội dung — ô trên slide rất nhỏ.'

/** Bỏ hàng rào code, ngoặc kép bao ngoài và cụm đậm thừa trong câu trả lời của model. */
export function cleanRewrite(raw: string): string {
  let text = raw.trim().replace(/^```[a-z]*\n?|\n?```$/gi, '').trim()
  if (/^["“].*["”]$/s.test(text)) text = text.slice(1, -1).trim()
  return limitBold(text)
}

/** Chữ mới + cỡ chữ co lại cho vừa hộp (không bao giờ to hơn cỡ hiện tại, sàn 60% như FitText). */
export function rewritePatch(el: SlideElement, text: string): Partial<SlideElement> {
  const base = el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)
  const pad = el.fill ? 4 : 2
  const fontSize = fitFontSize({
    text,
    widthPct: el.w - pad,
    heightPct: el.h - 2,
    baseCqw: base,
    lineHeight: el.lineHeight ?? 1.25,
    weight: el.fontWeight ?? (el.variant === 'body' ? 500 : 600),
    letterSpacing: el.letterSpacing,
  })
  return { text, fontSize }
}

export async function rewriteElement(
  el: SlideElement,
  instruction: string,
  slideTitle: string,
  signal?: AbortSignal,
): Promise<Partial<SlideElement>> {
  const original = el.text ?? ''
  const res = await callLlm(
    [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Slide: ${slideTitle || '(không có tiêu đề)'}\nNội dung ô hiện tại:\n${original}\n\nYêu cầu: ${instruction}` },
    ],
    { signal, reasoningEffort: 'low' },
  )
  const text = cleanRewrite(res.content)
  if (!text) throw new Error('AI không trả về nội dung, thử lại nhé.')
  if (text.length > original.length * 3 + 200) throw new Error('AI viết quá dài cho một ô, hãy thử yêu cầu ngắn hơn.')
  return rewritePatch(el, text)
}
