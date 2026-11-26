/**
 * Tiến độ xuất file, hiện ở thẻ góc dưới phải (`components/ExportToast.tsx`).
 * Bọc việc tạo + tải file bằng `trackExport(tên tệp, async () => …)`.
 */
import { create } from 'zustand'

export interface ExportJob {
  id: number
  name: string
  status: 'running' | 'done' | 'error'
  /** tiến độ thật 0–100 nếu việc tự báo được; phần còn lại thẻ tự nhích */
  pct: number
}

export const useExportJobs = create<{ jobs: ExportJob[] }>(() => ({ jobs: [] }))

let seq = 0

const patch = (id: number, p: Partial<ExportJob>) =>
  useExportJobs.setState((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) }))

export const dismissExport = (id: number) => useExportJobs.setState((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }))

/** thẻ hiện ít nhất chừng này trước khi báo xong, file nhỏ xuất quá nhanh vẫn kịp thấy */
const MIN_RUNNING_MS = 700

export async function trackExport<T>(name: string, work: (report: (pct: number) => void) => Promise<T>): Promise<T> {
  const id = ++seq
  const started = Date.now()
  useExportJobs.setState((s) => ({ jobs: [...s.jobs, { id, name, status: 'running', pct: 0 }] }))
  // chờ một nhịp cho thẻ vẽ ra rồi mới làm việc nặng (setTimeout, không rAF: tab ẩn thì rAF đứng)
  await new Promise((r) => setTimeout(r, 50))
  try {
    const result = await work((pct) => patch(id, { pct }))
    setTimeout(() => patch(id, { status: 'done', pct: 100 }), Math.max(0, MIN_RUNNING_MS - (Date.now() - started)))
    return result
  } catch (err) {
    patch(id, { status: 'error' })
    throw err
  }
}
