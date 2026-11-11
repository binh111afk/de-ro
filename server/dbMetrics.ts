/**
 * Số đo máy chủ Postgres của Supabase (CPU, RAM, ổ đĩa, kết nối) cho thẻ "Primary Database" trang Admin.
 * Nguồn: endpoint Prometheus của Supabase `/customer/v1/privileged/metrics`, đăng nhập Basic `service_role:<service key>`.
 * Supabase chỉ làm mới số đo khoảng mỗi phút nên không tính CPU từ 2 mẫu liền nhau được:
 * CPU là tải trung bình 1 phút chia số lõi (ước lượng, có tính cả thời gian chờ ổ đĩa), tối đa 100%.
 */

export type DbMetrics = {
  /** 0..100, null = không đọc được */
  cpu: number | null
  ram: number | null
  disk: number | null
  connections: number | null
  maxConnections: number | null
}

type Sample = { name: string; labels: Record<string, string>; value: number }

export function parseProm(text: string): Sample[] {
  const out: Sample[] = []
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const m = /^([a-zA-Z_:][\w:]*)(?:\{(.*)\})?\s+(\S+)/.exec(line)
    if (!m) continue
    const value = Number(m[3])
    if (!Number.isFinite(value)) continue
    const labels: Record<string, string> = {}
    for (const l of (m[2] ?? '').matchAll(/(\w+)="((?:[^"\\]|\\.)*)"/g)) labels[l[1]] = l[2]
    out.push({ name: m[1], labels, value })
  }
  return out
}

const sum = (s: Sample[], name: string, pick: (l: Record<string, string>) => boolean = () => true) =>
  s.filter((x) => x.name === name && pick(x.labels)).reduce((a, x) => a + x.value, 0)
const has = (s: Sample[], name: string) => s.some((x) => x.name === name)
const pct = (used: number, total: number) => (total > 0 ? Math.round((used / total) * 1000) / 10 : null)

export function computeMetrics(b: Sample[]): DbMetrics {
  const cores = new Set(b.filter((x) => x.name === 'node_cpu_seconds_total').map((x) => x.labels.cpu)).size
  const cpu = has(b, 'node_load1') && cores > 0 ? Math.min(100, pct(sum(b, 'node_load1'), cores) as number) : null

  const memTotal = sum(b, 'node_memory_MemTotal_bytes')
  const memAvail = sum(b, 'node_memory_MemAvailable_bytes')
  const ram = has(b, 'node_memory_MemTotal_bytes') && has(b, 'node_memory_MemAvailable_bytes') ? pct(memTotal - memAvail, memTotal) : null

  // ổ dữ liệu Postgres là /data trên Supabase; không có thì lấy /
  const mount = b.some((x) => x.name === 'node_filesystem_size_bytes' && x.labels.mountpoint === '/data') ? '/data' : '/'
  const onMount = (l: Record<string, string>) => l.mountpoint === mount
  const size = sum(b, 'node_filesystem_size_bytes', onMount)
  const avail = sum(b, 'node_filesystem_avail_bytes', onMount)
  const disk = size > 0 ? pct(size - avail, size) : null

  const connections = has(b, 'pg_stat_database_num_backends') ? Math.round(sum(b, 'pg_stat_database_num_backends')) : null
  const maxRow = b.find((x) => x.name === 'max_connections_connection_count')
  const maxConnections = maxRow ? Math.round(maxRow.value) : null

  return { cpu, ram, disk, connections, maxConnections }
}

export async function readDbMetrics(base: string, serviceKey: string): Promise<DbMetrics> {
  const auth = 'Basic ' + Buffer.from(`service_role:${serviceKey}`).toString('base64')
  const r = await fetch(`${base}/customer/v1/privileged/metrics`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10_000) })
  if (!r.ok) throw new Error(`Supabase metrics trả ${r.status}`)
  return computeMetrics(parseProm(await r.text()))
}
