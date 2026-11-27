/**
 * Kiểm tra URL ra ngoài (chặn localhost, dải IP nội bộ, DNS trỏ vào mạng riêng).
 * Tách riêng khỏi llmProxy để các function chỉ cần kiểm URL (ảnh, admin) không kéo theo cả proxy LLM.
 */
import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'

/** Dải IPv4 không được phép gọi tới (riêng / loopback / link-local / reserved). */
const BLOCKED_V4: Array<[RegExp, string]> = [
  [/^0\./, 'dải 0/8'],
  [/^10\./, 'dải riêng 10/8'],
  [/^127\./, 'loopback'],
  [/^169\.254\./, 'link-local'],
  [/^172\.(1[6-9]|2\d|3[01])\./, 'dải riêng 172.16/12'],
  [/^192\.168\./, 'dải riêng 192.168/16'],
  [/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, 'CGNAT 100.64/10'],
  [/^198\.1[89]\./, 'benchmark 198.18/15'],
  [/^192\.0\.[02]\./, 'dải đặc biệt 192.0.0/24, 192.0.2/24'],
  [/^198\.51\.100\./, 'dải tài liệu'],
  [/^203\.0\.113\./, 'dải tài liệu'],
  [/^(22[4-9]|2[3-5]\d)\./, 'multicast/reserved'],
]

/**
 * Chỉ cho phép http/https và chặn host nội bộ. URL lấy từ env do người vận hành
 * đặt, nhưng vẫn kiểm tra để một lần cấu hình nhầm không biến server thành cầu
 * nối vào mạng nội bộ.
 */
export function assertAllowedUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`LLM_BASE_URL không hợp lệ: ${raw}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('LLM_BASE_URL chỉ chấp nhận http/https')
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new Error('LLM_BASE_URL không được trỏ tới localhost')
  }
  if (isIP(host) === 4) {
    const blocked = BLOCKED_V4.find(([re]) => re.test(host))
    if (blocked) throw new Error(`LLM_BASE_URL trỏ tới địa chỉ nội bộ (${blocked[1]})`)
  }
  if (isIP(host) === 6) {
    // URL đã chuẩn hoá về dạng rút gọn chữ thường. ::ffff:, 64:ff9b::, 2002:, 2001:0: là các dạng bọc IPv4 bên trong
    if (host === '::1' || host === '::' || /^(::ffff:|64:ff9b:|2002:|2001:0:|2001:db8:|f[cdf]|fe[89ab])/.test(host)) {
      throw new Error('LLM_BASE_URL trỏ tới địa chỉ IPv6 nội bộ')
    }
  }
  return url
}

/** URL bên ngoài server sắp tải (vd. ảnh nhà cung cấp trả về): chỉ https, không kèm tài khoản, mọi địa chỉ DNS đều công khai. */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = assertAllowedUrl(raw)
  if (url.protocol !== 'https:') throw new Error('Địa chỉ phải dùng https.')
  if (url.username || url.password) throw new Error('Địa chỉ không được chứa tài khoản.')
  let addrs: Array<{ address: string; family: number }>
  try {
    addrs = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true })
  } catch {
    throw new Error('Không tìm thấy máy chủ.')
  }
  for (const a of addrs) assertAllowedUrl(a.family === 6 ? `https://[${a.address}]/` : `https://${a.address}/`)
  return url
}

/** Endpoint admin nhập trên giao diện: chỉ https, không kèm tài khoản/query, tên miền không trỏ vào mạng nội bộ. */
export async function assertSafeEndpoint(raw: string): Promise<void> {
  const url = assertAllowedUrl(raw)
  if (url.protocol !== 'https:') throw new Error('Endpoint phải dùng https.')
  if (url.username || url.password || url.search || url.hash) throw new Error('Endpoint không được chứa tài khoản hoặc tham số.')
  let addrs: Array<{ address: string; family: number }>
  try {
    addrs = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true })
  } catch {
    throw new Error('Không tìm thấy máy chủ của endpoint.')
  }
  for (const a of addrs) assertAllowedUrl(a.family === 6 ? `https://[${a.address}]/` : `https://${a.address}/`)
}
