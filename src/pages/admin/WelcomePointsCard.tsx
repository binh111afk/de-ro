/** Khối "Điểm chào mừng" ở AI & Server: số điểm tặng một lần cho tài khoản mới ở lượt AI đầu tiên. */
import { useState } from 'react'
import { Button, Card, Spinner, inputClass } from '@/components/ui'
import { dialog } from '@/components/Dialog'
import { setWelcomePoints } from '@/lib/adminApi'
import { cn } from '@/lib/cn'

export function WelcomePointsCard({ initial, onNotice }: { initial: number | null; onNotice: (msg: string) => void }) {
  const [value, setValue] = useState(String(initial ?? 120))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const points = Number(value)
    if (!/^\d+$/.test(value.trim()) || points > 10_000) {
      await dialog.alert('Nhập số nguyên từ 0 đến 10.000.', { title: 'Điểm chào mừng' })
      return
    }
    setSaving(true)
    try {
      setValue(String(await setWelcomePoints(points)))
      onNotice('Đã lưu điểm chào mừng')
    } catch (err) {
      await dialog.alert(err instanceof Error ? err.message : 'Không lưu được điểm chào mừng', { title: 'Lỗi lưu điểm chào mừng' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
      <div className="mb-4 border-b border-line pb-4">
        <h2 className="text-[17px] font-bold text-ink">Điểm chào mừng</h2>
        <p className="text-[12.5px] text-ink-3">Tặng một lần cho tài khoản mới ở lượt AI đầu tiên. Người đã nhận không bị đổi.</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="welcome-points" className="mb-1.5 block text-[13px] font-medium text-ink">
            Số điểm
          </label>
          <input
            id="welcome-points"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className={cn(inputClass, 'w-32 text-[13.5px]')}
            disabled={saving}
          />
        </div>
        <Button variant="clay" size="sm" onClick={save} disabled={saving || value === ''}>
          {saving ? <Spinner className="size-3.5" /> : null}
          <span>Lưu</span>
        </Button>
      </div>
    </Card>
  )
}
