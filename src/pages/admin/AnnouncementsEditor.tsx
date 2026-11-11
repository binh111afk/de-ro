/** Tab "Thông báo" trong Vận hành: danh sách các trang của popup ở trang chủ. */
import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, ImagePlus, Plus, Trash2 } from 'lucide-react'
import { Button, EmptyState, Spinner, inputClass } from '@/components/ui'
import { dialog } from '@/components/Dialog'
import { AnnouncementPopup } from '@/components/AnnouncementPopup'
import { isAdminMock, setAnnouncements, type Announcement } from '@/lib/adminApi'
import { uploadImage } from '@/lib/mediaStore'
import { cn } from '@/lib/cn'
import { toDatetimeLocalString, toIsoString } from './adminUtils'
import { Switch } from './Switch'

const MAX_ITEMS = 12

const blank = (image = ''): Announcement => ({ id: crypto.randomUUID(), on: true, title: '', text: '', image, tryPath: '', until: null })

const readDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const upload = async (file: File) => {
  const dataUrl = await readDataUrl(file)
  return isAdminMock() ? dataUrl : uploadImage(dataUrl)
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback)

export function AnnouncementsEditor({ initial, onNotice }: { initial: Announcement[]; onNotice: (msg: string) => void }) {
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const addImagesRef = useRef<HTMLInputElement>(null)

  const patch = (id: string, change: Partial<Announcement>) => setItems((list) => list.map((a) => (a.id === id ? { ...a, ...change } : a)))
  const move = (index: number, delta: number) =>
    setItems((list) => {
      const next = [...list]
      const [a] = next.splice(index, 1)
      next.splice(index + delta, 0, a)
      return next
    })

  const addImages = async (files: File[]) => {
    if (files.length === 0) return
    if (items.length + files.length > MAX_ITEMS) {
      await dialog.alert(`Tối đa ${MAX_ITEMS} thông báo, hiện còn thêm được ${MAX_ITEMS - items.length}.`, { title: 'Quá nhiều ảnh' })
      return
    }
    setBusy(true)
    try {
      const urls = await Promise.all(files.map(upload))
      setItems((list) => [...list, ...urls.map(blank)])
    } catch (err) {
      await dialog.alert(errorText(err, 'Không tải ảnh lên được'), { title: 'Lỗi tải ảnh' })
    } finally {
      setBusy(false)
    }
  }

  const replaceImage = async (id: string, file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      patch(id, { image: await upload(file) })
    } catch (err) {
      await dialog.alert(errorText(err, 'Không tải ảnh lên được'), { title: 'Lỗi tải ảnh' })
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await setAnnouncements(items)
      onNotice('Đã lưu thông báo.')
    } catch (err) {
      await dialog.alert(errorText(err, 'Không thể lưu thông báo'), { title: 'Lỗi lưu thông báo' })
    } finally {
      setSaving(false)
    }
  }

  const fieldClass = cn(inputClass, 'w-full text-[13.5px]')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[520px] text-[12.5px] text-ink-3">Hiện giữa trang chủ mỗi lần vào app. Người xem đóng rồi thì lần vào sau mới hiện lại. Bật tối đa 5 thông báo cùng lúc.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={addImagesRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => {
              void addImages(Array.from(e.target.files ?? []))
              e.target.value = ''
            }}
          />
          <Button variant="soft" size="sm" onClick={() => addImagesRef.current?.click()} disabled={busy || items.length >= MAX_ITEMS}>
            {busy ? <Spinner className="size-3.5" /> : <ImagePlus className="size-4" />}
            <span>Thêm nhiều ảnh</span>
          </Button>
          <Button variant="soft" size="sm" onClick={() => setItems((list) => [...list, blank()])} disabled={items.length >= MAX_ITEMS}>
            <Plus className="size-4" />
            <span>Thêm thông báo</span>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Chưa có thông báo nào" />
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <div key={a.id} className="grid gap-4 rounded-[8px] border border-line p-4 sm:grid-cols-[160px_1fr]">
              <div>
                <label className="flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-[6px] border border-dashed border-line-2 bg-sunken text-ink-3 transition-colors hover:text-ink">
                  {a.image ? <img src={a.image} alt="" className="size-full object-contain" /> : <ImagePlus className="size-5" />}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    hidden
                    onChange={(e) => {
                      void replaceImage(a.id, e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
                {a.image ? (
                  <button type="button" onClick={() => patch(a.id, { image: '' })} className="mt-1.5 text-[12px] text-ink-3 hover:text-ink">
                    Bỏ ảnh
                  </button>
                ) : null}
              </div>

              <div className="min-w-0 space-y-2.5">
                <input value={a.title} onChange={(e) => patch(a.id, { title: e.target.value.slice(0, 100) })} placeholder="Tiêu đề" aria-label="Tiêu đề" className={fieldClass} />
                <textarea value={a.text} onChange={(e) => patch(a.id, { text: e.target.value.slice(0, 500) })} rows={2} placeholder="Nội dung" aria-label="Nội dung" className={cn(fieldClass, 'resize-y')} />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <label className="block text-[12.5px] font-medium text-ink">
                    Nút Dùng thử dẫn tới
                    <input value={a.tryPath} onChange={(e) => patch(a.id, { tryPath: e.target.value })} placeholder="/soan-de (bỏ trống nếu không có)" className={cn(fieldClass, 'mt-1 font-normal')} />
                  </label>
                  <label className="block text-[12.5px] font-medium text-ink">
                    Tự tắt lúc
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalString(a.until)}
                      onChange={(e) => patch(a.id, { until: toIsoString(e.target.value) })}
                      className={cn(fieldClass, 'mt-1 font-normal')}
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <Switch id={`ann-${a.id}`} checked={a.on} onChange={(on) => patch(a.id, { on })} label={a.on ? 'Đang bật' : 'Đang tắt'} />
                  <div className="flex items-center text-ink-3">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Đưa lên" className="rounded p-1.5 hover:text-ink disabled:opacity-30">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Đưa xuống" className="rounded p-1.5 hover:text-ink disabled:opacity-30">
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => setItems((list) => list.filter((x) => x.id !== a.id))} aria-label="Xoá thông báo" className="rounded p-1.5 hover:text-clay">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="soft" size="sm" onClick={() => setPreviewing(true)} disabled={!items.some((a) => a.on)}>
          <Eye className="size-4" />
          <span>Xem trước</span>
        </Button>
        <Button variant="clay" size="sm" onClick={save} disabled={saving || busy}>
          {saving ? <Spinner className="size-3.5" /> : null}
          <span>Lưu thông báo</span>
        </Button>
      </div>

      {previewing ? <AnnouncementPopup items={items} onPreviewClose={() => setPreviewing(false)} /> : null}
    </div>
  )
}
