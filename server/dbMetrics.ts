/**
 * Số đo máy chủ Postgres của Supabase (CPU, RAM, ổ đĩa, kết nối) cho thẻ "Primary Database" trang Admin.
 * Nguồn: endpoint Prometheus của Supabase `/customer/v1/privileged/metrics`, đăng nhập Basic `service_role:<service key>`.
 * CPU là bộ đếm cộng dồn nên lấy 2 mẫu cách nhau ~1 giây rồi tính phần trăm thời gian không rảnh.
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

/** CPU: tổng giây theo mode của tất cả lõi; trả [busy, total] */
function cpuTimes(s: Sample[]): [number, number] {
  const total = sum(s, 'node_cpu_seconds_total')
  const idle = sum(s, 'node_cpu_seconds_total', (l) => l.mode === 'idle' || l.mode === 'iowait')
  return [total - idle, total]
}

export function computeMetrics(a: Sample[], b: Sample[]): DbMetrics {
  let cpu: number | null = null
  if (has(a, 'node_cpu_seconds_total') && has(b, 'node_cpu_seconds_total')) {
    const [busy1, tot1] = cpuTimes(a)
    const [busy2, tot2] = cpuTimes(b)
    cpu = tot2 > tot1 ? pct(busy2 - busy1, tot2 - tot1) : null
  }

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
  const maxRow = b.find((x) => x.name === 'pg_settings_max_connections')
  const maxConnections = maxRow ? Math.round(maxRow.value) : null

  return { cpu, ram, disk, connections, maxConnections }
}

export async function readDbMetrics(base: string, serviceKey: string): Promise<DbMetrics> {
  const auth = 'Basic ' + Buffer.from(`service_role:${serviceKey}`).toString('base64')
  const get = async () => {
    const r = await fetch(`${base}/customer/v1/privileged/metrics`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10_000) })
    if (!r.ok) throw new Error(`Supabase metrics trả ${r.status}`)
    return parseProm(await r.text())
  }
  const a = await get()
  await new Promise((r) => setTimeout(r, 1000))
  const b = await get()
  return computeMetrics(a, b)
}
