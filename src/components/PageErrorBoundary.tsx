/**
 * Chặn lỗi trong một trang để không sập cả web thành màn trắng.
 * Hiện thông báo kèm nút tải lại; đổi trang (khoá `resetKey`) thì thử dựng lại.
 */
import { Component, type ReactNode } from 'react'
import { isChunkError } from '@/lib/lazyPage'

interface Props { children: ReactNode; resetKey?: string; compact?: boolean }
interface State { error: unknown }

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error }
  }

  componentDidCatch(error: unknown) {
    console.error('[PageErrorBoundary]', error)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const chunk = isChunkError(error)
    return (
      <div className={`flex h-full items-center justify-center px-6 text-center ${this.props.compact ? 'py-10' : 'min-h-[50vh]'}`}>
        <div className="max-w-[420px]">
          <p className="font-display text-[18px] font-semibold text-ink">
            {chunk ? 'Web vừa có bản cập nhật' : 'Phần này gặp lỗi'}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
            {chunk
              ? 'Trang đang mở là bản cũ nên không tải được phần mới. Tải lại trang để dùng bản mới nhất.'
              : 'Đã có lỗi khi hiển thị. Tải lại trang thường sẽ hết; nội dung đã lưu không bị mất.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => window.location.reload()}
              className="h-9 rounded-[8px] bg-clay px-4 text-[13.5px] font-medium text-white hover:opacity-90">
              Tải lại trang
            </button>
            {!chunk ? (
              <button type="button" onClick={() => this.setState({ error: null })}
                className="h-9 rounded-[8px] border border-line px-4 text-[13.5px] text-ink hover:bg-sunken">
                Thử lại
              </button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}
