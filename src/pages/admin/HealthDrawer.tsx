/** Panel bên phải của Tình trạng server: sửa cấu hình provider AI, Supabase và R2 chỉ xem. */
import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, PasswordInput, Spinner, inputClass } from '@/components/ui'
import { Portal } from '@/components/Portal'
import { dialog } from '@/components/Dialog'
import { resetAiProvider, saveAiProvider, type HealthProvider, type HealthService } from '@/lib/adminApi'
import { cn } from '@/lib/cn'
import { useDrawerExit } from './useDrawerExit'

export type HealthDrawerTarget = { name: string; provider: HealthProvider } | { name: string; service: HealthService }

const field = cn(inputClass, 'mt-1 w-full font-mono text-[13px] font-normal')
const labelClass = 'block text-[12.5px] font-medium text-ink'

export function HealthDrawer({
  target,
  onClose,
  onSaved,
}: {
  target: HealthDrawerTarget
  onClose: () => void
  onSaved: (providers: HealthProvider[], provider: string) => void
}) {
  const { close, backdropClass, panelClass } = useDrawerExit(onClose)
  return (
    <Portal>
      <div className={cn('fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs', backdropClass)} onClick={close} aria-hidden="true" />
      <aside
        className={cn('fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl sm:w-[480px]', panelClass)}
        role="dialog"
        aria-label={`Cấu hình ${target.name}`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[16px] font-bold text-ink">{target.name}</h2>
          <button type="button" onClick={close} className="rounded-[6px] p-1.5 text-ink-3 hover:bg-sunken hover:text-ink" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>
        {'provider' in target ? (
          <ProviderForm provider={target.provider} onCancel={close} onSaved={(list) => (onSaved(list, target.provider.provider), close())} />
        ) : (
          <div className="space-y-4 p-6">
            <div className={labelClass}>
              Endpoint
              <p className="mt-1 break-all rounded-[6px] bg-sunken px-3 py-2 font-mono text-[13px] font-normal text-ink-2">{target.service.endpoint || 'Chưa cấu hình'}</p>
            </div>
            <div className={labelClass}>
              API key
              <p className="mt-1 rounded-[6px] bg-sunken px-3 py-2 font-mono text-[13px] font-normal text-ink-2">{target.service.keyMask || 'Chưa cấu hình'}</p>
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-3">Mục này chỉ xem. Muốn đổi thì sửa biến môi trường trên Vercel, vì lưu sai từ đây có thể làm cả app ngừng hoạt động.</p>
          </div>
        )}
      </aside>
    </Portal>
  )
}

function ProviderForm({ provider: p, onCancel, onSaved }: { provider: HealthProvider; onCancel: () => void; onSaved: (list: HealthProvider[]) => void }) {
  const [model, setModel] = useState(p.model)
  const [endpoint, setEndpoint] = useState(p.endpoint)
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)

  const endpointChanged = endpoint.trim().replace(/\/+$/, '') !== p.endpoint
  const needKey = endpointChanged && !apiKey.trim()
  const dirty = model.trim() !== p.model || endpointChanged || !!apiKey.trim()

  const run = async (action: () => Promise<{ providers: HealthProvider[] }>) => {
    setBusy(true)
    try {
      onSaved((await action()).providers)
    } catch (err: unknown) {
      await dialog.alert(err instanceof Error ? err.message : 'Không lưu được cấu hình', { title: 'Lỗi lưu cấu hình' })
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    const ok = await dialog.confirm(`Xoá cấu hình đã lưu của ${p.provider} và quay về model, endpoint, API key trong biến môi trường?`, { title: 'Về mặc định', confirmLabel: 'Về mặc định' })
    if (ok) await run(() => resetAiProvider(p.provider))
  }

  return (
    <>
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <label className={labelClass}>
          Model
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={p.defaultModel} spellCheck={false} className={field} />
        </label>
        <label className={labelClass}>
          Endpoint
          <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder={p.defaultEndpoint} spellCheck={false} className={field} />
        </label>
        <label className={labelClass}>
          API key
          <PasswordInput
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={needKey ? 'Đổi endpoint thì phải nhập lại key' : `${p.keyMask}, để trống nếu giữ nguyên`}
            autoComplete="new-password"
            className={cn(field, needKey && 'border-clay')}
          />
        </label>
        <p className="text-[12.5px] leading-relaxed text-ink-3">Bấm Lưu là áp dụng cho cả app sau tối đa 30 giây và được ghi vào Nhật ký. Sau khi lưu, hệ thống tự kiểm tra lại provider này. Endpoint khác mặc định phải có tên miền trong AI_ENDPOINT_ALLOWED_HOSTS trên Vercel.</p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
        {p.custom ? (
          <Button variant="ghost" size="sm" onClick={() => void reset()} disabled={busy}>
            Về mặc định
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button variant="soft" size="sm" onClick={onCancel} disabled={busy}>
            Huỷ
          </Button>
          <Button variant="clay" size="sm" onClick={() => void run(() => saveAiProvider({ provider: p.provider, model, endpoint, apiKey }))} disabled={busy || !dirty || needKey}>
            {busy ? <Spinner className="size-3.5" /> : null}
            <span>Lưu</span>
          </Button>
        </div>
      </div>
    </>
  )
}
