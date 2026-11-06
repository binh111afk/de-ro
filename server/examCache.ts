/**
 * Nhớ nội dung đề đã xuất bản trong bộ nhớ instance 60 giây: cả lớp mở đề / nộp bài cùng lúc
 * thì chỉ tải `doc` (JSON lớn) từ Supabase một lần, thay vì mỗi request một lần.
 * Giáo viên sửa đề thì tối đa 60 giây sau học sinh mới nhận bản mới.
 */
import type { ExamDoc } from '../src/data/docTypes'

const TTL_MS = 60_000
const cache = new Map<string, { at: number; row: Promise<{ doc: ExamDoc; listed: boolean } | null> }>()

export function getExamRow(base: string, key: string, id: string): Promise<{ doc: ExamDoc; listed: boolean } | null> {
  const hit = cache.get(id)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.row
  // request đến cùng lúc dùng chung một lần tải (Promise), không bắn trùng
  const row = fetch(`${base}/rest/v1/community_exams?id=eq.${id}&select=doc,listed`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    .then(async (r) => (r.ok ? (((await r.json()) as Array<{ doc: ExamDoc; listed: boolean }>)[0] ?? null) : null))
    .catch(() => null)
  if (cache.size > 200) cache.clear()
  cache.set(id, { at: Date.now(), row })
  // lỗi / không có đề thì không nhớ
  void row.then((v) => { if (!v) cache.delete(id) })
  return row
}
