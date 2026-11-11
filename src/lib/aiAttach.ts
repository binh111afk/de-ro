/**
 * "Hỏi AI" theo thành phần đang chọn: trình soạn (bảng vẽ, soạn đề, soạn slide) đính kèm phần đang chọn
 * vào khung chat của AiPanel cùng `key`. Panel chưa mở (chưa mount) thì phần đính kèm chờ ở đây,
 * panel mở ra sẽ lấy.
 */
export interface AiRef {
  /** trùng id thì không đính kèm lại */
  id: string
  /** chữ hiện trên thẻ đính kèm, vd "Hình chữ nhật", "Câu 3" */
  label: string
  /** mô tả gửi kèm cho AI (nội dung, vị trí, id để AI sửa đúng chỗ) */
  detail: string
}

const pending = new Map<string, AiRef[]>()
export const AI_ATTACH_EVENT = 'ai-attach'

export function attachToAi(key: string, refs: AiRef[]) {
  const list = pending.get(key) ?? []
  for (const r of refs) if (!list.some((x) => x.id === r.id)) list.push(r)
  pending.set(key, list)
  window.dispatchEvent(new CustomEvent(AI_ATTACH_EVENT, { detail: { key } }))
}

export function takeAiRefs(key: string): AiRef[] {
  const list = pending.get(key) ?? []
  pending.delete(key)
  return list
}
