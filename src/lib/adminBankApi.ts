/**
 * Client trang Admin giai đoạn 4 (Ngân hàng). Xem docs/prompt-admin-bank.md.
 * Gọi server bằng `post(action, body, read)` từ './adminApi'; dữ liệu giả khi `isAdminMock()` (dùng `wait`).
 */
import type { BankEntry } from '@/data/bank'
import { isAdminMock, post, wait } from './adminApi'

export interface BankQuestionRow {
  id: string
  data: BankEntry
  status: 'published' | 'hidden'
  updated_at: string
  updated_by: string | null
}

export type BankItemOrigin = 'goc' | 'da-sua' | 'cau-moi' | 'da-an'

export interface AdminBankItem {
  entry: BankEntry
  origin: BankItemOrigin
  updatedAt?: string
  updatedBy?: string | null
}

// ---------- Dữ liệu giả khi ?mock=1 ----------
const MOCK_OVERRIDES: BankQuestionRow[] = [
  {
    id: 'toan-l6-01',
    data: {
      id: 'toan-l6-01',
      subject: 'Toán',
      grades: ['Lớp 6'],
      type: 'trac-nghiem',
      prompt: 'Số $12$ nằm giữa hai số nguyên liên tiếp. Hai số đó là: (Đã sửa nội dung chuẩn hoá)',
      options: [
        { key: 'A', text: '$10$ và $11$' },
        { key: 'B', text: '$11$ và $13$' },
        { key: 'C', text: '$13$ và $14$' },
        { key: 'D', text: '$14$ và $15$' },
      ],
      answer: 'B',
      explanation: 'Số liền trước của $12$ là $11$, số liền sau của $12$ là $13$.',
      points: 0.25,
      tags: ['số tự nhiên', 'thứ tự', 'NB'],
      variable: false,
    },
    status: 'published',
    updated_at: '2026-11-09T10:30:00Z',
    updated_by: '00000000-0000-4000-8000-000000000000',
  },
  {
    id: 'toan-l6-03',
    data: {
      id: 'toan-l6-03',
      subject: 'Toán',
      grades: ['Lớp 6'],
      type: 'trac-nghiem',
      prompt: 'Rút gọn phân số $\\dfrac{18}{24}$ được kết quả là:',
      options: [
        { key: 'A', text: '$\\dfrac{3}{4}$' },
        { key: 'B', text: '$\\dfrac{9}{12}$' },
        { key: 'C', text: '$\\dfrac{6}{8}$' },
        { key: 'D', text: '$\\dfrac{2}{3}$' },
      ],
      answer: 'A',
      explanation: 'Chia cả tử và mẫu cho $6$: $\\dfrac{18 : 6}{24 : 6} = \\dfrac{3}{4}$.',
      points: 0.25,
      tags: ['phân số'],
      variable: true,
    },
    status: 'hidden',
    updated_at: '2026-11-08T14:15:00Z',
    updated_by: '00000000-0000-4000-8000-000000000000',
  },
  {
    id: 'db-mock-001',
    data: {
      id: 'db-mock-001',
      subject: 'Vật lí',
      grades: ['Lớp 10'],
      type: 'trac-nghiem',
      prompt: 'Một chất điểm chuyển động thẳng đều với vận tốc $v = 10\\text{ m/s}$. Quãng đường chất điểm đi được sau $5\\text{ s}$ là:',
      options: [
        { key: 'A', text: '$20\\text{ m}$' },
        { key: 'B', text: '$50\\text{ m}$' },
        { key: 'C', text: '$100\\text{ m}$' },
        { key: 'D', text: '$2\\text{ m}$' },
      ],
      answer: 'B',
      explanation: 'Quãng đường đi được trong chuyển động thẳng đều: $s = v \\cdot t = 10 \\cdot 5 = 50\\text{ m}$.',
      points: 0.25,
      tags: ['chuyển động thẳng đều', 'NB'],
      variable: true,
    },
    status: 'published',
    updated_at: '2026-11-10T09:00:00Z',
    updated_by: '00000000-0000-4000-8000-000000000000',
  },
]

let mockBankOverrides = [...MOCK_OVERRIDES]

export function _resetMockBankOverrides(): void {
  mockBankOverrides = [...MOCK_OVERRIDES]
}

// ---------- API ----------

/** Lấy toàn bộ các dòng ghi đè từ máy chủ */
export async function listBankOverrides(): Promise<BankQuestionRow[]> {
  if (isAdminMock()) {
    return wait([...mockBankOverrides])
  }
  const res = await post<{ overrides: BankQuestionRow[] }>('bank.overrides.list', {}, true)
  return res.overrides ?? []
}

/** Lưu câu hỏi (tạo mới nếu chưa có id, hoặc ghi đè câu tĩnh/sửa câu db-) */
export async function saveBankQuestion(
  entry: BankEntry,
  status: 'published' | 'hidden' = 'published',
): Promise<{ ok: boolean; id: string; entry: BankEntry }> {
  if (isAdminMock()) {
    const isNew = !entry.id || !entry.id.trim()
    const id = isNew ? `db-mock-${Date.now()}` : entry.id.trim()
    const cleanEntry: BankEntry = { ...entry, id }
    const now = new Date().toISOString()
    const idx = mockBankOverrides.findIndex((r) => r.id === id)
    if (idx >= 0) {
      mockBankOverrides[idx] = {
        id,
        data: cleanEntry,
        status,
        updated_at: now,
        updated_by: '00000000-0000-4000-8000-000000000000',
      }
    } else {
      mockBankOverrides.unshift({
        id,
        data: cleanEntry,
        status,
        updated_at: now,
        updated_by: '00000000-0000-4000-8000-000000000000',
      })
    }
    return wait({ ok: true, id, entry: cleanEntry })
  }
  return post('bank.save', { entry, status }, false)
}

/** Ẩn câu hỏi */
export async function hideBankQuestion(id: string, entry?: BankEntry): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    const idx = mockBankOverrides.findIndex((r) => r.id === id)
    const now = new Date().toISOString()
    if (idx >= 0) {
      mockBankOverrides[idx].status = 'hidden'
      mockBankOverrides[idx].updated_at = now
    } else {
      mockBankOverrides.push({
        id,
        data: entry ?? ({ id } as BankEntry),
        status: 'hidden',
        updated_at: now,
        updated_by: '00000000-0000-4000-8000-000000000000',
      })
    }
    return wait({ ok: true })
  }
  return post('bank.hide', { id, entry }, false)
}

/** Hiện lại câu hỏi */
export async function unhideBankQuestion(id: string): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    const idx = mockBankOverrides.findIndex((r) => r.id === id)
    if (idx >= 0) {
      mockBankOverrides[idx].status = 'published'
      mockBankOverrides[idx].updated_at = new Date().toISOString()
    }
    return wait({ ok: true })
  }
  return post('bank.unhide', { id }, false)
}

/** Về bản gốc: xoá dòng ghi đè */
export async function revertBankQuestion(id: string): Promise<{ ok: boolean }> {
  if (isAdminMock()) {
    mockBankOverrides = mockBankOverrides.filter((r) => r.id !== id)
    return wait({ ok: true })
  }
  return post('bank.revert', { id }, false)
}
