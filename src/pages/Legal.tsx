import { Link } from 'react-router-dom'

/** Bản sơ bộ — sẽ bổ sung chi tiết sau. Google cần 2 trang này để xác minh thương hiệu đăng nhập. */
const UPDATED = '15/11/2026'
const CONTACT = 'afkbinh1412007@gmail.com'

type Section = { h: string; p: string[] }

const PRIVACY: Section[] = [
  {
    h: 'Thông tin chúng tôi thu thập',
    p: [
      'Khi bạn tạo tài khoản bằng email hoặc đăng nhập bằng Google, chúng tôi lưu địa chỉ email, tên hiển thị và ảnh đại diện (nếu có).',
      'Nội dung bạn tạo trên đề rõ — đề thi, slide, bảng vẽ, tệp tải lên, kết quả làm bài — được lưu để bạn mở lại trên các thiết bị.',
      'Thông tin kỹ thuật cơ bản (lượt dùng AI, thống kê truy cập ẩn danh) để vận hành và chống lạm dụng.',
    ],
  },
  {
    h: 'Chúng tôi dùng thông tin để làm gì',
    p: [
      'Cho phép bạn đăng nhập, đồng bộ và chia sẻ tài liệu của mình.',
      'Cải thiện tính năng và xử lý sự cố. Chúng tôi không bán dữ liệu của bạn và không dùng cho quảng cáo.',
    ],
  },
  {
    h: 'Dữ liệu từ Google',
    p: [
      'Khi đăng nhập bằng Google, chúng tôi chỉ nhận email, tên và ảnh đại diện. Chúng tôi không truy cập Gmail, Drive hay dữ liệu Google nào khác.',
      'Việc sử dụng thông tin nhận từ Google API tuân theo Chính sách dữ liệu người dùng của Google API Services, bao gồm các yêu cầu về Sử dụng giới hạn (Limited Use).',
    ],
  },
  {
    h: 'Lưu trữ và bên thứ ba',
    p: [
      'Dữ liệu được lưu trên hạ tầng của Supabase (tài khoản, cơ sở dữ liệu), Cloudflare R2 (tệp) và Vercel (máy chủ web). Một số nội dung bạn gửi cho trợ lý AI được chuyển tới nhà cung cấp mô hình AI để xử lý.',
    ],
  },
  {
    h: 'Quyền của bạn',
    p: [
      `Bạn có thể sửa tên, ảnh đại diện trong Hồ sơ, xoá tài liệu của mình bất cứ lúc nào, hoặc yêu cầu xoá toàn bộ tài khoản bằng cách gửi email tới ${CONTACT}.`,
    ],
  },
]

const TERMS: Section[] = [
  {
    h: 'Sử dụng dịch vụ',
    p: [
      'đề rõ là công cụ hỗ trợ giáo viên soạn đề thi, slide bài giảng và chấm điểm. Bằng việc sử dụng, bạn đồng ý với các điều khoản dưới đây.',
      'Bạn chịu trách nhiệm giữ an toàn tài khoản và mọi hoạt động diễn ra dưới tài khoản của mình.',
    ],
  },
  {
    h: 'Nội dung của bạn',
    p: [
      'Bạn giữ quyền đối với nội dung mình tạo. Khi đăng đề lên mục Đề cộng đồng, bạn cho phép người dùng khác xem và làm đề đó.',
      'Không đăng nội dung vi phạm pháp luật, vi phạm bản quyền hoặc xúc phạm người khác. Chúng tôi có thể gỡ nội dung vi phạm.',
    ],
  },
  {
    h: 'Trợ lý AI',
    p: [
      'Nội dung do AI tạo có thể sai sót. Bạn cần kiểm tra lại trước khi dùng cho học sinh. Lượt dùng AI có giới hạn theo điểm của tài khoản.',
    ],
  },
  {
    h: 'Giới hạn trách nhiệm',
    p: [
      'Dịch vụ được cung cấp "như hiện có". Chúng tôi cố gắng giữ dữ liệu an toàn nhưng không bảo đảm dịch vụ luôn liên tục, không lỗi. Hãy xuất bản sao (Word, PDF) cho tài liệu quan trọng.',
    ],
  },
  {
    h: 'Thay đổi',
    p: ['Điều khoản có thể được cập nhật; ngày cập nhật ghi ở đầu trang. Tiếp tục sử dụng nghĩa là bạn đồng ý với bản mới.'],
  },
]

export default function Legal({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy'
  const sections = privacy ? PRIVACY : TERMS
  return (
    <article className="mx-auto max-w-[760px] px-5 py-12 sm:px-6">
      <p className="eyebrow mb-3">Cập nhật {UPDATED}</p>
      <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
        {privacy ? 'Chính sách quyền riêng tư' : 'Điều khoản sử dụng'}
      </h1>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-2.5 text-[17px] font-semibold text-ink">{s.h}</h2>
            <div className="space-y-2 text-[14.5px] leading-[1.75] text-ink-2">
              {s.p.map((t) => <p key={t}>{t}</p>)}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-[14px] text-ink-3">
        Liên hệ: {CONTACT} ·{' '}
        <Link to={privacy ? '/dieu-khoan' : '/quyen-rieng-tu'} className="font-semibold text-clay hover:underline">
          {privacy ? 'Điều khoản sử dụng' : 'Chính sách quyền riêng tư'}
        </Link>
      </p>
    </article>
  )
}
