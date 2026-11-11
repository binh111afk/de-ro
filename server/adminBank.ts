/**
 * Admin giai đoạn 4 (Ngân hàng câu hỏi): các action của /api/admin. Xem docs/prompt-admin-bank.md.
 * Đã được gộp vào ACTIONS trong server/admin.ts; chỉ cần thêm action vào object dưới.
 * Helper dùng chung import từ './admin.js': call, audit, HttpError, str, needUser, protectTarget.
 * KHÔNG gọi các helper đó ở top-level (admin.ts và file này import vòng nhau; chỉ dùng trong `run`).
 */
import { randomUUID } from 'node:crypto'
import type { ActionMap } from './admin.js'
import { audit, call, HttpError, str } from './admin.js'

const VALID_SUBJECTS = new Set([
  'Toán',
  'Ngữ văn',
  'Tiếng Việt',
  'Tiếng Anh',
  'Vật lí',
  'Hoá học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Tin học',
  'GDKT&PL',
])

const VALID_TYPES = new Set(['trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan', 'tu-luan-dong'])

export const BANK_ACTIONS: ActionMap = {
  /** Lấy danh sách mọi câu ghi đè / câu mới / câu ẩn từ Supabase */
  'bank.overrides.list': {
    need: 'admin',
    run: async (ctx) => {
      const { data } = await call<Array<Record<string, unknown>>>(
        ctx.s,
        '/rest/v1/bank_questions?select=id,data,status,updated_at,updated_by&order=updated_at.desc',
      )
      return { overrides: data ?? [] }
    },
  },

  /** Lưu câu hỏi (thêm mới hoặc sửa câu có sẵn) */
  'bank.save': {
    need: 'admin',
    run: async (ctx, b) => {
      const raw = b.entry as Record<string, unknown> | undefined
      if (!raw || typeof raw !== 'object') {
        throw new HttpError(400, 'Thiếu dữ liệu câu hỏi.')
      }

      // 1. Kiểm tra subject
      const subject = typeof raw.subject === 'string' ? raw.subject.trim() : ''
      if (!subject || !VALID_SUBJECTS.has(subject)) {
        throw new HttpError(400, 'Môn học không hợp lệ.')
      }

      // 2. Kiểm tra type
      const type = typeof raw.type === 'string' ? raw.type.trim() : ''
      if (!type || !VALID_TYPES.has(type)) {
        throw new HttpError(400, 'Loại câu hỏi không hợp lệ.')
      }

      // 3. Kiểm tra prompt
      const prompt = typeof raw.prompt === 'string' ? raw.prompt.trim() : ''
      if (!prompt || prompt.length > 5000) {
        throw new HttpError(400, 'Nội dung câu hỏi không được rỗng và không quá 5000 ký tự.')
      }

      // 4. Kiểm tra grades
      if (!Array.isArray(raw.grades) || raw.grades.length === 0 || !raw.grades.every((g) => typeof g === 'string' && g.trim())) {
        throw new HttpError(400, 'Khối lớp phải là mảng chuỗi.')
      }

      // 5. Kiểm tra points
      const points = Number(raw.points)
      if (isNaN(points) || points <= 0) {
        throw new HttpError(400, 'Điểm số phải là số lớn hơn 0.')
      }

      // 6. Kiểm tra trắc nghiệm
      if (type === 'trac-nghiem') {
        if (!Array.isArray(raw.options) || raw.options.length < 2) {
          throw new HttpError(400, 'Câu trắc nghiệm phải có ít nhất 2 phương án.')
        }
        const hasValidOptions = raw.options.every(
          (o) => o && typeof o === 'object' && typeof (o as Record<string, unknown>).key === 'string' && typeof (o as Record<string, unknown>).text === 'string',
        )
        if (!hasValidOptions) {
          throw new HttpError(400, 'Các phương án trắc nghiệm không hợp lệ.')
        }
        const answer = typeof raw.answer === 'string' ? raw.answer.trim() : ''
        if (!answer || !raw.options.some((o) => (o as { key: string }).key === answer)) {
          throw new HttpError(400, 'Đáp án phải trỏ đúng một phương án.')
        }
      }

      // Ảnh đính kèm: chỉ nhận ảnh đã lên R2 hoặc ảnh nhúng nhỏ (bảng này ai cũng đọc được)
      if (raw.image !== undefined && raw.image !== null) {
        const src = (raw.image as { src?: unknown }).src
        if (typeof src !== 'string' || !/^(\/api\/files\/img\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(src)) {
          throw new HttpError(400, 'Ảnh của câu hỏi không hợp lệ.')
        }
      }

      // 7. Xác định id và isNew
      const rawId = typeof raw.id === 'string' ? raw.id.trim() : ''
      const isNew = !rawId
      const id = isNew ? `db-${randomUUID()}` : rawId

      const cleanEntry = {
        ...raw,
        id,
        subject,
        type,
        prompt,
        grades: raw.grades,
        points,
        tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
        variable: Boolean(raw.variable),
      }

      const status = b.status === 'hidden' ? 'hidden' : 'published'

      await call(ctx.s, '/rest/v1/bank_questions?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          id,
          data: cleanEntry,
          status,
          updated_at: new Date().toISOString(),
          updated_by: ctx.userId,
        }),
      })

      await audit(ctx, 'bank.save', id, { subject, type, isNew })
      return { ok: true, id, entry: cleanEntry }
    },
  },

  /** Ẩn một câu hỏi */
  'bank.hide': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = str(b.id, 100)
      if (!id) throw new HttpError(400, 'Thiếu id câu hỏi.')

      const { data: rows } = await call<Array<{ id: string }>>(
        ctx.s,
        `/rest/v1/bank_questions?id=eq.${encodeURIComponent(id)}&select=id`,
      )
      if (rows && rows.length > 0) {
        await call(ctx.s, `/rest/v1/bank_questions?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            status: 'hidden',
            updated_at: new Date().toISOString(),
            updated_by: ctx.userId,
          }),
        })
      } else {
        const data = b.entry && typeof b.entry === 'object' ? b.entry : { id }
        await call(ctx.s, '/rest/v1/bank_questions', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            id,
            data,
            status: 'hidden',
            updated_at: new Date().toISOString(),
            updated_by: ctx.userId,
          }),
        })
      }

      await audit(ctx, 'bank.hide', id, {})
      return { ok: true }
    },
  },

  /** Hiện lại một câu hỏi đã ẩn */
  'bank.unhide': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = str(b.id, 100)
      if (!id) throw new HttpError(400, 'Thiếu id câu hỏi.')

      await call(ctx.s, `/rest/v1/bank_questions?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'published',
          updated_at: new Date().toISOString(),
          updated_by: ctx.userId,
        }),
      })

      await audit(ctx, 'bank.unhide', id, {})
      return { ok: true }
    },
  },

  /** Xoá dòng ghi đè (câu tĩnh trở về bản gốc; câu db- thì xoá hẳn) */
  'bank.revert': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = str(b.id, 100)
      if (!id) throw new HttpError(400, 'Thiếu id câu hỏi.')

      await call(ctx.s, `/rest/v1/bank_questions?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      })

      await audit(ctx, 'bank.revert', id, {})
      return { ok: true }
    },
  },
}
