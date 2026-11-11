/**
 * Cấu hình provider AI admin sửa được (bảng `ai_provider_settings`, chỉ service role đọc).
 * API key mã hoá AES-256-GCM bằng khoá suy từ `AI_SETTINGS_SECRET`.
 * Không có dòng nào hoặc đọc lỗi thì provider chạy theo biến môi trường.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

export type AiOverride = { model?: string; baseUrl?: string; apiKey?: string }
type Row = { provider: string; model: string | null; base_url: string | null; api_key_enc: string | null }

const secret = () => process.env.AI_SETTINGS_SECRET?.trim() ?? ''
const cryptoKey = () => createHash('sha256').update(secret()).digest()

export const hasAiSecret = () => secret().length >= 32

export function encryptKey(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', cryptoKey(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':')
}

/** Sai khoá hoặc dữ liệu hỏng thì trả null. */
export function decryptKey(enc: string): string | null {
  const [v, iv, tag, data] = enc.split(':')
  if (v !== 'v1' || !iv || !tag || !data || !hasAiSecret()) return null
  try {
    const d = createDecipheriv('aes-256-gcm', cryptoKey(), Buffer.from(iv, 'base64'))
    d.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8')
  } catch {
    return null
  }
}

/**
 * Tên miền được dùng làm endpoint riêng, đặt ở `AI_ENDPOINT_ALLOWED_HOSTS` (cách nhau dấu phẩy) trên Vercel.
 * Danh sách nằm ngoài tầm tay tài khoản admin: admin bị chiếm cũng không chuyển được nội dung người dùng sang máy lạ.
 */
export function isAllowedEndpoint(raw: string): boolean {
  const allowed = (process.env.AI_ENDPOINT_ALLOWED_HOSTS ?? '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
  try {
    return allowed.includes(new URL(raw).hostname.toLowerCase())
  } catch {
    return false
  }
}

/**
 * Endpoint riêng chỉ dùng khi giải mã được key riêng: không bao giờ gửi key trong env tới endpoint admin nhập.
 * Tên miền đã bị gỡ khỏi danh sách cho phép thì bỏ cả endpoint lẫn key đi kèm, kiểm tra lại mỗi lần đọc.
 */
export function rowToOverride(r: Row): AiOverride {
  const model = r.model ?? undefined
  if (r.base_url && !isAllowedEndpoint(r.base_url)) return { model }
  const apiKey = r.api_key_enc ? decryptKey(r.api_key_enc) ?? undefined : undefined
  return { model, apiKey, baseUrl: apiKey ? r.base_url ?? undefined : undefined }
}

let cache: { v: Record<string, AiOverride>; until: number } | null = null
export const resetAiOverrides = () => (cache = null)

/** Nhớ 30 giây (đổi có hiệu lực sau tối đa 30s). Đọc lỗi thì giữ giá trị đang có. */
export async function readAiOverrides(): Promise<Record<string, AiOverride>> {
  if (cache && cache.until > Date.now()) return cache.v
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  let v = cache?.v ?? {}
  if (base && key) {
    try {
      const r = await fetch(`${base}/rest/v1/ai_provider_settings?select=provider,model,base_url,api_key_enc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      })
      if (r.ok) v = Object.fromEntries(((await r.json()) as Row[]).map((row) => [row.provider, rowToOverride(row)]))
    } catch {
      /* giữ giá trị đang có */
    }
  }
  cache = { v, until: Date.now() + 30_000 }
  return v
}
