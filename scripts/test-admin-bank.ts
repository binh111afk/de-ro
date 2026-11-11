/**
 * Test admin giai đoạn 4 (Ngân hàng câu hỏi):
 * - Quyền: moderator / user thường bị chặn 403, không token bị 401, admin được phép.
 * - Validation bank.save: từ chối câu thiếu nội dung, đáp án trỏ sai, môn lạ, điểm sai, khối lớp sai.
 * - Câu mới: tự sinh id tiền tố db-..., ghi nhận isNew: true trong audit.
 * - Các thao tác bank.save, bank.hide, bank.unhide, bank.revert đều ghi admin_audit.
 * - Hàm gộp mergeBank: ghi đè đúng id, bỏ câu ẩn, thêm câu mới.
 * - loadFullBank fallback: lỗi mạng hoặc timeout trả nguyên bản tĩnh.
 */
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { mergeBank, loadFullBank, _resetBankCache, type BankEntry, type BankOverrideRow } from '../src/data/bank.ts'

process.env.VITE_SUPABASE_URL = 'http://sb'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'

const ADMIN = '11111111-1111-4111-8111-111111111111'
const MOD = '22222222-2222-4222-8222-222222222222'
const USER = '33333333-3333-4333-8333-333333333333'
const TOKENS: Record<string, string> = { tAdmin: ADMIN, tMod: MOD, tUser: USER }
const ROLES: Record<string, string> = { [ADMIN]: 'admin', [MOD]: 'moderator' }

interface AuditLogItem {
  admin_id: string
  action: string
  target: string
  detail: Record<string, unknown>
}

const auditLogs: AuditLogItem[] = []
const dbRows: BankOverrideRow[] = []
let networkFail = false

globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  if (networkFail) {
    throw new Error('Network error (simulated)')
  }
  const url = String(input)
  const method = init.method ?? 'GET'
  const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

  if (url.endsWith('/auth/v1/user')) {
    const tok = String((init.headers as Record<string, string>)?.Authorization ?? '').replace('Bearer ', '')
    return TOKENS[tok] ? ok({ id: TOKENS[tok] }) : new Response('{}', { status: 401 })
  }

  if (url.includes('/rest/v1/user_roles')) {
    const id = /user_id=eq\.([0-9a-f-]+)/.exec(url)?.[1] ?? ''
    return ok(ROLES[id] ? [{ role: ROLES[id] }] : [])
  }

  if (url.includes('/rest/v1/admin_audit')) {
    if (init.body) {
      try {
        auditLogs.push(JSON.parse(String(init.body)) as AuditLogItem)
      } catch {}
    }
    return new Response(null, { status: 201 })
  }

  if (url.includes('/rest/v1/bank_questions')) {
    if (method === 'GET') {
      if (url.includes('id=eq.')) {
        const idMatch = /id=eq\.([^&]+)/.exec(url)?.[1]
        const id = decodeURIComponent(idMatch ?? '')
        const found = dbRows.filter((r) => r.id === id)
        return ok(found)
      }
      return ok(dbRows)
    }

    if (method === 'POST') {
      if (init.body) {
        const parsed = JSON.parse(String(init.body)) as { id: string; data: BankEntry; status: 'published' | 'hidden' }
        const idx = dbRows.findIndex((r) => r.id === parsed.id)
        if (idx >= 0) {
          dbRows[idx] = parsed
        } else {
          dbRows.push(parsed)
        }
      }
      return new Response(null, { status: 201 })
    }

    if (method === 'PATCH') {
      const idMatch = /id=eq\.([^&]+)/.exec(url)?.[1]
      const id = decodeURIComponent(idMatch ?? '')
      const parsed = JSON.parse(String(init.body)) as { status: 'published' | 'hidden' }
      const item = dbRows.find((r) => r.id === id)
      if (item) {
        item.status = parsed.status
      }
      return new Response(null, { status: 200 })
    }

    if (method === 'DELETE') {
      const idMatch = /id=eq\.([^&]+)/.exec(url)?.[1]
      const id = decodeURIComponent(idMatch ?? '')
      const idx = dbRows.findIndex((r) => r.id === id)
      if (idx >= 0) dbRows.splice(idx, 1)
      return new Response(null, { status: 200 })
    }
  }

  return ok([])
}) as typeof fetch

const { handleAdminRequest, _resetRoleCache } = await import('../server/admin.ts')

async function hit(body: unknown, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage
  Object.assign(req, {
    method: 'POST',
    headers: { host: 'x', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  })
  const out = { status: 0, body: '' }
  const res = {
    writeHead(c: number) {
      out.status = c
      return this
    },
    end(b?: string) {
      out.body = b ?? ''
    },
  } as unknown as ServerResponse
  _resetRoleCache()
  await handleAdminRequest(req, res)
  return { status: out.status, data: out.body ? JSON.parse(out.body) : {} }
}

let fail = 0
function check(name: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${name}`)
  if (!ok) fail++
}

console.log('--- 1. Kiểm tra phân quyền ngân hàng câu hỏi ---')
check('bank.overrides.list không token → 401', (await hit({ action: 'bank.overrides.list' })).status === 401)
check('bank.overrides.list user thường → 403', (await hit({ action: 'bank.overrides.list' }, 'tUser')).status === 403)
check('bank.overrides.list moderator → 403', (await hit({ action: 'bank.overrides.list' }, 'tMod')).status === 403)
check('bank.save moderator → 403', (await hit({ action: 'bank.save', entry: {} }, 'tMod')).status === 403)
check('bank.hide moderator → 403', (await hit({ action: 'bank.hide', id: 'x' }, 'tMod')).status === 403)
check('bank.unhide moderator → 403', (await hit({ action: 'bank.unhide', id: 'x' }, 'tMod')).status === 403)
check('bank.revert moderator → 403', (await hit({ action: 'bank.revert', id: 'x' }, 'tMod')).status === 403)

const listRes = await hit({ action: 'bank.overrides.list' }, 'tAdmin')
check('bank.overrides.list admin → 200', listRes.status === 200 && Array.isArray(listRes.data.overrides))

console.log('--- 2. Kiểm tra validation của bank.save ---')
check('bank.save thiếu entry → 400', (await hit({ action: 'bank.save' }, 'tAdmin')).status === 400)

const sampleValidEntry: BankEntry = {
  id: '',
  subject: 'Toán',
  grades: ['Lớp 10'],
  type: 'trac-nghiem',
  prompt: 'Tìm tập nghiệm của phương trình $x^2 - 4 = 0$.',
  options: [
    { key: 'A', text: '$\\{-2, 2\\}$' },
    { key: 'B', text: '$\\{2\\}$' },
    { key: 'C', text: '$\\{-2\\}$' },
    { key: 'D', text: '$\\varnothing$' },
  ],
  answer: 'A',
  points: 0.25,
  tags: ['phương trình', 'NB'],
  variable: false,
}

check(
  'bank.save môn lạ → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, subject: 'Môn Không Có' } }, 'tAdmin')).status === 400,
)

check(
  'bank.save thiếu prompt → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, prompt: '   ' } }, 'tAdmin')).status === 400,
)

check(
  'bank.save prompt quá 5000 ký tự → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, prompt: 'a'.repeat(5001) } }, 'tAdmin')).status === 400,
)

check(
  'bank.save loại câu lạ → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, type: 'unknown-type' } }, 'tAdmin')).status === 400,
)

check(
  'bank.save khối lớp không phải mảng chuỗi → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, grades: [] } }, 'tAdmin')).status === 400,
)

check(
  'bank.save điểm âm hoặc bằng 0 → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, points: 0 } }, 'tAdmin')).status === 400,
)

check(
  'bank.save trắc nghiệm ít hơn 2 phương án → 400',
  (
    await hit(
      { action: 'bank.save', entry: { ...sampleValidEntry, options: [{ key: 'A', text: 'Phương án duy nhất' }] } },
      'tAdmin',
    )
  ).status === 400,
)

check(
  'bank.save trắc nghiệm đáp án trỏ sai → 400',
  (await hit({ action: 'bank.save', entry: { ...sampleValidEntry, answer: 'Z' } }, 'tAdmin')).status === 400,
)

console.log('--- 3. Kiểm tra lưu câu mới và audit log ---')
auditLogs.length = 0
const saveNewRes = await hit({ action: 'bank.save', entry: sampleValidEntry }, 'tAdmin')
check('bank.save câu mới → 200', saveNewRes.status === 200)
const createdId = String(saveNewRes.data.id || '')
check('câu mới được sinh id tiền tố db-…', createdId.startsWith('db-'))
check(
  'câu mới ghi audit bank.save với isNew = true',
  auditLogs.some(
    (l) => l.action === 'bank.save' && l.target === createdId && (l.detail as Record<string, unknown>).isNew === true,
  ),
)

auditLogs.length = 0
const updateRes = await hit(
  {
    action: 'bank.save',
    entry: {
      ...sampleValidEntry,
      id: 'toan-l6-01',
      prompt: 'Prompt đã cập nhật',
    },
  },
  'tAdmin',
)
check('bank.save sửa câu cũ → 200 và giữ nguyên id', updateRes.status === 200 && updateRes.data.id === 'toan-l6-01')
check(
  'sửa câu cũ ghi audit bank.save với isNew = false',
  auditLogs.some(
    (l) => l.action === 'bank.save' && l.target === 'toan-l6-01' && (l.detail as Record<string, unknown>).isNew === false,
  ),
)

console.log('--- 4. Kiểm tra bank.hide, bank.unhide, bank.revert ---')
auditLogs.length = 0
check('bank.hide thiếu id → 400', (await hit({ action: 'bank.hide' }, 'tAdmin')).status === 400)
const hideRes = await hit({ action: 'bank.hide', id: 'toan-l6-01' }, 'tAdmin')
check('bank.hide hợp lệ → 200', hideRes.status === 200)
check('bank.hide ghi nhật ký audit', auditLogs.some((l) => l.action === 'bank.hide' && l.target === 'toan-l6-01'))

auditLogs.length = 0
check('bank.unhide thiếu id → 400', (await hit({ action: 'bank.unhide' }, 'tAdmin')).status === 400)
const unhideRes = await hit({ action: 'bank.unhide', id: 'toan-l6-01' }, 'tAdmin')
check('bank.unhide hợp lệ → 200', unhideRes.status === 200)
check('bank.unhide ghi nhật ký audit', auditLogs.some((l) => l.action === 'bank.unhide' && l.target === 'toan-l6-01'))

auditLogs.length = 0
check('bank.revert thiếu id → 400', (await hit({ action: 'bank.revert' }, 'tAdmin')).status === 400)
const revertRes = await hit({ action: 'bank.revert', id: 'toan-l6-01' }, 'tAdmin')
check('bank.revert hợp lệ → 200', revertRes.status === 200)
check('bank.revert ghi nhật ký audit', auditLogs.some((l) => l.action === 'bank.revert' && l.target === 'toan-l6-01'))

console.log('--- 5. Kiểm tra hàm gộp pure mergeBank ---')
const staticSample: BankEntry[] = [
  { ...sampleValidEntry, id: 'q1', prompt: 'Câu 1 gốc' },
  { ...sampleValidEntry, id: 'q2', prompt: 'Câu 2 gốc' },
  { ...sampleValidEntry, id: 'q3', prompt: 'Câu 3 gốc' },
]

const overridesSample: BankOverrideRow[] = [
  // q1 bị ẩn
  { id: 'q1', data: { ...sampleValidEntry, id: 'q1' }, status: 'hidden' },
  // q2 được sửa
  { id: 'q2', data: { ...sampleValidEntry, id: 'q2', prompt: 'Câu 2 đã sửa' }, status: 'published' },
  // q4 là câu mới
  { id: 'db-q4', data: { ...sampleValidEntry, id: 'db-q4', prompt: 'Câu 4 mới' }, status: 'published' },
]

const merged = mergeBank(staticSample, overridesSample)
check('hàm gộp: bỏ câu ẩn (q1 không còn)', !merged.some((q) => q.id === 'q1'))
check('hàm gộp: ghi đè đúng id (q2 có prompt mới)', merged.find((q) => q.id === 'q2')?.prompt === 'Câu 2 đã sửa')
check('hàm gộp: thêm câu mới db-q4', merged.some((q) => q.id === 'db-q4'))
check('hàm gộp: giữ nguyên câu tĩnh không đụng (q3)', merged.find((q) => q.id === 'q3')?.prompt === 'Câu 3 gốc')
check('hàm gộp: tổng số câu hợp lý', merged.length === 3)

console.log('--- 6. Kiểm tra loadFullBank fallback khi lỗi mạng ---')
_resetBankCache()
networkFail = true
try {
  const fallbackBank = await loadFullBank()
  check('lỗi mạng → loadFullBank trả nguyên bản tĩnh không bị crash', Array.isArray(fallbackBank) && fallbackBank.length > 0)
} finally {
  networkFail = false
}

console.log(`\nKết quả: ${fail === 0 ? 'TẤT CẢ ĐẠT ✅' : `${fail} ca thất bại ❌`}`)
if (fail > 0) process.exit(1)
